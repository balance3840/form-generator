import { Component, Element, Event, EventEmitter, Host, Listen, Method, Prop, State, Watch, h } from '@stencil/core';
import * as yup from 'yup';
import set from 'lodash/set';
import { createYupSchema, getValidationErrors } from '../../utils/utils';
import { FieldStates, FormDocument, FormField, blankItem, computeStates, defaultValues, flattenFields, getByPath, isLayoutType, itemInstances, rowLayout, sanitizeHtml, setByPath } from '../../utils/schema';
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
  /** Steps the visitor has been on, and whether each is filled in correctly (for the step list), by step id. */
  @State() visited: { [stepId: string]: boolean } = {};
  @State() completion: { [stepId: string]: boolean } = {};
  /** When the draft was last saved (ms), 0 = not yet. */
  @State() draftSavedAt: number = 0;
  /** The model of the repeater whose "add" menu is open. */
  @State() addMenu: string = '';
  /** Collapsed state of repeater items, by item path (undefined = the repeater's default). */
  @State() collapsed: { [itemPath: string]: boolean } = {};

  @Event() handleSubmit: EventEmitter<any>;
  @Event() submitted: EventEmitter<any>;
  @Event() validationError: EventEmitter<any>;
  @Event() valueChanged: EventEmitter<any>;
  /** Fires when the displayed language changes (detection on load, the switcher, `setLanguage()` or the `language` prop). */
  @Event() languageChanged: EventEmitter<{ language: string }>;
  /** Fires when a button runs an `emit` action: `{ name, field, values }`. Use it to hook your own code to a button. */
  @Event() formAction: EventEmitter<{ name: string; field: string; values: any }>;
  /** Fires when the visitor moves to another step: `{ index, id, title }`. */
  @Event() stepChanged: EventEmitter<{ index: number; id: string; title: string }>;
  /** Fires when the draft is saved (`settings.saveDraft`). */
  @Event() draftSaved: EventEmitter<{ values: any }>;
  /** Fires when the visitor leaves with "Save and exit" (`settings.exitUrl` is opened afterwards, if set). */
  @Event() exit: EventEmitter<{ values: any }>;

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

  private navStep = '';

  componentDidRender() {
    this.mountCaptchaIfNeeded();
    this.keepCurrentStepInView();
  }

  /** On narrow screens the step list is a horizontal strip: keep the current step visible inside it (without scrolling the page). */
  private keepCurrentStepInView() {
    const current = this.el.querySelector('.rfg-step-item.is-current') as HTMLElement;
    const strip = current && (current.closest('.rfg-steps') as HTMLElement);
    if (!current || !strip) return;
    const key = `${current.textContent}|${strip.clientWidth}`;
    if (key === this.navStep) return;
    this.navStep = key;
    if (strip.scrollWidth > strip.clientWidth + 2) {
      const item = current.parentElement as HTMLElement;
      strip.scrollLeft = Math.max(0, item.offsetLeft - strip.clientWidth / 2 + item.offsetWidth / 2);
    }
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
    const defaults = defaultValues(this.doc.fields);
    const initial = this.parseJson(this.model, {});
    const draft = resetValues ? this.readDraft() : null;
    this.values = resetValues ? { ...defaults, ...(draft ? draft.values : {}), ...initial } : { ...defaults, ...this.values, ...initial };
    if (resetValues) {
      this.others = {};
      this.searchItems = {};
      this.collapsed = {};
      this.visited = {};
      this.completion = {};
      this.addMenu = '';
      this.draftSavedAt = draft ? draft.at || 0 : 0;
      const restored = draft && draft.step ? this.pagesFor(this.values).findIndex(page => (page as any).id === draft.step) : -1;
      if (restored >= 0) this.currentStep = restored;
    }
    if (this.currentStep >= this.pagesFor(this.values).length) this.currentStep = 0;
    this.markVisited();
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

  private statesCache: { values: any; doc: FormDocument; design: boolean; value: FieldStates } = null;

  /** Logic result (shown / disabled / required, by field id) for the current answers. Cached until they change. */
  private states(values = this.values): FieldStates {
    const cache = this.statesCache;
    if (cache && cache.values === values && cache.doc === this.doc && cache.design === this.designMode) return cache.value;
    let value: FieldStates;
    if (this.designMode) {
      // the builder shows every block and ignores logic
      const all: { [id: string]: boolean } = {};
      flattenFields(this.doc.fields, false, true).forEach(f => (all[f.id] = true));
      value = { visible: all, disabled: {}, required: {} };
    } else {
      value = computeStates(this.doc.fields, values);
    }
    this.statesCache = { values, doc: this.doc, design: this.designMode, value };
    return value;
  }

  private visibility(values = this.values) {
    return this.states(values).visible;
  }

  private visibleFields(values = this.values) {
    const vis = this.visibility(values);
    return flattenFields(this.doc.fields, true).filter(f => vis[f.id]);
  }

  /** The value of a field by model; fields inside a repeater live at paths like `tenants[0].email`. */
  private answerOf(model: string) {
    return getByPath(this.values, model);
  }

  /** Every field instance rendered so far, by model. Child components report values by model; this finds the field again. */
  private registry: { [model: string]: FormField } = {};

  private fieldByModel(model: string): FormField | undefined {
    return this.registry[model] || flattenFields(this.doc.fields, true, true).find(f => f.model === model);
  }

  /**
   * Splits the fields into steps at every `pageBreak`. Hidden fields stay in their page (so they keep their
   * state), but pages without any visible field are skipped, and so are steps whose page break is hidden by logic.
   */
  private pagesFor(values: { [key: string]: any }): Array<FormField[] & { title?: string; id?: string; description?: string }> {
    type Page = FormField[] & { title?: string; id?: string; description?: string };
    const vis = this.visibility(values);
    const settings = this.doc.settings || {};
    const newPage = (id: string, title?: string, description?: string): Page => Object.assign([] as FormField[], { id, title, description, hiddenStep: false });
    const pages: Page[] = [newPage('start', settings.firstStepTitle, settings.firstStepDescription)];
    this.doc.fields.forEach(field => {
      if (field.type === 'pageBreak') {
        // a page break's label is the title of the step that starts after it
        const page = pages[pages.length - 1].length ? newPage(field.id, field.label, field.helpText) : Object.assign(pages[pages.length - 1], { id: field.id, title: field.label || pages[pages.length - 1].title, description: field.helpText || pages[pages.length - 1].description });
        if (page !== pages[pages.length - 1]) pages.push(page);
        (page as any).hiddenStep = !vis[field.id];
      } else {
        pages[pages.length - 1].push(field);
      }
    });
    // a page counts when it has at least one visible field (rows and sections are visible when any of their fields is)
    const shown = (f: FormField): boolean => (f.type === 'columns' || f.type === 'section' ? flattenFields([f], true).some(c => vis[c.id]) && vis[f.id] : vis[f.id]);
    return pages.filter(page => !(page as any).hiddenStep && page.some(shown));
  }

  private inputFields(fields: FormField[]) {
    return flattenFields(fields, true).filter(f => !isLayoutType(f.type) && f.model);
  }

  /* ------------------------------------------------------------ public API */

  @Method()
  async updateValue(key: string, value: any) {
    this.values = setByPath(this.values, key, value);
  }

  /** Goes to a step by its id (a page break's id, or `start` for the first step). Resolves to false if it could not. */
  @Method()
  async goToStep(stepId: string, validate = false) {
    return this.goToStepId(stepId, validate);
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
    this.clearDraft();
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
    this.clearDraft();
    this.destroyCaptcha();
    this.submitted.emit(result);
    const { redirectUrl } = this.getSettings();
    if (redirectUrl && typeof window !== 'undefined') {
      setTimeout(() => (window.location.href = redirectUrl), 1200);
    }
    return result;
  }

  /* ---------------------------------------------------------- validation */

  /** A field with the "required" rule added when logic made it required. */
  private prepareField(field: FormField, states: FieldStates): FormField {
    if (states.required[field.id] && !(field.validations || []).some(v => v.name === 'required')) {
      return { ...field, validations: [{ name: 'required', params: [] }, ...(field.validations || [])] };
    }
    return field;
  }

  /** Fields switched off by a rule are not editable, so they cannot be asked to be valid. */
  private checkable(field: FormField, states: FieldStates) {
    return states.visible[field.id] && !(states.disabled[field.id] && !field.disabled);
  }

  private async runValidation(fields: FormField[], captchaField: string | false = false) {
    const states = this.states();
    const leaves = flattenFields(fields, true).filter(f => this.checkable(f, states));
    const inputs = this.inputFields(leaves).filter(f => f.type !== 'repeater').map(f => this.prepareField(f, states));
    const validator = yup.object().shape(createYupSchema(inputs, captchaField, flattenFields(this.doc.fields, true), this.tr));
    let errors: { [key: string]: string[] } = {};
    try {
      await validator.validate(this.values, { abortEarly: false });
    } catch (err) {
      errors = getValidationErrors(err);
    }
    for (const repeater of leaves.filter(f => f.type === 'repeater')) {
      errors = { ...errors, ...(await this.validateRepeater(repeater, states)) };
    }
    return errors;
  }

  /** Validates the items of a repeater one by one; errors are keyed by the path of the field (`tenants[0].email`). */
  private async validateRepeater(repeater: FormField, states: FieldStates) {
    let errors: { [key: string]: string[] } = {};
    const config = repeater.config || {};
    const items = itemInstances(repeater, this.values);
    const label = String(repeater.label || repeater.model || '').replace(/<[^>]*>/g, '');
    const min = Number(config.minItems) || 0;
    const max = Number(config.maxItems) || 0;
    if (min && items.length < min) errors[repeater.model] = [this.tr('validation.minItems', { label, 0: min })];
    else if (max && items.length > max) errors[repeater.model] = [this.tr('validation.maxItems', { label, 0: max })];
    for (const item of items) {
      const leaves = flattenFields(item.fields, true).filter(f => this.checkable(f, states));
      const plain = this.inputFields(leaves)
        .filter(f => f.type !== 'repeater')
        .map(f => ({ ...this.prepareField(f, states), model: f._key as string }));
      try {
        await yup.object().shape(createYupSchema(plain, false, plain, this.tr)).validate(getByPath(this.values, item.model) || {}, { abortEarly: false });
      } catch (err) {
        const found = getValidationErrors(err);
        Object.keys(found).forEach(key => {
          const instance = leaves.find(f => f._key === key);
          if (instance) errors[instance.model] = found[key];
        });
      }
      for (const nested of leaves.filter(f => f.type === 'repeater')) {
        errors = { ...errors, ...(await this.validateRepeater(nested, states)) };
      }
    }
    return errors;
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

  /** The top level answer keys behind a list of error keys ("tenants[0].email" -> "tenants"). */
  private rootsOf(keys: string[]) {
    return new Set(keys.map(k => k.split('[')[0]));
  }

  /** "Show the first one": the first error of the step the visitor is on, else the first error anywhere. */
  private showFirstError() {
    const page = (this.pagesFor(this.values)[this.currentStep] || []) as FormField[];
    const roots = new Set(flattenFields(page, true).map(f => f.model).filter(Boolean) as string[]);
    const here: { [key: string]: string[] } = {};
    Object.keys(this.validationErrors).forEach(key => {
      if (roots.has(key.split('[')[0])) here[key] = this.validationErrors[key];
    });
    this.goToFirstError(Object.keys(here).length ? here : this.validationErrors);
  }

  /** Opens the collapsed items / sections that contain an error, so the error is not hidden inside something folded. */
  private revealErrors(errors: { [key: string]: string[] }) {
    const keys = Object.keys(errors);
    const next = { ...this.collapsed };
    keys.forEach(key => {
      // "rooms[0].units[1].defect" -> the items "rooms[0]" and "rooms[0].units[1]"
      const re = /\[\d+\]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(key))) next[key.slice(0, m.index + m[0].length)] = false;
    });
    const roots = this.rootsOf(keys);
    flattenFields(this.doc.fields, false)
      .filter(f => f.type === 'section')
      .forEach(section => {
        if (flattenFields([section], true).some(f => f.model && roots.has(f.model))) next[section.id] = false;
      });
    this.collapsed = next;
  }

  private goToFirstError(errors: { [key: string]: string[] }) {
    const pages = this.pagesFor(this.values);
    const roots = this.rootsOf(Object.keys(errors));
    const pageIndex = pages.findIndex(page => flattenFields(page, true).some(f => f.model && roots.has(f.model)));
    if (pageIndex >= 0) this.setStep(pageIndex, false);
    this.revealErrors(errors);
    // wait for the page switch and the opened items to render, then bring the first error of the step on screen
    const show = () => {
      const page = this.el.querySelector('.rfg-page:not(.rfg-hidden)');
      const target = page && (page.querySelector('.rfg-has-error') as HTMLElement);
      if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    requestAnimationFrame(() => requestAnimationFrame(show));
  }

  /** Shows step `index` (the visitor's position), remembers it was visited, and tells the host. */
  private setStep(index: number, scroll = true) {
    const pages = this.pagesFor(this.values);
    const next = Math.max(0, Math.min(index, pages.length - 1));
    const changed = next !== this.currentStep;
    this.currentStep = next;
    this.markVisited();
    if (changed) {
      const page = pages[next] as any;
      this.stepChanged.emit({ index: next, id: page.id, title: page.title || '' });
      this.saveDraftSoon();
    }
    this.scheduleCompletion();
    if (scroll) this.scrollToTop();
  }

  private markVisited() {
    const page = this.pagesFor(this.values)[this.currentStep] as any;
    if (page && !this.visited[page.id]) this.visited = { ...this.visited, [page.id]: true };
  }

  /** Validates the step the visitor is on. Shows its errors and resolves to true when it is fine. */
  private async validateCurrentStep(): Promise<boolean> {
    const pages = this.pagesFor(this.values);
    const page = pages[this.currentStep] || [];
    const errors = await this.runValidation(page);
    this.liveValidate = true;
    // replace the errors of this step, keep the ones of other steps
    const own = this.rootsOf(Object.keys(errors).concat(flattenFields(page, true).map(f => f.model).filter(Boolean) as string[]));
    const kept: { [key: string]: string[] } = {};
    Object.keys(this.validationErrors).forEach(key => {
      if (!own.has(key.split('[')[0])) kept[key] = this.validationErrors[key];
    });
    this.validationErrors = { ...kept, ...errors };
    if (Object.keys(errors).length) {
      this.goToFirstError(errors);
      return false;
    }
    return true;
  }

  private async nextStep(): Promise<boolean> {
    if (!(await this.validateCurrentStep())) return false;
    this.setStep(this.currentStep + 1);
    return true;
  }

  private prevStep() {
    this.setStep(this.currentStep - 1);
  }

  private async goToStepId(stepId: string, validate = false): Promise<boolean> {
    const pages = this.pagesFor(this.values);
    const index = pages.findIndex(page => (page as any).id === stepId);
    if (index < 0) return false;
    if (validate && index > this.currentStep && !(await this.validateCurrentStep())) return false;
    this.setStep(index);
    return true;
  }

  /** Can the visitor click this step in the step list? (`settings.stepNavigation`: free | visited (default) | locked.) */
  private canOpenStep(index: number, pages: any[]) {
    const mode = this.getSettings().stepNavigation || 'visited';
    if (index === this.currentStep) return true;
    if (mode === 'free') return true;
    if (mode === 'locked') return index < this.currentStep;
    return index < this.currentStep || !!this.visited[pages[index].id];
  }

  /** Marks which visited steps are filled in correctly (shown as a tick in the step list). */
  private completionTimer: any = null;
  private scheduleCompletion() {
    if (this.designMode || this.getSettings().stepsLayout !== 'sidebar') return;
    clearTimeout(this.completionTimer);
    this.completionTimer = setTimeout(() => this.refreshCompletion(), 350);
  }

  private async refreshCompletion() {
    const pages = this.pagesFor(this.values) as any[];
    const next: { [id: string]: boolean } = {};
    for (const page of pages) {
      if (!this.visited[page.id]) continue;
      next[page.id] = Object.keys(await this.runValidation(page)).length === 0;
    }
    const same = Object.keys(next).length === Object.keys(this.completion).length && Object.keys(next).every(k => next[k] === this.completion[k]);
    if (!same) this.completion = next;
  }

  /* ------------------------------------------------------------------ draft */

  private draftKey(): string | null {
    const settings = this.getSettings();
    if (this.designMode || !settings.saveDraft) return null;
    return `rfg-draft:${settings.draftKey || this.formId || this.sourceDoc.title || 'form'}`;
  }

  private readDraft(): { values: any; step?: string; at?: number } | null {
    const key = this.draftKey();
    if (!key || typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  private draftTimer: any = null;
  private saveDraftSoon() {
    if (!this.draftKey()) return;
    clearTimeout(this.draftTimer);
    this.draftTimer = setTimeout(() => this.saveDraft(), 600);
  }

  /** Stores the answers in this browser so the visitor can come back later (files are not kept). */
  private saveDraft() {
    const key = this.draftKey();
    if (!key || typeof localStorage === 'undefined') return;
    const page = this.pagesFor(this.values)[this.currentStep] as any;
    const at = Date.now();
    try {
      localStorage.setItem(key, JSON.stringify({ values: this.values, step: page && page.id, at }, (_k, v) => (typeof FileList !== 'undefined' && v instanceof FileList ? undefined : v)));
      this.draftSavedAt = at;
      this.draftSaved.emit({ values: this.values });
    } catch (e) {
      /* storage is full or blocked: the form still works */
    }
  }

  private clearDraft() {
    const key = this.draftKey();
    clearTimeout(this.draftTimer);
    if (key && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        /* nothing to clear */
      }
    }
  }

  private exitForm() {
    this.saveDraft();
    const values = this.buildPayload().payload;
    this.exit.emit({ values });
    const url = this.safeUrl(this.getSettings().exitUrl);
    if (url && typeof window !== 'undefined') window.location.href = url;
  }

  /** Only web, mail and phone links (and relative ones) can be opened from a form. */
  private safeUrl(url: any): string {
    const value = String(url || '').trim();
    return /^(https?:|mailto:|tel:|\/|#|\.)/i.test(value) || (value && !/^[a-z][a-z0-9+.-]*:/i.test(value)) ? value : '';
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

    const states = this.states();
    fields.forEach(field => {
      const key = field.model;
      const value = this.values[key];
      if (field.type === 'file') {
        if (value && value.length) files.push({ key, value, multiple: !!(field.attributes && field.attributes.multiple) });
        return;
      }
      const normalized = field.type === 'repeater' ? this.itemsPayload(field, files, states) : value === undefined ? null : value;
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

  /** The answers of a repeater as a list of plain objects (hidden fields left out; uploads go with the files). */
  private itemsPayload(repeater: FormField, files: { key: string; value: FileList; multiple: boolean }[], states: FieldStates): any[] {
    return itemInstances(repeater, this.values).map(item => {
      const out: { [key: string]: any } = {};
      flattenFields(item.fields, true)
        .filter(f => states.visible[f.id] && !isLayoutType(f.type) && f.model)
        .forEach(f => {
          const key = f._key as string;
          const value = this.answerOf(f.model);
          if (f.type === 'repeater') out[key] = this.itemsPayload(f, files, states);
          else if (f.type === 'file') {
            if (value && value.length) files.push({ key: f.model, value, multiple: !!(f.attributes && f.attributes.multiple) });
          } else out[key] = value === undefined ? null : value;
        });
      return out;
    });
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
    const field = this.fieldByModel(model);
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

  @Listen('keydown', { target: 'document' })
  onDocumentKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.addMenu) this.addMenu = '';
  }

  @Listen('click', { target: 'document' })
  onDocumentClick(event: MouseEvent) {
    if (!this.addMenu) return;
    const target = event.target as HTMLElement;
    if (!target || !target.closest || !target.closest('.rfg-add')) this.addMenu = '';
  }

  @Listen('signatureChanged')
  handleSignatureChange(event: CustomEvent) {
    this.handleChildValue(event);
  }

  @Listen('selectedCountryChanged')
  handleCountrySelectChange(event: CustomEvent) {
    const modelKey = Object.keys(event.detail)[0];
    const country = event.detail[modelKey];
    const field = this.fieldByModel(modelKey);
    const key = (field && field.modelValueKey) || 'code';
    this.setValueByModel(modelKey, country ? country[key] : null);
  }

  private setValueByModel(model: string, value: any) {
    if (getByPath(this.values, model) === value) return;
    this.values = setByPath(this.values, model, value);
    this.valueChanged.emit({ [model]: value });
    const field = this.fieldByModel(model);
    if (field) this.revalidateField(field);
    this.afterChange();
  }

  /** Housekeeping after any answer changed: keep the draft and the step ticks up to date. */
  private afterChange() {
    this.saveDraftSoon();
    this.scheduleCompletion();
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
      disabled: this.states().disabled[field.id] || field.disabled,
      'aria-required': this.isRequired(field) ? 'true' : undefined,
      'aria-label': field._bare ? String(field.label || '').replace(/<[^>]*>/g, '') : undefined,
      ...(off ? { autocomplete: 'off', 'data-lpignore': 'true', 'data-1p-ignore': 'true', 'data-form-type': 'other' } : {}),
    };
  }

  private isRequired(field: FormField) {
    return (field.validations || []).some(v => v.name === 'required') || !!this.states().required[field.id];
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
    const value = this.answerOf(model);
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
            key={field.id}
            textTitle={(field.config && field.config.title) || field.textTitle || this.tr('ui.clickToUpload')}
            subTitle={(field.config && field.config.subTitle) || field.subTitle || this.tr('ui.orDragDrop')}
            placeholder={field.placeholder || this.tr('ui.anyFile')}
            modelKey={model}
            preview={!!(field.config && field.config.preview)}
            compact={!!(field.config && field.config.compact)}
          ></re-file-input-field>
        );

      case 'signature': {
        const config = field.config || {};
        return (
          <re-signature-pad
            key={field.id}
            modelKey={model}
            value={value || ''}
            disabled={common.disabled}
            height={Number(config.height) || 160}
            texts={{ hint: config.hint || this.tr('ui.signHere'), clear: this.tr('ui.clearSignature') }}
          ></re-signature-pad>
        );
      }

      case 'toggle':
        return (
          <label class="rfg-switch">
            <input type="checkbox" {...common} checked={!!value} onChange={(e: any) => this.setValueByModel(model, e.target.checked)} />
            <span class="rfg-slider"></span>
          </label>
        );

      case 'checkboxGroup':
        return (
          <div class={`rfg-options ${this.cardsOf(field) ? 'rfg-options-cards' : ''}`} role="group" style={{ '--rfg-opt-cols': String((field.config && field.config.optionColumns) || 1) }}>
            {this.optionsOf(field).map((option, i) => {
              const checked = Array.isArray(value) && value.some(v => String(v) === String(option.value));
              return (
                <label class={`rfg-option ${this.cardsOf(field) ? 'rfg-option-card' : ''} ${checked ? 'is-checked' : ''}`}>
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
                  {this.renderOptionText(field, option)}
                </label>
              );
            })}
            {this.renderOther(field, 'checkbox')}
          </div>
        );

      case 'radioGroup':
        return (
          <div class={`rfg-options ${this.cardsOf(field) ? 'rfg-options-cards' : ''}`} role="radiogroup" style={{ '--rfg-opt-cols': String((field.config && field.config.optionColumns) || 1) }}>
            {this.optionsOf(field).map((option, i) => {
              const checked = !(this.others[model] && this.others[model].on) && value !== undefined && value !== null && String(value) === String(option.value);
              return (
                <label class={`rfg-option ${this.cardsOf(field) ? 'rfg-option-card' : ''} ${checked ? 'is-checked' : ''}`}>
                  <input
                    type="radio"
                    name={`${this.formId || 'rfg'}-${common.name}`}
                    id={i === 0 ? field.id : undefined}
                    disabled={common.disabled}
                    checked={checked}
                    onChange={() => {
                      this.clearOther(model);
                      this.setValueByModel(model, option.value);
                      // `config.autoAdvance`: picking an answer moves on to the next step (like a choice screen)
                      if (field.config && field.config.autoAdvance) setTimeout(() => this.nextStep(), 160);
                    }}
                  />
                  {this.renderOptionText(field, option)}
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
            class={`rfg-control rfg-input-${type} ${field.readonly ? 'rfg-readonly' : ''}`}
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

  /** `config.optionStyle: "cards"` shows each choice as a card with a title and an optional description. */
  private cardsOf(field: FormField) {
    return !!(field.config && field.config.optionStyle === 'cards');
  }

  private renderOptionText(field: FormField, option: any) {
    if (!this.cardsOf(field)) return <span>{option.label}</span>;
    return (
      <span class="rfg-option-text">
        <span class="rfg-option-title">{option.label}</span>
        {option.description && <span class="rfg-option-desc">{option.description}</span>}
      </span>
    );
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
      this.setValueByModel(model, next.on ? next.text : this.answerOf(model));
      return;
    }
    const current: any[] = Array.isArray(this.answerOf(model)) ? this.answerOf(model) : [];
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

  private renderField(field: FormField, zIndex: number, hidden: boolean, bare = false) {
    // A field hidden by logic is not put in the page at all (its answer is kept in memory). Hidden-but-present fields
    // still count for the browser: e.g. a hidden street / postal code / city next to a search box makes Chrome treat
    // the whole thing as an address form and pop up its saved addresses. Uploads stay mounted so a chosen file survives.
    if (hidden && field.type !== 'file') return null;
    this.registry[field.model || ''] = field;
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
      return (
        <div key={field.id} class={`rfg-field rfg-block ${hidden ? 'rfg-hidden' : ''}`}>
          <hr class="rfg-divider" />
        </div>
      );
    }
    if (field.type === 'callout') return this.renderCallout(field);
    if (field.type === 'button') return this.renderButton(field);

    const errors = field.model ? this.validationErrors[field.model] : null;
    if (bare) {
      // a table cell: just the control, the column header says what it is
      const cell = { ...field, _bare: true };
      return (
        <div key={field.id} data-field-id={field.id} class={`rfg-field rfg-type-${field.type} rfg-bare ${errors ? 'rfg-has-error' : ''}`} style={{ zIndex: String(zIndex) }}>
          {this.renderControl(cell, zIndex)}
          {errors && <div class="rfg-error" role="alert">{errors[0]}</div>}
        </div>
      );
    }
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

  /* ------------------------------------------------- callout, button, section */

  private renderCallout(field: FormField) {
    const tone = (field.config && field.config.tone) || 'info';
    const icons: { [tone: string]: string } = {
      info: 'M12 8v.01M11 12h1v4h1M12 21a9 9 0 100-18 9 9 0 000 18z',
      success: 'M8 12.5l2.5 2.5L16 9.5M12 21a9 9 0 100-18 9 9 0 000 18z',
      warning: 'M12 9v4m0 4v.01M10.3 4.2L2.8 17.5A2 2 0 004.5 20.5h15a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z',
      danger: 'M12 8v5m0 3v.01M12 21a9 9 0 100-18 9 9 0 000 18z',
    };
    return (
      <div key={field.id} data-field-id={field.id} class={`rfg-field rfg-block rfg-callout rfg-callout-${tone}`} role="note">
        <svg class="rfg-callout-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d={icons[tone] || icons.info} />
        </svg>
        <div class="rfg-callout-body">
          {field.label && <div class="rfg-callout-title" innerHTML={sanitizeHtml(field.label)}></div>}
          {field.content && <div class="rfg-callout-text" innerHTML={sanitizeHtml(field.content)}></div>}
        </div>
      </div>
    );
  }

  private renderButton(field: FormField) {
    const config = field.config || {};
    const variant = ['primary', 'secondary', 'outline', 'ghost', 'danger'].includes(config.variant) ? config.variant : 'primary';
    const disabled = !!this.states().disabled[field.id] || this.status === 'submitting';
    const icon = (name: string) =>
      name === 'arrow-right' ? 'M5 12h14M13 6l6 6-6 6' : name === 'arrow-left' ? 'M19 12H5M11 6l-6 6 6 6' : name === 'plus' ? 'M12 5v14M5 12h14' : name === 'check' ? 'M5 13l4 4L19 7' : name === 'download' ? 'M12 4v11m0 0l-4-4m4 4l4-4M5 20h14' : '';
    const svg = (name: string) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d={icon(name)} />
      </svg>
    );
    const side = config.iconSide === 'left' || config.icon === 'arrow-left' || config.icon === 'plus' ? 'left' : 'right';
    return (
      <div key={field.id} data-field-id={field.id} class={`rfg-field rfg-block rfg-button-block rfg-ba-${config.align || 'start'}`}>
        <button
          type="button"
          id={field.id}
          class={`rfg-btn rfg-bv-${variant} ${variant === 'primary' ? 'rfg-btn-primary' : variant === 'secondary' ? 'rfg-btn-secondary' : ''} ${config.size === 'large' ? 'rfg-btn-lg' : ''}`}
          disabled={disabled}
          onClick={() => this.runActions(config.actions || [], field)}
        >
          {config.icon && icon(config.icon) && side === 'left' && svg(config.icon)}
          <span>{this.interpolate(field.label || '')}</span>
          {config.icon && icon(config.icon) && side === 'right' && svg(config.icon)}
        </button>
        {field.helpText && <div class="rfg-help">{field.helpText}</div>}
      </div>
    );
  }

  /**
   * What a button does when clicked: its `config.actions` run in order, and the chain stops at the first one that cannot
   * continue (a step with errors, a failed submit). Names inside an item of a repeater first look at the item's own fields.
   */
  private async runActions(actions: any[], source?: FormField) {
    if (this.designMode) return;
    const target = (key: string) => {
      const prefix = source && (source._prefix as string);
      if (prefix && this.registry[`${prefix}.${key}`]) return `${prefix}.${key}`;
      return key;
    };
    for (const action of actions || []) {
      switch (action && action.type) {
        case 'next':
          if (!(await this.nextStep())) return;
          break;
        case 'back':
          this.prevStep();
          break;
        case 'goto':
          if (!(await this.goToStepId(action.step, !!action.validate))) return;
          break;
        case 'submit': {
          const result: any = await this.submit();
          if (!result || result.errors || result.error) return;
          break;
        }
        case 'reset':
          await this.reset();
          break;
        case 'set':
          if (action.field) this.setValueByModel(target(action.field), action.value === undefined ? '' : action.value);
          break;
        case 'add': {
          const repeater = this.registry[target(action.field)] || flattenFields(this.doc.fields, true).find(f => f.model === action.field && f.type === 'repeater');
          if (repeater) this.addItem(repeater, action.values || {});
          break;
        }
        case 'link': {
          const url = this.safeUrl(action.url);
          if (url && typeof window !== 'undefined') {
            if (action.newTab) window.open(url, '_blank', 'noopener');
            else window.location.href = url;
          }
          break;
        }
        case 'emit':
          this.formAction.emit({ name: action.name || '', field: source ? source.id : '', values: this.buildPayload().payload });
          break;
        case 'saveDraft':
          this.saveDraft();
          break;
        case 'exit':
          this.exitForm();
          break;
      }
    }
  }

  private renderSection(section: FormField, hidden: boolean) {
    const vis = this.visibility();
    if (hidden || (!this.designMode && !flattenFields([section], true).some(f => vis[f.id]))) return null;
    const config = section.config || {};
    const collapsible = !!config.collapsible;
    const closed = collapsible && (this.collapsed[section.id] !== undefined ? this.collapsed[section.id] : !!config.startCollapsed);
    const head = (section.label || section.helpText) && (
      <header class={`rfg-section-head ${collapsible ? 'is-clickable' : ''}`} onClick={collapsible ? () => (this.collapsed = { ...this.collapsed, [section.id]: !closed }) : undefined}>
        <div class="rfg-section-titles">
          {section.label && <h3 class="rfg-section-title" innerHTML={sanitizeHtml(section.label)}></h3>}
          {section.helpText && <p class="rfg-section-desc">{section.helpText}</p>}
        </div>
        {collapsible && <span class={`rfg-chevron ${closed ? '' : 'is-open'}`} aria-hidden="true"></span>}
      </header>
    );
    return (
      <section key={section.id} data-field-id={section.id} class={`rfg-section rfg-section-${config.style === 'plain' ? 'plain' : 'card'} ${closed ? 'is-closed' : ''}`}>
        {head}
        <div class={`rfg-section-body ${closed ? 'rfg-hidden' : ''}`}>
          <div class="rfg-grid">{this.renderBlocks(section.fields || [])}</div>
        </div>
      </section>
    );
  }

  /* --------------------------------------------------------------- repeaters */

  /** Fills `{n}` (1, 2, 3…), `{key}` (an answer of the item) and `{count:key}` (how many items a nested group has) into a template. */
  private fillItem(template: string, item: { model: string }, n: number) {
    const values = getByPath(this.values, item.model) || {};
    return template
      .replace(/\{n\}/g, String(n))
      .replace(/\{count:([\w.-]+)\}/g, (_m, key) => String(Array.isArray(values[key]) ? values[key].length : 0))
      .replace(/\{([\w.-]+)\}/g, (_m, key) => {
        const v = values[key];
        return v === undefined || v === null || typeof v === 'object' ? '' : String(v);
      })
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** The title of an item: `config.itemLabel` filled in, or "Item 3". */
  private itemTitle(repeater: FormField, item: { model: string }, n: number) {
    return this.fillItem(String((repeater.config && repeater.config.itemLabel) || ''), item, n) || this.tr('ui.itemTitle', { n });
  }

  private addItem(repeater: FormField, extra: { [key: string]: any } = {}) {
    const current = this.answerOf(repeater.model);
    const list = Array.isArray(current) ? current : [];
    const max = Number(repeater.config && repeater.config.maxItems) || 0;
    this.addMenu = '';
    if (max && list.length >= max) return;
    this.setValueByModel(repeater.model, [...list, blankItem(repeater, extra)]);
    requestAnimationFrame(() => {
      const items = this.el.querySelectorAll(`[data-repeater="${repeater.id}"] > .rfg-items > .rfg-item, [data-repeater="${repeater.id}"] .rfg-table-row-wrap`);
      const last = items[items.length - 1];
      const input = last && (last.querySelector('input:not([type=hidden]):not([readonly]), select, textarea') as HTMLElement);
      if (input && input.focus) input.focus({ preventScroll: false });
    });
  }

  private removeItem(repeater: FormField, index: number) {
    const current = this.answerOf(repeater.model);
    const list = Array.isArray(current) ? current : [];
    const prefix = `${repeater.model}[`;
    const drop = <T,>(map: { [key: string]: T }) => {
      const next: { [key: string]: T } = {};
      Object.keys(map).forEach(key => {
        if (!key.startsWith(prefix)) next[key] = map[key];
      });
      return next;
    };
    // the state of the items that come after shifts by one: start clean for this repeater
    this.validationErrors = drop(this.validationErrors);
    this.collapsed = drop(this.collapsed);
    this.others = drop(this.others);
    this.searchItems = drop(this.searchItems);
    this.setValueByModel(repeater.model, list.filter((_item: any, i: number) => i !== index));
  }

  private renderRepeater(field: FormField, hidden: boolean) {
    if (hidden) return null;
    this.registry[field.model] = field;
    const config = field.config || {};
    const states = this.states();
    let items = itemInstances(field, this.values);
    // the builder shows one sample item so the layout can be judged
    if (this.designMode && !items.length) items = itemInstances(field, setByPath(this.values, field.model, [blankItem(field)]));
    const table = config.layout === 'table';
    const min = Number(config.minItems) || 0;
    const max = Number(config.maxItems) || 0;
    const locked = !!states.disabled[field.id];
    const canAdd = config.allowAdd !== false && !locked && (!max || items.length < max);
    const canRemove = config.allowRemove !== false && !locked && items.length > min;
    const errors = this.validationErrors[field.model];
    return (
      <div key={field.id} data-field-id={field.id} data-repeater={field.id} class={`rfg-field rfg-repeater rfg-repeater-${table ? 'table' : 'cards'} ${errors ? 'rfg-has-error' : ''}`}>
        {(field.label || field.helpText) && (
          <div class="rfg-repeater-head">
            {field.label && <div class="rfg-label" innerHTML={sanitizeHtml(field.label)}></div>}
            {field.helpText && <div class="rfg-help">{field.helpText}</div>}
          </div>
        )}
        <div class="rfg-items">
          {table ? (items.length ? this.renderTable(field, items, canRemove) : null) : items.map((item, i) => this.renderItem(field, item, i, canRemove))}
          {!items.length && config.emptyText && <div class="rfg-empty">{config.emptyText}</div>}
        </div>
        {errors && <div class="rfg-error" role="alert">{errors[0]}</div>}
        {canAdd && this.renderAdd(field)}
      </div>
    );
  }

  private renderAdd(field: FormField) {
    const config = field.config || {};
    const presets: any[] = Array.isArray(config.presets) ? config.presets : [];
    const label = config.addLabel || this.tr('ui.addItem');
    const open = this.addMenu === field.model;
    const plus = (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
    return (
      <div class={`rfg-add rfg-add-${config.addStyle === 'dashed' ? 'dashed' : 'button'}`}>
        <button type="button" class="rfg-add-btn" aria-expanded={presets.length ? (open ? 'true' : 'false') : undefined} onClick={() => (presets.length ? (this.addMenu = open ? '' : field.model) : this.addItem(field))}>
          {plus}
          <span>{label}</span>
        </button>
        {presets.length > 0 && open && (
          <div class="rfg-presets" role="menu">
            {presets.map(preset => (
              <button type="button" role="menuitem" class="rfg-preset" onClick={() => this.addItem(field, preset.values || {})}>
                <span class="rfg-preset-title">{preset.label}</span>
                {preset.description && <span class="rfg-preset-desc">{preset.description}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  private renderTrash(onClick: (e: Event) => void, label: string) {
    return (
      <button type="button" class="rfg-icon-btn" aria-label={label} title={label} onClick={onClick}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />
        </svg>
      </button>
    );
  }

  private renderItem(repeater: FormField, item: { index: number; model: string; suffix: string; fields: FormField[] }, i: number, canRemove: boolean) {
    const config = repeater.config || {};
    const collapsible = !!config.collapsible;
    const closed = collapsible && (this.collapsed[item.model] !== undefined ? this.collapsed[item.model] : !!config.startCollapsed);
    const title = this.itemTitle(repeater, item, i + 1);
    // `config.itemMeta`: a muted line next to the title ("19 units"); `config.doneField`: a yes/no answer of the item that shows a "Done" chip
    const meta = config.itemMeta ? this.fillItem(String(config.itemMeta), item, i + 1) : '';
    const done = !!config.doneField && getByPath(this.values, item.model) && getByPath(this.values, item.model)[config.doneField] === true;
    const toggle = () => (this.collapsed = { ...this.collapsed, [item.model]: !closed });
    const errored = Object.keys(this.validationErrors).some(k => k.startsWith(`${item.model}.`) || k.startsWith(`${item.model}[`));
    return (
      <div key={item.suffix} class={`rfg-item ${closed ? 'is-closed' : ''} ${errored ? 'has-errors' : ''}`}>
        <div class={`rfg-item-head ${collapsible ? 'is-clickable' : ''}`} onClick={collapsible ? toggle : undefined}>
          {collapsible && <span class={`rfg-chevron ${closed ? '' : 'is-open'}`} aria-hidden="true"></span>}
          <span class="rfg-item-title">{title}</span>
          {meta && <span class="rfg-item-meta">{meta}</span>}
          {done && <span class="rfg-item-done">{this.tr('ui.done')}</span>}
          {errored && closed && <span class="rfg-item-flag">!</span>}
          <span class="rfg-item-actions">
            {canRemove &&
              this.renderTrash(e => {
                e.stopPropagation();
                this.removeItem(repeater, i);
              }, `${this.tr('ui.remove')}: ${title}`)}
          </span>
        </div>
        <div class={`rfg-item-body ${closed ? 'rfg-hidden' : ''}`}>
          <div class="rfg-grid">{this.renderBlocks(item.fields)}</div>
        </div>
      </div>
    );
  }

  /**
   * Table layout: the first row of columns of the item becomes the table row (the column headers are the labels of
   * its first fields); anything after that row is a detail area under the row, shown only while it has visible fields.
   */
  private renderTable(repeater: FormField, items: Array<{ index: number; model: string; suffix: string; fields: FormField[] }>, canRemove: boolean) {
    const template = repeater.fields || [];
    const lead = template[0] && template[0].type === 'columns' ? template[0] : null;
    const columnsOf = (fields: FormField[]): { id: string; span: number; fields: FormField[] }[] =>
      lead ? (fields[0].columns || []).map(c => ({ id: c.id, span: c.span || 1, fields: c.fields })) : fields.filter(f => !isLayoutType(f.type)).map(f => ({ id: f.id, span: 1, fields: [f] }));
    const head = columnsOf(template);
    const template_columns = `${head.map(c => `minmax(0, ${c.span}fr)`).join(' ')} ${canRemove ? '36px' : ''}`.trim();
    const vis = this.visibility();
    const labelOf = (column: { fields: FormField[] }) => String((column.fields.find(f => f.label) || ({} as FormField)).label || '').replace(/<[^>]*>/g, '');
    return (
      <div class="rfg-table" role="table" style={{ '--rfg-table-cols': template_columns }}>
        <div class={`rfg-table-head ${items.length ? '' : 'rfg-hidden'}`} role="row">
          {head.map(column => {
            const first = column.fields.find(f => f.label);
            return (
              <div role="columnheader" class="rfg-th">
                {labelOf(column)}
                {first && this.isRequired(first) && <span class="rfg-required" aria-hidden="true">*</span>}
              </div>
            );
          })}
          {canRemove && <div class="rfg-th"></div>}
        </div>
        {items.map((item, i) => {
          const cells = columnsOf(item.fields);
          const detail = lead ? item.fields.slice(1) : [];
          const hasDetail = detail.some(block => flattenFields([block], true).some(f => vis[f.id]));
          const title = this.itemTitle(repeater, item, i + 1);
          return (
            <div key={item.suffix} class="rfg-table-row-wrap">
              <div class="rfg-table-row" role="row">
                {cells.map((column, c) => (
                  <div role="cell" class="rfg-cell" data-label={labelOf(head[c] || column)}>
                    {this.renderBlocks(column.fields, true)}
                  </div>
                ))}
                {canRemove && <div class="rfg-cell rfg-cell-actions">{this.renderTrash(() => this.removeItem(repeater, i), `${this.tr('ui.remove')}: ${title}`)}</div>}
              </div>
              {hasDetail && (
                <div class="rfg-table-detail">
                  <div class="rfg-grid">{this.renderBlocks(detail)}</div>
                </div>
              )}
            </div>
          );
        })}
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
            {this.renderBlocks(column.fields || [])}
          </div>
        ))}
      </div>
    );
  }

  private zMap: { [id: string]: number } = {};
  private zOf(field: FormField) {
    return this.zMap[field.id] || this.zMap[field._template as string] || 1;
  }

  private renderBlocks(fields: FormField[], bare = false) {
    const vis = this.visibility();
    return fields.map(field => {
      const hidden = !vis[field.id];
      if (field.type === 'pageBreak') return null;
      if (field.type === 'columns') return this.renderRow(field, hidden);
      if (field.type === 'section') return this.renderSection(field, hidden);
      if (field.type === 'repeater') return this.renderRepeater(field, hidden);
      return this.renderField(field, this.zOf(field), hidden, bare);
    });
  }

  private renderFields(fields: FormField[]) {
    return <div class="rfg-grid">{this.renderBlocks(fields)}</div>;
  }

  /**
   * Fills `{count:model}` (number of picked items), `{value:model}` (the answer), `{next}` / `{prev}` (the title of the
   * next / previous step) and `{step}` / `{steps}` (position and number of steps) into a text, e.g. a button label.
   */
  private interpolate(text: string): string {
    let out = String(text ?? '').replace(/\{(count|value):([\w.\[\]-]+)\}/g, (_match, kind, key) => {
      const v = this.answerOf(key);
      if (kind === 'count') return String(Array.isArray(v) ? v.length : v === undefined || v === null || v === '' ? 0 : 1);
      return Array.isArray(v) ? v.join(', ') : v === undefined || v === null ? '' : String(v);
    });
    if (/\{(next|prev|step|steps)\}/.test(out)) {
      const pages = this.pagesFor(this.values) as any[];
      const titleOf = (i: number) => (pages[i] && pages[i].title) || '';
      out = out.replace(/\{next\}/g, titleOf(this.currentStep + 1)).replace(/\{prev\}/g, titleOf(this.currentStep - 1)).replace(/\{step\}/g, String(this.currentStep + 1)).replace(/\{steps\}/g, String(pages.length));
    }
    return out.trim();
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

  /** "Saved at 14:32" for the step list, or nothing before the first save. */
  private savedText() {
    if (!this.draftSavedAt) return '';
    const time = new Date(this.draftSavedAt).toLocaleTimeString(this.activeLanguage, { hour: '2-digit', minute: '2-digit' });
    return this.tr('ui.savedAt', { time });
  }

  /** The step list of the sidebar layout: a dot (number, or a tick once the step is filled in) and the step title. */
  private renderStepNav(pages: any[], step: number, settings: any) {
    const tick = (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 13l4 4L19 7" />
      </svg>
    );
    return (
      <aside class="rfg-steps-nav" aria-label={this.tr('ui.stepsNav')}>
        <div class="rfg-steps-sticky">
        {settings.saveDraft && (
          <div class="rfg-nav-top">
            <button type="button" class="rfg-nav-exit" onClick={() => this.exitForm()}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
              <span class="rfg-nav-exit-text">
                <strong>{settings.exitText || this.tr('ui.saveExit')}</strong>
                {this.savedText() && <small>{this.savedText()}</small>}
              </span>
            </button>
          </div>
        )}
        <ol class="rfg-steps">
          {pages.map((page, index) => {
            const done = !!this.completion[page.id] && index !== step;
            const open = this.canOpenStep(index, pages);
            return (
              <li key={page.id}>
                <button
                  type="button"
                  class={`rfg-step-item ${index === step ? 'is-current' : ''} ${done ? 'is-done' : ''} ${this.visited[page.id] ? 'is-visited' : ''}`}
                  disabled={!open}
                  aria-current={index === step ? 'step' : undefined}
                  onClick={() => open && index !== step && this.setStep(index)}
                >
                  <span class="rfg-step-dot">{done ? tick : index + 1}</span>
                  <span class="rfg-step-name">{page.title || this.tr('ui.step', { current: index + 1, total: pages.length })}</span>
                </button>
              </li>
            );
          })}
        </ol>
        </div>
      </aside>
    );
  }

  render() {
    const settings = this.getSettings();
    const action = this.getAction();
    const theme = this.getTheme();
    const vars = themeToCssVars(theme);
    const sidebar = settings.stepsLayout === 'sidebar';
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
    const pages = (this.designMode ? [this.doc.fields] : this.pagesFor(this.values)) as any[];
    const isSteps = !this.designMode && pages.length > 1;
    const step = Math.min(this.currentStep, Math.max(0, pages.length - 1));
    const isLast = step === pages.length - 1;
    const hasErrors = Object.keys(this.validationErrors).length > 0;
    const captcha = this.captchaConf();
    const showSubmit = !this.designMode && !settings.hideSubmitButton && !(this.legacy && !Object.keys(action).length);
    const leaves = flattenFields(this.doc.fields, true);
    this.zMap = {};
    this.registry = {};
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

    // a button of the page that submits the form replaces the built-in submit button
    const ownSubmit = !this.designMode && flattenFields(pages[step] || [], true).some(f => f.type === 'button' && (f.config && f.config.actions || []).some((a: any) => a && a.type === 'submit'));
    const pagesView = pages.map((page, index) => (
      <section key={page.id || index} class={`rfg-page ${index === step ? '' : 'rfg-hidden'}`}>
        {this.renderFields(page)}
      </section>
    ));

    const footer = [
      !this.designMode && hasErrors ? (
        <div key="form-error" class="rfg-form-error" role="alert">
          <span>{settings.formErrorMessage}</span>
          <button type="button" class="rfg-link" onClick={() => this.showFirstError()}>
            {this.tr('ui.showFirstError')}
          </button>
        </div>
      ) : null,
      this.status === 'error' ? <re-alert key="api-error" message={settings.errorMessage} type="error"></re-alert> : null,
      showSubmit ? (
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
              {this.interpolate(settings.nextButtonText || this.tr('ui.continue')) || this.tr('ui.continue')}
            </button>
          ) : ownSubmit ? null : (
            <button type="button" class="rfg-btn rfg-btn-primary" disabled={this.status === 'submitting'} onClick={() => this.submit()}>
              {this.status === 'submitting' ? this.tr('ui.sending') : this.interpolate(settings.submitButtonText)}
            </button>
          )}
        </div>
      ) : null,
    ];

    const header = !this.designMode && this.doc.title && settings.showTitle && (
      <header class="rfg-header">
        <h1 innerHTML={sanitizeHtml(this.doc.title)}></h1>
        {this.doc.description && <p>{this.doc.description}</p>}
      </header>
    );

    return (
      <Host>
        <div class={`${rootClass} ${isSteps && sidebar ? 'rfg-layout-sidebar' : ''}`} style={style} {...rootAttrs} {...(this.designMode ? ({ inert: '' } as any) : {})}>
          {theme.customCss && <style innerHTML={theme.customCss}></style>}
          {this.renderBranding(theme)}
          {this.renderSwitcher()}
          {header}

          {isSteps && sidebar ? (
            <div class="rfg-flow">
              {this.renderStepNav(pages, step, settings)}
              <div class="rfg-flow-main">
                <div class="rfg-page-head">
                  <h2 class="rfg-page-title">{pages[step].title || this.tr('ui.step', { current: step + 1, total: pages.length })}</h2>
                  {pages[step].description && <p class="rfg-page-desc">{pages[step].description}</p>}
                </div>
                {pagesView}
                {footer}
              </div>
            </div>
          ) : (
            [
              isSteps && settings.showProgress ? (
                <div key="progress" class="rfg-progress" role="progressbar" aria-valuemin={1} aria-valuemax={pages.length} aria-valuenow={step + 1}>
                  <div class="rfg-progress-text">
                    {this.tr('ui.step', { current: step + 1, total: pages.length })}
                    {pages[step].title ? <span class="rfg-step-title"> · {pages[step].title}</span> : null}
                  </div>
                  <div class="rfg-progress-track">
                    <div class="rfg-progress-bar" style={{ width: `${((step + 1) / pages.length) * 100}%` }}></div>
                  </div>
                </div>
              ) : null,
              pagesView,
              footer,
            ]
          )}
        </div>
      </Host>
    );
  }
}
