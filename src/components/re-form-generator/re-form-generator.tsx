import { Component, Host, h, Prop, State, Event, EventEmitter, Method, Watch, Fragment, Listen } from '@stencil/core';
import * as yup from 'yup';
import { createYupSchema, getValidationErrors } from '../../utils/utils';
import set from 'lodash/set';

@Component({
  tag: 're-form-generator',
  styleUrl: 're-form-generator.scss',
  shadow: false,
})
export class ReFormGenerator {

  @Prop() schema: any = [];
  @Prop() formId: string;
  @Prop() model: any = {};
  @Prop() action: any = {};
  @Prop() mapping: any = null;
  @State() values: any = null;
  @State() validationErrors: any = {};
  @State() processedRows: any = [];
  @State() processedGroups: any = [];
  @State() recaptchaRendered: boolean = false;
  @State() showSuccessMessage: boolean = false;
  @State() showErrorMessage: boolean = false;
  @Event() handleSubmit: EventEmitter<any>;
  @Event() submitted: EventEmitter<any>;
  @Event() validationError: EventEmitter<any>;
  @Event() valueChanged: EventEmitter<any>;
  public fields: any[] = [];
  public tag: string = 'input';
  public validationSchema: any = null;
  public apiAction: any = null;
  public shouldUseFormData = false;
  public dataMapping = null;

  componentWillLoad() {
    this.buildModelSchema();
    this.setApiAction();
    this.setDataMapping();
    this.setDefaultValues();
  }

  componentWillUpdate() {
    this.processedRows = [];
    this.processedGroups = [];
  }

  componentDidRender() {
    // Render ReCaptcha
    if (this.apiAction?.recaptchaSiteKey && !this.recaptchaRendered) {
      try {
        (window as any).grecaptcha.render('recaptcha-wrapper', {
          'sitekey': this.apiAction.recaptchaSiteKey
        });
        this.recaptchaRendered = true;
      } catch (e) {
        console.log(e);
      }
    }
  }

  setDataMapping() {
    if (this.mapping) {
      if (typeof this.mapping === 'string') {
        this.dataMapping = JSON.parse(this.mapping);
      } else {
        this.dataMapping = this.mapping;
      }
    }
  }

  setApiAction() {
    if (this.action) {
      if (typeof this.action === 'string') {
        this.apiAction = JSON.parse(this.action);
      } else {
        this.apiAction = this.action;
      }
    }
  }

  setDefaultValues() {
    const { fields } = this;
    fields.map(({ defaultValue, model }) => {
      this.values[model] = defaultValue;
    });
  }

  buildModelSchema() {
    if (this.schema) {
      if (typeof this.schema === 'string') {
        this.fields = JSON.parse(this.schema);
      } else {
        this.fields = this.schema;
      }
    }
    if (this.model) {
      if (typeof this.model === 'string') {
        this.values = JSON.parse(this.model);
      } else {
        this.values = this.model;
      }
    }
    this.buildValidationSchema(this.fields);
    for (let index = 0; index < this.fields.length; index++) {
      const field = this.fields[index];
      if (field) {
        this.fields[index].zIndex = (this.fields.length - index) + 1;
      }
    }
  }

  buildValidationSchema(fields) {
    const validationRules = createYupSchema(fields);
    this.validationSchema = yup.object().shape(validationRules);
  }

  validateForm(values) {
    return this.validationSchema.validate(values, { abortEarly: false });
  }

  @Watch('validationErrors')
  watchErrorsHandler(newValue: any) {
    this.validationError.emit(newValue);
  }

