import { Component, Element, Event, EventEmitter, Host, Listen, Method, Prop, State, Watch, h } from '@stencil/core';
import * as yup from 'yup';
import set from 'lodash/set';
import { createYupSchema, getValidationErrors } from '../../utils/utils';
import { FormDocument, FormField, computeVisibility, flattenFields, isContainer, isLayoutType, rowLayout, sanitizeHtml } from '../../utils/schema';
import { loadDocument } from '../../utils/migrate';
import { FormTheme, googleFontUrl, resolveTheme, safeImageUrl, themeToCssVars } from '../../utils/themes';
import { ADDRESS_PROVIDERS, addressSource } from '../../utils/search';
import { CaptchaController, captchaConfig, captchaProvider, hasWidget, mountCaptcha } from '../../utils/captcha';
import { I18nConfig, availableLanguages, createTranslator, languageInfo, localizeDocument, matchLanguage, resolveLanguage } from '../../utils/i18n';

const DEFAULT_SETTINGS = {
  autofill: true,
  showTitle: true,
  showProgress: true,
  hideSubmitButton: false,
  allowResubmit: true,
  redirectUrl: '',
};

const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5z';

@Component({
  tag: 're-form-generator',
  styleUrl: 're-form-generator.scss',
  shadow: false,
})
export class ReFormGenerator {
  @Element() el: HTMLElement;

  /** The form definition: a v2 document, or a v1 array of fields (migrated automatically). Object or JSON string. */
  @Prop() schema: any = [];
  @Prop() formId: string;
  /** Initial values, keyed by field `model`. */
  @Prop() model: any = {};
  /** Where to send the answers: { endpoint, httpMethod, bearerToken, headers, formData, recaptchaSiteKey, webhookEndpoint, mapping }. Overrides `schema.action`. */
  @Prop() action: any = {};
  /** v1 compatibility: field mapping. Prefer `action.mapping`. */
  @Prop() mapping: any = null;
  /** Theme object (or preset id / JSON string). Overrides `schema.theme`. */
  @Prop() theme: any = null;
  /** Used by the builder: shows every field, ignores logic and disables interaction. */
  @Prop() designMode: boolean = false;
  /**
   * Forces a language (e.g. `es`, `pt-BR`), overriding browser detection and hiding the language switcher.
   * Without it the language is picked from `schema.i18n` (browser language if available, else the default).
   */
  @Prop() language: string = null;

  /** The localized document that is rendered. */
  @State() doc: FormDocument = { version: 2, fields: [] };
  /** The document as written (default language). */
  @State() sourceDoc: FormDocument = { version: 2, fields: [] };
  @State() activeLanguage: string = 'en';
  @State() values: { [key: string]: any } = {};
  @State() validationErrors: { [key: string]: string[] } = {};
  @State() currentStep: number = 0;
  @State() status: 'idle' | 'submitting' | 'success' | 'error' = 'idle';
  @State() schemaError: string = null;
  @State() hoverRating: { [model: string]: number } = {};
  /** State of the "Other…" option of radio / checkbox groups, by field model. */
  @State() others: { [model: string]: { on: boolean; text: string } } = {};
  /** What is picked in each `search` field (value + label), by field model. */
  @State() searchItems: { [model: string]: Array<{ value: any; label: string }> } = {};
  @State() migrationNotes: string[] = [];

  @Event() handleSubmit: EventEmitter<any>;
  @Event() submitted: EventEmitter<any>;
  @Event() validationError: EventEmitter<any>;
  @Event() valueChanged: EventEmitter<any>;
  /** Fires when the displayed language changes (detection on load, the switcher, `setLanguage()` or the `language` prop). */
  @Event() languageChanged: EventEmitter<{ language: string }>;

  /** Translates the built-in texts into the active language. */
  private tr = createTranslator('en');
  /** The language chosen by the visitor with the switcher / `setLanguage()`; survives schema updates. */
  private userLanguage: string = null;
  private liveValidate = false;
  private captchaCtrl: CaptchaController = null;
  private captchaMounting = false;
  /** The token the visitor got from the captcha widget (empty until solved). */
  @State() captchaToken: string = '';
  private legacy = false;

  componentWillLoad() {
    this.load(true);
  }

  componentDidLoad() {
    this.languageReady = true;
    this.languageChanged.emit({ language: this.activeLanguage });
  }

  componentDidRender() {
    this.mountCaptchaIfNeeded();
  }

  /* ----------------------------------------------------------------- captcha */

  private captchaConf() {
    return this.designMode ? null : captchaConfig(this.getSettings(), this.getAction());
  }

  /** The name the provider's token has in the answers (empty for providers without a token). */
  private captchaField() {
    const conf = this.captchaConf();
    const info = conf && captchaProvider(conf.provider);
    return info && info.token ? info.field : '';
  }

  private mountCaptchaIfNeeded() {
    const conf = this.captchaConf();
    if (!conf || !hasWidget(conf.provider) || this.captchaMounting) return;
    const container = this.el.querySelector('.rfg-captcha') as HTMLElement;
    if (!container) return;
    // the widget lives in foreign DOM: if the page element was re-created, start over with the new one
    if (this.captchaCtrl && container.childElementCount === 0) this.destroyCaptcha();
    if (this.captchaCtrl) return;
    const theme = conf.theme && conf.theme !== 'auto' ? conf.theme : getComputedStyle(this.el.querySelector('.rfg') || this.el).colorScheme === 'dark' ? 'dark' : 'light';
    this.captchaMounting = true;
    mountCaptcha(conf, container, { language: this.activeLanguage, theme, onToken: token => (this.captchaToken = token) })
      .then(controller => (this.captchaCtrl = controller))
      .catch(error => console.warn('[re-form-generator] captcha is not available', error))
      .then(() => (this.captchaMounting = false));
  }

  private destroyCaptcha() {
    if (this.captchaCtrl) {
      try {
        this.captchaCtrl.destroy();
      } catch (e) {
        /* the widget was already removed */
      }
    }
    this.captchaCtrl = null;
    this.captchaToken = '';
  }

  @Watch('schema')
  onSchemaChange() {
    this.status = 'idle';
    this.validationErrors = {};
    this.load(this.designMode);
  }