  sendToApi() {
    let payload = {};
    const fileInputs = [];

    if (this.dataMapping) {
      Object.keys(this.dataMapping).map(key => {
        const mappingKeys = this.dataMapping[key];
        const field = this.fields.filter(field => field.model === key)[0];

        if (field) {
          if (field.inputType !== 'file') {
            if (typeof this.values[key] === 'undefined') {
              this.values[key] = null;
            }
            mappingKeys.map(mappingKey => set(payload, mappingKey, this.values[key]));
          } else {
            if (this.values[key]) {
              fileInputs.push({
                key,
                value: this.values[key]
              });
            }
          }
        } else {
          mappingKeys.map(mappingKey => set(payload, mappingKey, this.values[key]));
        }
      });
    } else {
      Object.keys(this.values).map(key => {
        if (!(this.values[key] instanceof FileList)) {
          payload = { ...payload, [key]: this.values[key] }
        } else {
          if (this.values[key]) {
            fileInputs.push({
              key,
              value: this.values[key]
            });
          }
        }
      })
    }

    if (this.apiAction?.recaptchaSiteKey) {
      const recaptchaResponse = (document.getElementById('g-recaptcha-response') as HTMLTextAreaElement)?.value
      payload = { ...payload, 'g-recaptcha-response': recaptchaResponse };
    }

    let requestOptions: any = {
      method: this.apiAction?.httpMethod || 'POST',
      body: JSON.stringify(payload) as any
    };

    if (this.apiAction.bearerToken) {
      const headers = {
        'Authorization': `Bearer ${this.apiAction.bearerToken}`
      };
      requestOptions.headers = headers;
    }

    let shouldUseFormData = false;
    if (this.apiAction.formData) {
      shouldUseFormData = JSON.parse(this.apiAction.formData);
    }

    if (shouldUseFormData || fileInputs.length) {
      const body = new FormData();

      Object.keys(payload).map(key => {
        let payloadKeyValue = payload[key];
        if (typeof payloadKeyValue === 'object' || Array.isArray(payloadKeyValue)) {
          payloadKeyValue = JSON.stringify(payloadKeyValue);
        }
        body.append(key, payloadKeyValue);
      });

      fileInputs.map(element => {
        const files = element.value;
        let formDataKey = element.key;
        const field = this.fields.find(field => field.model === formDataKey);
        if (field) {
          const { attributes } = field;
          if (attributes?.multiple) {
            formDataKey += '[]';
          }
        }
        Array.from(files).map((file: any) => {
          body.append(formDataKey, file);
        })
      })

      requestOptions.body = body;
    } else {
      (requestOptions as any).headers = {
        'Content-Type': 'application/json'
      };
      if (this.apiAction.bearerToken) {
        requestOptions.headers['Authorization'] = `Bearer ${this.apiAction.bearerToken}`;
      }
    }

    return fetch(this.apiAction.endpoint, requestOptions)
      .then(response => {
        if (!response.ok) {
          response.text().then(res => {
            this.triggerWebhook({
              type: "submit.failed",
              payload,
              actionEndpointResponse: res
            })
            this.showSuccessMessage = false;
            this.showErrorMessage = true;
          }
          );
          return;
        }
        response.json();
      })
      .then(data => {
        this.showSuccessMessage = true;
        return data;
      })
      .catch(error => {
        this.showSuccessMessage = false;
        this.showErrorMessage = true;
        this.triggerWebhook({
          type: "submit.failed",
          payload,
          actionEndpointResponse: null,
          exception: error.toString()
        })
      });
  }