  @Watch('model')
  onModelChange() {
    this.values = { ...this.values, ...this.parseJson(this.model, {}) };
  }

  @Watch('theme')
  onThemeChange() {
    this.ensureFont();
  }

  @Watch('language')
  onLanguageProp() {
    this.userLanguage = null;
    this.applyLanguage(this.pickLanguage());
  }

  @Watch('validationErrors')
  onErrors(newValue: any) {
    this.validationError.emit(newValue);
  }

  /* ---------------------------------------------------------------- loading */

  private parseJson(value: any, fallback: any) {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return fallback;
      }
    }
    return value || fallback;
  }

  private load(resetValues: boolean) {
    try {
      const { doc, legacy, notes } = loadDocument(this.schema, { action: this.action, mapping: this.mapping });
      this.sourceDoc = doc;
      this.doc = doc;
      this.applyLanguage(this.pickLanguage(doc));
      this.legacy = legacy;
      this.migrationNotes = notes;
      this.schemaError = null;
    } catch (e) {
      this.schemaError = e.message || String(e);
      console.error('[re-form-generator] Invalid schema', e);
      return;
    }
    const defaults: { [key: string]: any } = {};
    flattenFields(this.doc.fields, true).forEach(field => {
      if (!field.model || isLayoutType(field.type)) return;
      if (field.defaultValue !== undefined) defaults[field.model] = field.defaultValue;
      else if (field.type === 'slider') defaults[field.model] = (field.config && field.config.min) || 0;
    });
    const initial = this.parseJson(this.model, {});
    this.values = resetValues ? { ...defaults, ...initial } : { ...defaults, ...this.values, ...initial };
    if (resetValues) {
      this.others = {};
      this.searchItems = {};
    }
    if (this.currentStep >= this.pagesFor(this.values).length) this.currentStep = 0;
    this.ensureFont();
  }

  private getAction(): any {
    const fromProp = this.parseJson(this.action, {});
    return { ...(this.doc.action || {}), ...fromProp, ...(this.mapping && !fromProp.mapping ? { mapping: this.parseJson(this.mapping, null) } : {}) };
  }

  private getSettings() {
    const defaults: { [key: string]: any } = {
      ...DEFAULT_SETTINGS,
      submitButtonText: this.tr('ui.submit'),
      successMessage: this.tr('ui.success'),
      errorMessage: this.tr('ui.error'),
      formErrorMessage: this.tr('ui.formError'),
    };
    // blank texts (e.g. a cleared input in the builder) mean "use the default"
    const own = this.doc.settings || {};
    Object.keys(own).forEach(key => {
      if (own[key] !== '' && own[key] !== undefined && own[key] !== null) defaults[key] = own[key];
    });
    return defaults;
  }

  /* --------------------------------------------------------------- language */

  /** Forced prop > the visitor's choice > browser detection > default language. */
  private pickLanguage(doc: FormDocument = this.sourceDoc): string {
    const i18n = doc.i18n as I18nConfig | undefined;
    if (this.language) return resolveLanguage(i18n, this.language);
    if (this.userLanguage) {
      const match = matchLanguage(this.userLanguage, availableLanguages(i18n));
      if (match) return match;
    }
    return this.designMode ? availableLanguages(i18n)[0] : resolveLanguage(i18n);
  }

  /** Re-renders the form in `language` without touching the answers. */
  private applyLanguage(language: string) {
    const changed = language !== this.activeLanguage;
    this.activeLanguage = language;
    this.tr = createTranslator(language, this.sourceDoc.i18n as I18nConfig);
    this.doc = localizeDocument(this.sourceDoc, language);
    if (changed && this.languageReady) {
      this.languageChanged.emit({ language });
      // error messages on screen should follow the language too
      if (Object.keys(this.validationErrors).length) {
        this.runValidation(this.visibleFields()).then(errors => (this.validationErrors = errors));
      }
    }
  }

  private languageReady = false;

  private switcherMode(): 'none' | 'flags' | 'dropdown' {
    const i18n = this.sourceDoc.i18n as I18nConfig | undefined;
    if (this.designMode || this.language || !i18n || availableLanguages(i18n).length < 2) return 'none';
    return i18n.switcher === 'flags' || i18n.switcher === 'dropdown' ? i18n.switcher : 'none';
  }

  private getTheme() {
    return resolveTheme({ ...(this.doc.theme || {}), ...this.parseJson(this.theme, {}) });
  }

  private ensureFont() {
    const url = googleFontUrl(this.getTheme().fontFamily);
    if (!url || typeof document === 'undefined') return;
    if (!document.head.querySelector(`link[href="${url}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    }
  }

  /* ------------------------------------------------------------- derived data */

  private visibility(values = this.values) {
    if (this.designMode) {
      const all: { [id: string]: boolean } = {};
      flattenFields(this.doc.fields).forEach(f => (all[f.id] = true));
      return all;
    }
    return computeVisibility(this.doc.fields, values);
  }

  private visibleFields(values = this.values) {
    const vis = this.visibility(values);
    return flattenFields(this.doc.fields, true).filter(f => vis[f.id]);
  }

  /**
   * Splits the fields into steps at every `pageBreak`. Hidden fields stay in their page (so they keep their
   * state), but pages without any visible field are skipped.
   */
  private pagesFor(values: { [key: string]: any }): Array<FormField[] & { title?: string }> {
    const vis = this.visibility(values);
    const firstTitle = this.doc.settings && this.doc.settings.firstStepTitle;
    const pages: Array<FormField[] & { title?: string }> = [Object.assign([] as FormField[], { title: firstTitle })];
    this.doc.fields.forEach(field => {
      if (field.type === 'pageBreak') {
        // a page break's label is the title of the step that starts after it
        if (pages[pages.length - 1].length) pages.push(Object.assign([] as FormField[], { title: field.label }));
        else if (field.label) pages[pages.length - 1].title = field.label;
      } else {
        pages[pages.length - 1].push(field);
      }
    });
    // a page counts when it has at least one visible field (rows are visible when any of their fields is)
    const shown = (f: FormField): boolean => (isContainer(f) ? flattenFields([f], true).some(c => vis[c.id]) && vis[f.id] : vis[f.id]);
    return pages.filter(page => page.some(shown));
  }

  private inputFields(fields: FormField[]) {
    return flattenFields(fields, true).filter(f => !isLayoutType(f.type) && f.model);
  }

  /* ------------------------------------------------------------ public API */

  @Method()
  async updateValue(key: string, value: any) {
    this.values = { ...this.values, [key]: value };
  }

  /** Switches the form to `language` (must be one of the document's languages, or a built-in one). */
  @Method()
  async setLanguage(language: string) {
    this.userLanguage = language;
    this.applyLanguage(this.pickLanguage());
  }

  @Method()
  async getLanguage() {
    return this.activeLanguage;
  }

  @Method()
  async getValues() {
    return this.buildPayload().payload;
  }

  @Method()
  async reset() {
    this.destroyCaptcha();
    this.status = 'idle';
    this.validationErrors = {};
    this.currentStep = 0;
    this.liveValidate = false;
    this.load(true);
  }

  @Method()
  async validate() {
    const errors = await this.runValidation(this.visibleFields());
    this.validationErrors = errors;
    return errors;
  }

  @Method()
  async submit() {
    if (this.designMode || this.status === 'submitting') return;
    const action = this.getAction();
    const fields = this.visibleFields();
    const captcha = this.captchaConf();
    const captchaField = this.captchaField();
    if (captcha && captcha.provider === 'honeypot') {
      const trap = this.el.querySelector('.rfg-hp input') as HTMLInputElement;
      if (trap && trap.value) {
        // a bot filled in the hidden field: pretend it worked and send nothing
        this.status = 'success';
        return { values: {}, response: null, error: null, blocked: true };
      }
    } else if (captchaField) {
      const token = captcha.provider === 'recaptcha3' && this.captchaCtrl ? await this.captchaCtrl.token() : this.captchaToken;
      this.values = { ...this.values, [captchaField]: token || '' };
    }
    const errors = await this.runValidation(fields, captchaField || false);
    this.liveValidate = true;
    this.validationErrors = errors;
    if (Object.keys(errors).length) {
      this.goToFirstError(errors);
      return { errors };
    }
    const { payload, files } = this.buildPayload();
    this.handleSubmit.emit(payload);
    let result: any = { values: payload, response: null, error: null };
    if (action.endpoint) {
      this.status = 'submitting';
      const outcome = await this.sendToApi(action, payload, files);
      result = { ...result, ...outcome };
      if (outcome.error) {
        this.status = 'error';
        if (this.captchaCtrl) this.captchaCtrl.reset(); // a token can only be used once
        this.submitted.emit(result);
        return result;
      }
    }
    this.status = 'success';
    this.destroyCaptcha();
    this.submitted.emit(result);
    const { redirectUrl } = this.getSettings();
    if (redirectUrl && typeof window !== 'undefined') {
      setTimeout(() => (window.location.href = redirectUrl), 1200);
    }
    return result;
  }

  /* ---------------------------------------------------------- validation */

  private async runValidation(fields: FormField[], captchaField: string | false = false) {
    const vis = this.visibility();
    const leaves = flattenFields(fields, true);
    const validator = yup.object().shape(createYupSchema(this.inputFields(leaves.filter(f => vis[f.id])), captchaField, flattenFields(this.doc.fields, true), this.tr));
    try {
      await validator.validate(this.values, { abortEarly: false });
      return {};
    } catch (err) {
      return getValidationErrors(err);
    }
  }

  private async revalidateField(field: FormField) {
    if (!this.liveValidate || !field.model) return;
    // Validate with the whole form so rules that reference other fields see their (cast) values,
    // then only take the result for this field (and the fields that compare against it).
    const dependents = flattenFields(this.doc.fields, true).filter(f => (f.validations || []).some(r => Array.isArray(r.params) && r.params[0] === field.model && /Field$|^sameAs$|^notSameAs$/.test(r.name)));
    const scope = [field, ...dependents];
    const all = await this.runValidation(this.visibleFields());
    const next = { ...this.validationErrors };
    scope.forEach(f => {
      if (!f.model) return;
      if (all[f.model]) next[f.model] = all[f.model];
      else delete next[f.model];
    });
    this.validationErrors = next;
  }

  private goToFirstError(errors: { [key: string]: string[] }) {
    const pages = this.pagesFor(this.values);
    const pageIndex = pages.findIndex(page => page.some(f => f.model && errors[f.model]));
    if (pageIndex >= 0) this.currentStep = pageIndex;
    requestAnimationFrame(() => {
      const target = this.el.querySelector('.rfg-has-error');
      if (target && (target as any).scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  private async nextStep() {
    const pages = this.pagesFor(this.values);
    const errors = await this.runValidation(pages[this.currentStep] || []);
    this.liveValidate = true;
    this.validationErrors = { ...this.validationErrors, ...errors };
    // clear stale errors of this page
    (pages[this.currentStep] || []).forEach(f => {
      if (f.model && !errors[f.model]) {
        const copy = { ...this.validationErrors };
        delete copy[f.model];
        this.validationErrors = copy;
      }
    });
    if (Object.keys(errors).length) {
      this.goToFirstError(errors);
      return;
    }
    this.currentStep = Math.min(this.currentStep + 1, pages.length - 1);
    this.scrollToTop();
  }

  private prevStep() {
    this.currentStep = Math.max(0, this.currentStep - 1);
    this.scrollToTop();
  }

  private scrollToTop() {
    requestAnimationFrame(() => this.el.scrollIntoView && this.el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  /* ------------------------------------------------------------ submitting */

  private buildPayload() {
    const action = this.getAction();
    const fields = this.inputFields(this.visibleFields());
    const files: { key: string; value: FileList; multiple: boolean }[] = [];
    let payload: { [key: string]: any } = {};
    const mapping = action.mapping;

    fields.forEach(field => {
      const key = field.model;
      const value = this.values[key];
      if (field.type === 'file') {
        if (value && value.length) files.push({ key, value, multiple: !!(field.attributes && field.attributes.multiple) });
        return;
      }
      const normalized = value === undefined ? null : value;
      if (mapping && mapping[key]) {
        mapping[key].forEach((path: string) => set(payload, path, normalized));
      } else if (!mapping) {
        payload[key] = normalized;
      }
    });
    if (mapping) {
      // Mapping entries that do not reference a field are copied as constants (v1 behaviour).
      Object.keys(mapping).forEach(key => {
        if (!fields.find(f => f.model === key) && this.values[key] !== undefined) {
          mapping[key].forEach((path: string) => set(payload, path, this.values[key]));
        }
      });
    }
    const captchaField = this.captchaField();
    if (captchaField && this.values[captchaField]) payload = { ...payload, [captchaField]: this.values[captchaField] };
    return { payload, files };
  }

  private async sendToApi(action: any, payload: any, files: { key: string; value: FileList; multiple: boolean }[]) {
    const headers: { [key: string]: string } = { ...(action.headers || {}) };
    if (action.bearerToken) headers['Authorization'] = `Bearer ${action.bearerToken}`;
    const useFormData = String(action.formData) === 'true' || files.length > 0;
    let body: any;
    if (useFormData) {
      body = new FormData();
      Object.keys(payload).forEach(key => {
        const value = payload[key];
        body.append(key, value !== null && typeof value === 'object' ? JSON.stringify(value) : value === null ? '' : value);
      });
      files.forEach(({ key, value, multiple }) => {
        Array.from(value).forEach(file => body.append(multiple ? `${key}[]` : key, file));
      });
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(payload);
    }
    try {
      const response = await fetch(action.endpoint, { method: action.httpMethod || 'POST', headers, body });
      const text = await response.text();
      let data: any = text;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        /* not json */
      }
      if (!response.ok) {
        this.triggerWebhook(action, { type: 'submit.failed', payload, actionEndpointResponse: text });
        return { response: data, error: `HTTP ${response.status}` };
      }
      this.triggerWebhook(action, { type: 'submit.succeeded', payload, actionEndpointResponse: text });
      return { response: data, error: null };
    } catch (e) {
      this.triggerWebhook(action, { type: 'submit.failed', payload, actionEndpointResponse: null, exception: String(e) });
      return { response: null, error: String(e) };
    }
  }

  private triggerWebhook(action: any, event: any) {
    const url = action.webhookEndpoint || action.webhoookEndpoint;
    if (!url) return;
    fetch(url, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ event }) }).catch(() => undefined);
  }

  /* ------------------------------------------------------ child component events */

  private handleChildValue(event: CustomEvent) {
    const modelKey = Object.keys(event.detail)[0];
    this.setValueByModel(modelKey, event.detail[modelKey]);
  }

  @Listen('multiSelectValueChanged')
  handleMultiselect(event: CustomEvent) {
    this.handleChildValue(event);
  }

  @Listen('searchValueChanged')
  handleSearchChange(event: CustomEvent) {
    const model = Object.keys(event.detail)[0];
    const items: Array<{ value: any; label: string }> = event.detail[model] || [];
    const field = flattenFields(this.doc.fields, true).find(f => f.model === model);
    this.searchItems = { ...this.searchItems, [model]: items };
    const multiple = !!(field && field.config && field.config.multiple);
    // `config.answer`: what is saved for a pick. Addresses save their text by default, other searches save the id.
    const answer = (field && field.config && field.config.answer) || (field && field.type === 'address' ? 'text' : 'id');
    const saved = (item: { value: any; label: string }) => (answer === 'text' ? item.label : answer === 'both' ? { id: item.value, label: item.label } : item.value);
    this.setValueByModel(model, multiple ? items.map(saved) : items[0] ? saved(items[0]) : '');
  }

  @Listen('selectedFileChanged')
  handleFileSelectChange(event: CustomEvent) {
    this.handleChildValue(event);
  }

  @Listen('selectedCountryChanged')
  handleCountrySelectChange(event: CustomEvent) {
    const modelKey = Object.keys(event.detail)[0];
    const country = event.detail[modelKey];
    const field = flattenFields(this.doc.fields, true).find(f => f.model === modelKey);
    const key = (field && field.modelValueKey) || 'code';
    this.setValueByModel(modelKey, country ? country[key] : null);
  }

  private setValueByModel(model: string, value: any) {
    if (this.values[model] === value) return;
    this.values = { ...this.values, [model]: value };
    this.valueChanged.emit({ [model]: value });
    const field = flattenFields(this.doc.fields, true).find(f => f.model === model);
    if (field) this.revalidateField(field);
  }

  private setValue(field: FormField, raw: any) {
    const { validationType = 'string' } = field;
    let value = raw;
    if (validationType === 'number') value = raw === '' || raw === null || raw === undefined ? '' : Number(raw);
    this.setValueByModel(field.model, value);
  }

  /* -------------------------------------------------------------- rendering */

  private optionsOf(field: FormField): { label: string; value: any; group?: string }[] {
    return (field.options || []).map((o: any) => ({ ...o, label: o.label !== undefined ? o.label : String(o.value) }));
  }

  /**
   * `settings.autofill: false` (or `attributes.autocomplete: "off"` on one field) stops the browser from offering saved
   * addresses, cards, etc. Chrome ignores a bare autocomplete="off" on address-looking fields, so the field also gets a
   * meaningless `name` (Chrome reads names like "postnummer" or "street" to guess what a field is) and the flags
   * that password managers respect.
   */
  private autofillOff(field: FormField) {
    return this.getSettings().autofill === false || (field.attributes && field.attributes.autocomplete === 'off');
  }

  private commonProps(field: FormField) {
    const off = this.autofillOff(field);
    return {
      id: field.id,
      name: off ? field.id : field.inputName || field.model,
      disabled: field.disabled,
      'aria-required': this.isRequired(field) ? 'true' : undefined,
      ...(off ? { autocomplete: 'off', 'data-lpignore': 'true', 'data-1p-ignore': 'true', 'data-form-type': 'other' } : {}),
    };
  }

  private isRequired(field: FormField) {
    return (field.validations || []).some(v => v.name === 'required');
  }

  private renderLabel(field: FormField) {
    if (!field.label) return null;
    // Search fields get a plain element instead of a <label>: Chrome reads <label> text such as "Address" and then
    // shows its saved-address list over the results. The input is tied to it with aria-labelledby instead.
    const Tag: any = field.type === 'search' || field.type === 'address' ? 'div' : 'label';
    const forProps = Tag === 'label' ? { htmlFor: field.id } : {};
    return (
      <Tag class="rfg-label" id={`${field.id}-label`} {...forProps}>
        <span innerHTML={sanitizeHtml(field.label)}></span>
        {this.isRequired(field) && <span class="rfg-required" aria-hidden="true">*</span>}
      </Tag>
    );
  }

  private renderControl(field: FormField, zIndex: number) {
    const { model } = field;
    const value = this.values[model];
    const common = this.commonProps(field);
    const attributes = field.attributes || {};

    switch (field.type) {
      case 'textarea':
        return <textarea class="rfg-control" {...common} readOnly={field.readonly} placeholder={field.placeholder} rows={4} {...attributes} value={value ?? ''} onInput={(e: any) => this.setValue(field, e.target.value)}></textarea>;

      case 'select':
        return this.renderSelect(field, common, value);

      case 'multiSelect':
        return (
          <re-multi-select
            key={`${field.id}-${this.activeLanguage}`}
            options={this.optionsOf(field).map(o => ({ value: o.value, label: o.label }))}
            inputOptions={{ placeholder: field.placeholder || this.tr('ui.multiPlaceholder'), selectedWord: (field.config && field.config.selectedWord) || this.tr('ui.selectedWord') }}
            defaultOptions={this.optionsOf(field)
              .map((o, i) => (Array.isArray(value) && value.some(v => String(v) === String(o.value)) ? i : -1))
              .filter(i => i >= 0)}
            disabled={common.disabled}
            modelKey={model}
          ></re-multi-select>
        );

      case 'countrySelect':
        return (
          <re-country-select
            key={`${field.id}-${this.activeLanguage}`}
            language={this.activeLanguage}
            inputOptions={{ placeholder: field.placeholder || this.tr('ui.searchCountry') }}
            disabled={common.disabled}
            modelKey={model}
            defaultValue={value}
            zIndex={String(zIndex)}
            inputDisplayKey={field.inputDisplayKey}
            showDialCode={field.showDialCode}
          ></re-country-select>
        );

      case 'search':
      case 'address': {
        const config = field.config || {};
        const attribution = field.type === 'address' ? config.attribution || (ADDRESS_PROVIDERS.find(p => p.id === config.provider) || {}).attribution : undefined;
        return (
          <div class="rfg-search-wrap">
          <re-search-select
            labelledBy={`${field.id}-label`}
            modelKey={model}
            source={field.type === 'address' ? addressSource(config, this.activeLanguage) : config.source}
            multiple={!!config.multiple}
            placeholder={field.placeholder}
            disabled={common.disabled}
            selected={this.searchItems[model] || []}
            texts={{ searching: this.tr('ui.searching'), noResults: this.tr('ui.noResults'), error: this.tr('ui.searchFailed'), remove: this.tr('ui.remove') }}
          ></re-search-select>
          {attribution && <div class="rfg-attribution">{attribution}</div>}
          </div>
        );
      }

      case 'file':
        return (
          <re-file-input-field
            inputAttributes={attributes}
            inputProps={{ type: 'file', name: common.name, id: field.id, disabled: common.disabled }}
            textTitle={(field.config && field.config.title) || field.textTitle || this.tr('ui.clickToUpload')}
            subTitle={(field.config && field.config.subTitle) || field.subTitle || this.tr('ui.orDragDrop')}
            placeholder={field.placeholder || this.tr('ui.anyFile')}
            modelKey={model}
          ></re-file-input-field>
        );

      case 'toggle':
        return (
          <label class="rfg-switch">
            <input type="checkbox" {...common} checked={!!value} onChange={(e: any) => this.setValueByModel(model, e.target.checked)} />
            <span class="rfg-slider"></span>
          </label>
        );

      case 'checkboxGroup':
        return (
          <div class="rfg-options" role="group" style={{ '--rfg-opt-cols': String((field.config && field.config.optionColumns) || 1) }}>
            {this.optionsOf(field).map((option, i) => {
              const checked = Array.isArray(value) && value.some(v => String(v) === String(option.value));
              return (
                <label class={`rfg-option ${checked ? 'is-checked' : ''}`}>
                  <input
                    type="checkbox"
                    name={common.name}
                    id={i === 0 ? field.id : undefined}
                    disabled={common.disabled}
                    checked={checked}
                    onChange={(e: any) => {
                      const current = Array.isArray(value) ? value : [];
                      this.setValueByModel(model, e.target.checked ? [...current, option.value] : current.filter(v => String(v) !== String(option.value)));
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
            {this.renderOther(field, 'checkbox')}
          </div>
        );

      case 'radioGroup':
        return (
          <div class="rfg-options" role="radiogroup" style={{ '--rfg-opt-cols': String((field.config && field.config.optionColumns) || 1) }}>
            {this.optionsOf(field).map((option, i) => {
              const checked = !(this.others[model] && this.others[model].on) && value !== undefined && value !== null && String(value) === String(option.value);
              return (
                <label class={`rfg-option ${checked ? 'is-checked' : ''}`}>
                  <input
                    type="radio"
                    name={`${this.formId || 'rfg'}-${common.name}`}
                    id={i === 0 ? field.id : undefined}
                    disabled={common.disabled}
                    checked={checked}
                    onChange={() => {
                      this.clearOther(model);
                      this.setValueByModel(model, option.value);
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
            {this.renderOther(field, 'radio')}
          </div>
        );

      case 'rating':
        return this.renderRating(field, value);

      case 'scale':
        return this.renderScale(field, value);

      case 'slider': {
        const { min = 0, max = 100, step = 1, unit = '' } = field.config || {};
        return (
          <div class="rfg-slider-wrap">
            <input class="rfg-range" type="range" {...common} min={min} max={max} step={step} value={value ?? min} onInput={(e: any) => this.setValue({ ...field, validationType: 'number' }, e.target.value)} />
            <output class="rfg-range-value">
              {value ?? min}
              {unit}
            </output>
          </div>
        );
      }

      default: {
        const type = field.inputType || 'text';
        if (type === 'checkbox') {
          return (
            <label class="rfg-option rfg-single-check">
              <input type="checkbox" {...common} checked={!!value} onChange={(e: any) => this.setValueByModel(model, e.target.checked)} />
              <span innerHTML={sanitizeHtml(field.checkboxLabel || field.placeholder || '')}></span>
            </label>
          );
        }
        const input = (
          <input
            class={`rfg-control rfg-input-${type}`}
            type={type}
            {...common}
            readOnly={field.readonly}
            placeholder={field.placeholder}
            {...attributes}
            value={value ?? ''}
            onInput={(e: any) => this.setValue(field, e.target.value)}
          />
        );
        // `config.prefix` / `config.suffix`: a fixed text next to the input, e.g. "m²" or "€"
        const prefix = field.config && field.config.prefix;
        const suffix = field.config && field.config.suffix;
        if (!prefix && !suffix) return input;
        return (
          <div class="rfg-addon-wrap">
            {prefix && <span class="rfg-addon rfg-addon-prefix">{prefix}</span>}
            {input}
            {suffix && <span class="rfg-addon rfg-addon-suffix">{suffix}</span>}
          </div>
        );
      }
    }
  }

  /* ---------------------------------------------- "Other…" option (radio / checkbox groups) */

  /** Turns the "Other" choice off (a regular option was picked). */
  private clearOther(model: string) {
    if (this.others[model] && this.others[model].on) this.others = { ...this.others, [model]: { ...this.others[model], on: false } };
  }

  /**
   * Updates the "Other" state and the stored answer. Radio: the answer is the typed text. Checkbox: the typed text
   * is added to the list of ticked options (and replaced as it is edited).
   */
  private setOther(field: FormField, kind: 'radio' | 'checkbox', patch: { on?: boolean; text?: string }) {
    const model = field.model;
    const prev = this.others[model] || { on: false, text: '' };
    const next = { ...prev, ...patch };
    this.others = { ...this.others, [model]: next };
    if (kind === 'radio') {
      this.setValueByModel(model, next.on ? next.text : this.values[model]);
      return;
    }
    const current: any[] = Array.isArray(this.values[model]) ? this.values[model] : [];
    const base = prev.on && prev.text ? current.filter(v => String(v) !== prev.text) : current;
    this.setValueByModel(model, next.on && next.text ? [...base, next.text] : base);
  }

  private renderOther(field: FormField, kind: 'radio' | 'checkbox') {
    if (!(field.config && field.config.allowOther)) return null;
    const model = field.model;
    const other = this.others[model] || { on: false, text: '' };
    const label = field.config.otherLabel || this.tr('ui.other');
    return (
      <div class="rfg-other">
        <label class={`rfg-option ${other.on ? 'is-checked' : ''}`}>
          <input
            type={kind}
            name={kind === 'radio' ? `${this.formId || 'rfg'}-${field.inputName || model}` : undefined}
            disabled={field.disabled}
            checked={other.on}
            onChange={(e: any) => this.setOther(field, kind, { on: kind === 'radio' ? true : e.target.checked })}
          />
          <span>{label}</span>
        </label>
        {other.on && (
          <input
            class="rfg-control rfg-other-input"
            type="text"
            aria-label={label}
            placeholder={this.tr('ui.otherPlaceholder')}
            value={other.text}
            onInput={(e: any) => this.setOther(field, kind, { text: e.target.value })}
          />
        )}
      </div>
    );
  }

  private renderSelect(field: FormField, common: any, value: any) {
    const options = this.optionsOf(field);
    const placeholder = field.placeholder;
    const groups: string[] = [];
    options.forEach(o => o.group && !groups.includes(o.group) && groups.push(o.group));
    const renderOption = (o: any) => (
      <option value={String(o.value)} selected={value !== undefined && value !== null && String(value) === String(o.value)}>
        {o.label}
      </option>
    );
    const hasValue = value !== undefined && value !== null && value !== '';
    return (
      <div class="rfg-select-wrap">
        <select
          class="rfg-control rfg-select"
          {...common}
          onChange={(e: any) => {
            const chosen = options.find(o => String(o.value) === e.target.value);
            this.setValueByModel(field.model, chosen ? chosen.value : '');
          }}
        >
          <option value="" disabled selected={!hasValue} hidden={!!placeholder}>
            {placeholder || this.tr('ui.selectOption')}
          </option>
          {options.filter(o => !o.group).map(renderOption)}
          {groups.map(group => (
            <optgroup label={group}>{options.filter(o => o.group === group).map(renderOption)}</optgroup>
          ))}
        </select>
      </div>
    );
  }

  private renderRating(field: FormField, value: any) {
    const max = (field.config && field.config.max) || 5;
    const hover = this.hoverRating[field.model];
    const shown = hover !== undefined ? hover : Number(value) || 0;
    return (
      <div class="rfg-rating" role="radiogroup" onMouseLeave={() => (this.hoverRating = { ...this.hoverRating, [field.model]: undefined })}>
        {Array.from({ length: max }, (_, i) => i + 1).map(n => (
          <button
            type="button"
            class={`rfg-star ${n <= shown ? 'is-active' : ''}`}
            id={n === 1 ? field.id : undefined}
            aria-label={this.tr('ui.ratingOf', { n, max })}
            disabled={field.disabled}
            onMouseEnter={() => (this.hoverRating = { ...this.hoverRating, [field.model]: n })}
            onClick={() => this.setValueByModel(field.model, Number(value) === n ? '' : n)}
          >
            <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
              <path d={STAR} stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    );
  }

  private renderScale(field: FormField, value: any) {
    const { min = 1, max = 10, minLabel, maxLabel } = field.config || {};
    const numbers: number[] = [];
    for (let n = min; n <= max; n++) numbers.push(n);
    return (
      <div class="rfg-scale-wrap">
        <div class="rfg-scale" role="radiogroup" style={{ '--rfg-scale-count': String(numbers.length) }}>
          {numbers.map(n => (
            <button type="button" class={`rfg-scale-btn ${Number(value) === n && value !== '' ? 'is-active' : ''}`} id={n === min ? field.id : undefined} disabled={field.disabled} onClick={() => this.setValueByModel(field.model, Number(value) === n ? '' : n)}>
              {n}
            </button>
          ))}
        </div>
        {(minLabel || maxLabel) && (
          <div class="rfg-scale-labels">
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}
      </div>
    );
  }

  private renderField(field: FormField, zIndex: number, hidden: boolean) {
    // A field hidden by logic is not put in the page at all (its answer is kept in memory). Hidden-but-present fields
    // still count for the browser: e.g. a hidden street / postal code / city next to a search box makes Chrome treat
    // the whole thing as an address form and pop up its saved addresses. Uploads stay mounted so a chosen file survives.
    if (hidden && field.type !== 'file') return null;
    if (field.type === 'heading') {
      const Tag = (field.config && field.config.level) || 'h2';
      return (
        <div key={field.id} class={`rfg-field rfg-block rfg-heading ${hidden ? 'rfg-hidden' : ''}`}> 
          <Tag innerHTML={sanitizeHtml(field.label || '')}></Tag>
          {field.helpText && <p>{field.helpText}</p>}
        </div>
      );
    }
    if (field.type === 'paragraph') {
      return (
        <div key={field.id} class={`rfg-field rfg-block rfg-paragraph ${hidden ? 'rfg-hidden' : ''}`}> 
          <p innerHTML={sanitizeHtml(field.content || '')}></p>
        </div>
      );
    }
    if (field.type === 'divider') {
      return <div key={field.id} class={`rfg-field rfg-block ${hidden ? 'rfg-hidden' : ''}`}><hr class="rfg-divider" /></div>;
    }

    const errors = field.model ? this.validationErrors[field.model] : null;
    const isInlineLabel = field.type === 'toggle';
    const isSingleCheck = field.type === 'input' && field.inputType === 'checkbox';
    return (
      <div
        key={field.id}
        data-field-id={field.id}
        class={`rfg-field rfg-type-${field.type} ${field.inputType ? `rfg-itype-${field.inputType}` : ''} ${field.inputWrapperClass || ''} ${hidden ? 'rfg-hidden' : ''} ${errors ? 'rfg-has-error' : ''}`}
        style={{ zIndex: String(zIndex) }}
      >
        {isInlineLabel ? (
          <div class="rfg-inline">
            <div class="rfg-inline-text">
              {this.renderLabel(field)}
              {field.helpText && <div class="rfg-help">{field.helpText}</div>}
            </div>
            {this.renderControl(field, zIndex)}
          </div>
        ) : (
          <div class="rfg-stack">
            {!isSingleCheck && this.renderLabel(field)}
            {field.helpText && !isSingleCheck && <div class="rfg-help">{field.helpText}</div>}
            <slot name={`field-label@${field.id}`} />
            {isSingleCheck ? (
              <div>
                {this.renderControl(field, zIndex)}
                {field.helpText && <div class="rfg-help rfg-help-check">{field.helpText}</div>}
              </div>
            ) : (
              this.renderControl(field, zIndex)
            )}
          </div>
        )}
        {errors && <div class="rfg-error" role="alert">{errors[0]}</div>}
      </div>
    );
  }

  /** A row of columns: each column is a vertical stack of fields. */
  private renderRow(row: FormField, hidden: boolean) {
    const layout = rowLayout(row);
    const vis = this.visibility();
    const empty = !this.designMode && !flattenFields([row], true).some(f => vis[f.id]);
    if (hidden || empty) return null;
    return (
      <div key={row.id} class={`rfg-row ${hidden || empty ? 'rfg-hidden' : ''}`} style={{ alignItems: layout.alignItems }}>
        {(row.columns || []).map((column, index) => (
          <div key={column.id} class="rfg-col" style={{ '--rfg-span': String(layout.spans[index]), ...(index === 0 ? { '--rfg-start': String(layout.firstColumn) } : {}) }}>
            {(column.fields || []).map(field => this.renderField(field, this.zOf(field), !vis[field.id]))}
          </div>
        ))}
      </div>
    );
  }

  private zMap: { [id: string]: number } = {};
  private zOf(field: FormField) {
    return this.zMap[field.id] || 1;
  }

  private renderFields(fields: FormField[]) {
    const vis = this.visibility();
    return (
      <div class="rfg-grid">
        {fields.map(field => (field.type === 'pageBreak' ? null : isContainer(field) ? this.renderRow(field, !vis[field.id]) : this.renderField(field, this.zOf(field), !vis[field.id])))}
      </div>
    );
  }

  /** Fills `{count:model}` (number of picked items) and `{value:model}` (the answer) into a text, e.g. a button label. */
  private interpolate(text: string): string {
    return String(text ?? '').replace(/\{(count|value):([\w.-]+)\}/g, (_match, kind, key) => {
      const v = this.values[key];
      if (kind === 'count') return String(Array.isArray(v) ? v.length : v === undefined || v === null || v === '' ? 0 : 1);
      return Array.isArray(v) ? v.join(', ') : v === undefined || v === null ? '' : String(v);
    });
  }

  /** Cover image (edge to edge) and logo, from `theme.cover` / `theme.logo`. */
  private renderBranding(theme: FormTheme) {
    if (this.designMode) return null;
    const cover = safeImageUrl(theme.cover);
    const logo = safeImageUrl(theme.logo);
    if (!cover && !logo) return null;
    return (
      <div class="rfg-brand">
        {cover && <div class="rfg-cover" role="presentation" style={{ backgroundImage: `url("${cover}")`, height: `${theme.coverHeight || 160}px` }}></div>}
        {logo && (
          <div class={`rfg-logo rfg-logo-${theme.logoAlign || 'left'}`}>
            <img src={logo} alt="" style={{ height: `${theme.logoHeight || 40}px` }} />
          </div>
        )}
      </div>
    );
  }

  /** Language selector shown on the form when `i18n.switcher` is `flags` or `dropdown`. */
  private renderSwitcher() {
    const mode = this.switcherMode();
    if (mode === 'none') return null;
    const languages = availableLanguages(this.sourceDoc.i18n as I18nConfig);
    const choose = (code: string) => this.setLanguage(code);
    if (mode === 'dropdown') {
      return (
        <div class="rfg-lang">
          <div class="rfg-select-wrap rfg-lang-select">
            <select class="rfg-control rfg-lang-dd" aria-label={this.tr('ui.language')} onChange={(e: any) => choose(e.target.value)}>
              {languages.map(code => {
                const info = languageInfo(code);
                return (
                  <option value={code} selected={code === this.activeLanguage}>
                    {info.flag ? `${info.flag} ` : ''}
                    {info.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      );
    }
    return (
      <div class="rfg-lang" role="group" aria-label={this.tr('ui.language')}>
        {languages.map(code => {
          const info = languageInfo(code);
          return (
            <button type="button" key={code} class={`rfg-lang-btn ${code === this.activeLanguage ? 'is-active' : ''}`} title={info.name} aria-pressed={code === this.activeLanguage ? 'true' : 'false'} onClick={() => choose(code)}>
              {info.flag && <span class="rfg-flag">{info.flag}</span>}
              <span>{code.split('-')[0].toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    );
  }

  private renderSuccess(settings: any) {
    return (
      <div class="rfg-success">
        <div class="rfg-success-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p class="rfg-success-message" innerHTML={sanitizeHtml(settings.successMessage)}></p>
        {settings.allowResubmit && (
          <button type="button" class="rfg-link" onClick={() => this.reset()}>
            {this.tr('ui.submitAnother')}
          </button>
        )}
      </div>
    );
  }

  render() {
    const settings = this.getSettings();
    const action = this.getAction();
    const theme = this.getTheme();
    const vars = themeToCssVars(theme);
    const rootClass = [
      're-form-generator',
      'rfg',
      `rfg-input-${theme.inputStyle}`,
      `rfg-card-${theme.cardStyle}`,
      `rfg-btn-${theme.buttonStyle}`,
      `rfg-btnw-${theme.buttonWidth}`,
      `rfg-btna-${theme.buttonAlign || 'left'}`,
      this.designMode ? 'rfg-design' : '',
    ].join(' ');

    if (this.schemaError) {
      return (
        <Host>
          <div class="rfg rfg-schema-error">Invalid form schema: {this.schemaError}</div>
        </Host>
      );
    }

    const style: any = vars;
    const pages = this.designMode ? [this.doc.fields] : this.pagesFor(this.values);
    const isSteps = !this.designMode && pages.length > 1;
    const step = Math.min(this.currentStep, Math.max(0, pages.length - 1));
    const isLast = step === pages.length - 1;
    const hasErrors = Object.keys(this.validationErrors).length > 0;
    const captcha = this.captchaConf();
    const showSubmit = !this.designMode && !settings.hideSubmitButton && !(this.legacy && !Object.keys(action).length);
    const leaves = flattenFields(this.doc.fields, true);
    this.zMap = {};
    leaves.forEach((f, i) => (this.zMap[f.id] = leaves.length - i + 1));

    const direction = languageInfo(this.activeLanguage).dir;
    const rootAttrs: any = { lang: this.activeLanguage, ...(direction ? { dir: direction } : {}) };

    if (this.status === 'success') {
      return (
        <Host>
          <div class={rootClass} style={style} {...rootAttrs}>
            {this.renderBranding(theme)}
            {this.renderSwitcher()}
            {this.renderSuccess(settings)}
          </div>
        </Host>
      );
    }

    return (
      <Host>
        <div class={rootClass} style={style} {...rootAttrs} {...(this.designMode ? ({ inert: '' } as any) : {})}>
          {theme.customCss && <style innerHTML={theme.customCss}></style>}
          {this.renderBranding(theme)}
          {this.renderSwitcher()}
          {!this.designMode && this.doc.title && settings.showTitle && (
            <header class="rfg-header">
              <h1 innerHTML={sanitizeHtml(this.doc.title)}></h1>
              {this.doc.description && <p>{this.doc.description}</p>}
            </header>
          )}

          {isSteps && settings.showProgress && (
            <div class="rfg-progress" role="progressbar" aria-valuemin={1} aria-valuemax={pages.length} aria-valuenow={step + 1}>
              <div class="rfg-progress-text">
                {this.tr('ui.step', { current: step + 1, total: pages.length })}
                {(pages[step] as any).title ? <span class="rfg-step-title"> · {(pages[step] as any).title}</span> : null}
              </div>
              <div class="rfg-progress-track">
                <div class="rfg-progress-bar" style={{ width: `${((step + 1) / pages.length) * 100}%` }}></div>
              </div>
            </div>
          )}

          {pages.map((page, index) => (
            <section key={index} class={`rfg-page ${index === step ? '' : 'rfg-hidden'}`}>
              {this.renderFields(page)}
            </section>
          ))}

          {!this.designMode && hasErrors && <div key="form-error" class="rfg-form-error">{settings.formErrorMessage}</div>}
          {this.status === 'error' && <re-alert key="api-error" message={settings.errorMessage} type="error"></re-alert>}

          {showSubmit && (
            <div key="actions" class="rfg-actions">
              {captcha && captcha.provider === 'honeypot' && (
                <div class="rfg-hp" aria-hidden="true">
                  <label>
                    Website
                    <input type="text" name="website" tabindex={-1} autocomplete="off" />
                  </label>
                </div>
              )}
              {captcha && hasWidget(captcha.provider) && (
                <div class={`rfg-captcha-wrap ${isLast ? '' : 'rfg-hidden'}`}>
                  <div class="rfg-captcha" key="captcha"></div>
                  {this.captchaField() && this.validationErrors[this.captchaField()] && <div class="rfg-error">{this.validationErrors[this.captchaField()][0]}</div>}
                </div>
              )}
              {isSteps && step > 0 && (
                <button type="button" class="rfg-btn rfg-btn-secondary" onClick={() => this.prevStep()}>
                  {this.tr('ui.back')}
                </button>
              )}
              {isSteps && !isLast ? (
                <button type="button" class="rfg-btn rfg-btn-primary" onClick={() => this.nextStep()}>
                  {this.tr('ui.continue')}
                </button>
              ) : (
                <button type="button" class="rfg-btn rfg-btn-primary" disabled={this.status === 'submitting'} onClick={() => this.submit()}>
                  {this.status === 'submitting' ? this.tr('ui.sending') : this.interpolate(settings.submitButtonText)}
                </button>
              )}
            </div>
          )}
        </div>
      </Host>
    );
  }
}