  triggerWebhook({ type, payload, actionEndpointResponse, exception = null }) {
    const webhookApi = this.apiAction.webhoookEndpoint;

    if (webhookApi) {
      fetch(webhookApi, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: {
            type,
            payload,
            actionEndpointResponse,
            exception
          }
        })
      });
    }
  }

  @Method()
  async updateValue(key, value) {
    this.values = { ...this.values, [key]: value };
  }

  @Method()
  async submit() {
    return await this.validateForm(this.values)
      .then(async () => {
        this.resetValidationErrors();
        if (Object.keys(this.apiAction).length) {
          const submitResult = {
            error: null,
            response: null
          };
          try {
            submitResult.response = await this.sendToApi();
          } catch (err) {
            submitResult.error = err;
            this.triggerWebhook({
              type: "submit.failed",
              payload: this.values,
              actionEndpointResponse: 'null',
              exception: err.toString()
            });
          }
          return this.submitted.emit(submitResult);
        }
        return this.submitted.emit(this.values);
      }).catch(err => {
        this.setValidationErrors(err);
      });
  }

  @Method()
  async validate() {
    return this.validateForm(this.values)
      .then(() => {
        return [];
      })
      .catch(err => {
        this.setValidationErrors(err);
        return getValidationErrors(err);
      });
  }

  @Listen('multiSelectValueChanged')
  handleMultiselect(event: any) {
    try {
      const modelKey = Object.keys(event.detail)[0];
      const value = event.detail[modelKey];
      this.values = { ...this.values, [modelKey]: value };
      this.valueChanged.emit({
        [modelKey]: value
      });
    } catch (e) {
      console.log('multiSelectValueChanged error', e, event.detail);
    }
  }

  @Listen('selectedCountryChanged')
  handleCountrySelectChange(event: any) {
    try {
      const modelKey = Object.keys(event.detail)[0];
      const value = event.detail[modelKey];
      const field = this.fields.find(field => field.model === modelKey);
      let modelValueKey = 'code';
      if (field.modelValueKey) {
        modelValueKey = field.modelValueKey;
      }
      this.values = { ...this.values, [modelKey]: value[modelValueKey] };
      this.valueChanged.emit({
        [modelKey]: value[modelValueKey]
      });
    } catch (e) {
      console.log('selectedCountryChanged error', e, event.detail);
    }
  }

  @Listen('selectedFileChanged')
  handleFileSelectChange(event: any) {
    try {
      const modelKey = Object.keys(event.detail)[0];
      const value = event.detail[modelKey];
      this.values = { ...this.values, [modelKey]: value };
      this.valueChanged.emit({
        [modelKey]: value
      });
    } catch (e) {
      console.log('selectedFileChanged error', e, event.detail);
    }
  }

  resetValidationErrors() {
    this.validationErrors = {};
  }

  setValidationErrors(err) {
    this.validationErrors = getValidationErrors(err);
  }

  handleSubmitHandler(values) {
    this.validateForm(values)
      .then(() => {
        this.resetValidationErrors();
        this.handleSubmit.emit(values);
      }).catch(err => {
        this.setValidationErrors(err);
      });
  }

  fieldHasErrors({ model }) {
    return this.validationErrors[model] ? true : false;
  }

  fieldErrorMessage({ model }, position = 0) {
    return this.validationErrors[model][position];
  }

  public buildProps(field) {
    const {
      inputType,
      id,
      disabled,
      readonly,
      inputName,
      visible,
      required,
      placeholder,
      selectedWord,
      defaultOptions,
      modelValueKey,
      inputDisplayKey,
      showDialCode,
      textTitle,
      subTitle
    } = field;
    return {
      type: inputType,
      name: inputName,
      id, disabled,
      readonly,
      hidden: !visible,
      required,
      placeholder,
      selectedWord,
      defaultOptions,
      modelValueKey,
      inputDisplayKey,
      showDialCode,
      textTitle,
      subTitle
    };
  }

  public handleInputChange(e, field) {
    const { model, validationType = 'string', type } = field;
    const { target: { value } } = e;
    let modelValue = value;
    switch (validationType) {
      case 'number':
        modelValue = Number(value)
        break;
      case 'boolean':
        modelValue = Boolean(value)
        break;
      case 'object':
        modelValue = JSON.parse(value)
        break;
      default:
        break;
    }
    switch (type) {
      case 'checkboxGroup':
        modelValue = this.handleCheckboxGroupChange(modelValue, model, value);
        break;
      case 'toggle':
        modelValue = this.handleToggleChange(model, e);
        break;
      default:
        break;
    }
    this.values = { ...this.values, [model]: modelValue };
    this.valueChanged.emit({
      [model]: modelValue
    });
  }

  public handleToggleChange(model, e) {
    const modelValue = e.target.checked;
    this.values[model] = modelValue;
    return modelValue;
  }

  public handleCheckboxGroupChange(modelValue, model, value) {
    if (this.values[model]) {
      if (this.values[model].includes(value)) {
        modelValue = this.values[model].filter(element => element !== modelValue);
      } else {
        modelValue = [...this.values[model], modelValue];
      }
    } else {
      modelValue = [modelValue];
    }
    return modelValue;
  }

  public renderField(field) {
    const { inputType, type, inputWrapperClass, id, label, layout, visible } = field;
    const cols = layout && layout.cols || 12;
    let fieldMethod = 'renderInputField';
    let customType = null;
    let extraClasses = visible ? '' : 'hidden';
    extraClasses += this.fieldHasErrors(field) ? 'hasErrors' : '';
    switch (type) {
      case 'textarea':
        fieldMethod = 'renderTextareaField';
        break;
      case 'toggle':
        fieldMethod = 'renderToggleField';
        break;
      case 'select':
        fieldMethod = 'renderSelectField';
        break;
      case 'checkboxGroup':
        fieldMethod = 'renderCheckboxGroup';
        customType = 'checkboxGroup';
        break;
      case 'radioGroup':
        fieldMethod = 'renderRadioGroup';
        customType = 'radioGroup';
        break;
      case 'multiSelect':
        fieldMethod = 'renderMultiSelectField';
        break;
      case 'countrySelect':
        fieldMethod = 'renderCountrySelectField';
        break;
      case 'file':
        fieldMethod = 'renderFileField';
        break;
      default:
        fieldMethod = 'renderInputField';
        break;
    }
    return (
      <Fragment>
        {
          <div class={`input-group col-${cols} input-${customType || inputType || type}-container ${inputWrapperClass || ''} ${extraClasses}`}>
            {label && <label class="input__label" htmlFor={id} innerHTML={label}></label>}
            <slot name={`field-label@${id}`} />
            {this[fieldMethod](field)}
            {this.fieldHasErrors(field) && <span class="error-message">{this.fieldErrorMessage(field)}</span>}
          </div>
        }
      </Fragment>
    )
  }

  public renderCheckboxGroup(field) {
    field.inputType = 'checkbox';
    const { inputType, items } = field;
    const props = this.buildProps(field);
    return (
      <div class="checkboxGroup">
        {items.map(({ label, attributes }) => {
          return (
            <div class="checkboxGroup-element">
              <input class={`input-${inputType}`} {...props} {...attributes} onChange={(e) => this.handleInputChange(e, field)}></input>
              <span class="label">{label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  public renderRadioGroup(field) {
    field.inputType = 'radio';
    const { inputType, items } = field;
    const props = this.buildProps(field);
    return (
      <div class="radioGroup">
        {items.map(({ label, attributes }) => {
          return (
            <div class="radioGroup-element">
              <input class={`input-${inputType}`} {...props} {...attributes} onChange={(e) => this.handleInputChange(e, field)}></input>
              <span class="label">{label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  public renderSelectField(field) {
    const { attributes, model, values: optionValues = [] } = field;
    const { values } = this;
    const props = this.buildProps(field);
    const placeholder = props.placeholder || '';
    const defaultOption = values[model];
    const showPlaceholder = !defaultOption && placeholder;
    const processedOptGroups = [];
    delete props.placeholder;
    return (
      <Fragment>
        <select class={`select-input`} {...props} {...attributes} onChange={(e) => this.handleInputChange(e, field)}>
          {showPlaceholder && <option value="" disabled selected hidden>{placeholder}</option>}
          {optionValues.map(({ value: optionValue, display = optionValue, group }) => {
            if (group) {
              if (!processedOptGroups.includes(group)) {
                processedOptGroups.push(group);
                return (
                  <Fragment>
                    <optgroup label={group}>
                      {this.getOptGroup(group, optionValues).map(option => (
                        <option value={typeof option.value === 'object' ? JSON.stringify(option.value) : option.value} selected={defaultOption === option.value}>{option.display}</option>
                      ))}
                    </optgroup>
                  </Fragment>
                )
              } else {
                <Fragment>
                  <option value={optionValue} selected={defaultOption === optionValue}>{display}</option>
                </Fragment>
              }
            }
          })}
        </select>
      </Fragment>
    )
  }

  public renderMultiSelectField(field) {
    const { values: optionValues = [] } = field;
    const props = this.buildProps(field);
    const placeholder = props.placeholder || '';
    const selectedWord = props.selectedWord || '';
    const defaultOptions = props.defaultOptions || [];
    const disabled = props.disabled;

    const multiSelectOptions = optionValues.map((option) => { return { value: option.value, label: option.display } });
    return (
      <Fragment>
        <re-multi-select
          options={multiSelectOptions}
          inputOptions={
            {
              placeholder,
              selectedWord,
            }
          }
          defaultOptions={
            defaultOptions
          }
          disabled={disabled}
          modelKey={field.model}
        ></re-multi-select>
      </Fragment>
    )
  }

  public renderCountrySelectField(field) {
    const { model, zIndex } = field;
    const { values } = this;
    const props = this.buildProps(field);
    const placeholder = props.placeholder || '';
    const defaultValue = values[model];
    const disabled = props.disabled;

    return (
      <Fragment>
        <re-country-select
          inputOptions={
            {
              placeholder
            }
          }
          disabled={disabled}
          modelKey={field.model}
          defaultValue={defaultValue}
          zIndex={zIndex}
          inputDisplayKey={props.inputDisplayKey}
          showDialCode={props.showDialCode}
        ></re-country-select>
      </Fragment>
    )
  }

  public renderTextareaField(field) {
    const { attributes, model } = field;
    const { values } = this;
    const props = this.buildProps(field);
    return <textarea class="textarea-input" {...props} {...attributes} defaultValue={values[model]} onChange={(e) => this.handleInputChange(e, field)}></textarea>
  }

  public renderFileField(field) {
    const { attributes, model } = field;
    const props = this.buildProps(field);
    return (
      <re-file-input-field
        inputAttributes={attributes}
        inputProps={props}
        textTitle={props.textTitle}
        placeholder={props.placeholder}
        subTitle={props.subTitle}
        modelKey={model}
      >
      </re-file-input-field>
    )
  }

  public renderInputField(field) {
    const { attributes, model, inputType } = field;
    const { values } = this;
    const props = this.buildProps(field);
    return <input class={`input-${inputType}`} {...props} {...attributes} defaultValue={values[model]} onChange={(e) => this.handleInputChange(e, field)}></input>;
  }

  public renderToggleField(field) {
    const { attributes, model, defaultValue } = field;
    const { values } = this;
    const props = this.buildProps(field);
    const inputProps = { ...props, type: 'checkbox' };
    return (
      <label class="switch">
        <input class="toggle-input" {...inputProps} {...attributes} defaultValue={values[model]} checked={defaultValue} onChange={(e) => this.handleInputChange(e, field)}></input>
        <span class="slider round"></span>
      </label>
    );
  }

  public getOptGroup(group: string, options = []) {
    return options.filter(option => option.group === group);
  }

  public isRowProcessed(rowName: string) {
    return this.processedRows.includes(rowName);
  }

  public isGroupProcessed(groupName: string) {
    return this.processedGroups.includes(groupName);
  }

  public renderRow(rowName: string) {
    if (this.isRowProcessed(rowName)) return;
    const rowFields = this.fields.filter(field => field.layout && field.layout.row === rowName);
    this.processedRows.push(rowName);
    return (
      <div class={`row-container row-${rowName}-container`}>
        {rowFields.map(field => {
          return (
            <Fragment>
              {this.renderField(field)}
            </Fragment>
          )
        })}
      </div>
    )
  }

  renderGroup(groupName: string) {
    if (this.isGroupProcessed(groupName)) return;
    const groupFields = this.fields.filter(field => field.layout && field.layout.group === groupName);
    const groupTitle = groupFields[0] && groupFields[0].layout && groupFields[0].layout.groupTitle;
    this.processedGroups.push(groupName);
    return (
      <div class={`group-container group-${groupName}-container`}>
        {groupTitle && <div class='group-title' innerHTML={groupTitle}></div>}
        {groupFields.map(field => {
          const { layout } = field;
          const row = layout && layout.row ? layout.row : '';
          return (
            <Fragment>
              {row ? this.renderRow(row) : this.renderField(field)}
            </Fragment>
          )
        })}
      </div>
    )
  }

  public buildRenderWrapper(field) {
    const row = field.layout && field.layout.row ? field.layout.row : '';
    const group = field.layout && field.layout.group ? field.layout.group : '';

    if (group) {
      return this.renderGroup(group);
    }

    if (row) {
      return this.renderRow(row)
    }

    return (
      <Fragment>
        {this.renderField(field)}
      </Fragment>
    )
  }

  render() {
    return (
      <Host>
        <div class="re-form-generator">
          {this.fields.map(field => {
            return (
              <Fragment>
                {this.buildRenderWrapper(field)}
              </Fragment>
            );
          })}
          {Object.keys(this.validationErrors).length ? (
            <div class='form-error-message'>
              <div class='form-error-message__message' innerHTML={this.apiAction.formErrorMessage || 'Please fill all required fields'}></div>
            </div>
          ) : ''}
          {Object.keys(this.apiAction).length !== 0 && (
            <Fragment>
              {this.apiAction.recaptchaSiteKey ? (
                <div class="recaptcha-wrapper" id="recaptcha-wrapper">
                </div>
              ) : null}
              {this.showSuccessMessage ? (
                <re-alert message={this.apiAction.successMessage || 'Success! Form submitted.'} type='success'></re-alert>
              ) : null}
              {this.showErrorMessage ? (
                <re-alert message={this.apiAction.errorMessage || 'Error! There was an error submitting the form.'} type='error'></re-alert>
              ) : null}
              <div class="submit-container">
                <button type="submit" class="submit-container__button" onClick={() => this.submit()}>{this.apiAction.submitButtonText || 'Submit'}</button>
              </div>
            </Fragment>
          )}
        </div>
      </Host>
    );
  }

}
