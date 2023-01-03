import { Component, Host, h, Prop, State, Event, EventEmitter, Method, Watch, Fragment } from '@stencil/core';
import * as yup from 'yup';
import { createYupSchema, getValidationErrors } from '../../utils/utils';

@Component({
  tag: 're-form-generator',
  styleUrl: 're-form-generator.scss',
  shadow: false,
})
export class ReFormGenerator {

  @Prop() schema: any = [];
  @Prop() model: any = {};
  @Prop() action: any = {};
  @State() values: any = null;
  @State() validationErrors: any = {};
  @State() processedRows: any = [];
  @State() processedGroups: any = [];
  @Event() handleSubmit: EventEmitter<any>;
  @Event() submitted: EventEmitter<any>;
  @Event() validationError: EventEmitter<any>;
  public fields: any[] = [];
  public tag: string = 'input';
  public validationSchema: any = null;
  public apiAction: any = null;
  public shouldUseFormData = false;

  componentWillLoad() {
    this.buildModelSchema();
    this.setApiAction();
    this.setDefaultValues();
  }

  componentWillUpdate() {
    this.processedRows = [];
    this.processedGroups = [];
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
    const requestOptions = {
      method: this.apiAction.httpMethod,
      body: JSON.stringify(this.values) as any
    };
    const fileFields = this.fields.filter(field => field.inputType === 'file');
    const shouldUseFormData = fileFields.length;

    if (shouldUseFormData) {
      const body = new FormData();

      fileFields.map(field => {
        const fileInput = document.querySelector<HTMLInputElement>(`re-form-generator #${field.id}`);
        if (fileInput) {
          const file = fileInput.files[0];
          body.append(field.model, file);
        }
      });

      const nonFileFields = this.fields.filter(field => field.inputType !== 'file');
      nonFileFields.map(field => {
        body.append(field.model, this.values[field.model]);
      });

      requestOptions.body = body;
    } else {
      (requestOptions as any).headers = { 'Content-Type': 'application/json' };
    }

    return fetch(this.apiAction.endpoint, requestOptions)
      .then(response => response.json())
      .then(data => data)
  }

  @Method()
  async submit() {
    return await this.validateForm(this.values)
      .then(async () => {
        this.resetValidationErrors();
        if (this.apiAction) {
          const submitResult = {
            error: null,
            response: null
          };
          try {
            submitResult.response = await this.sendToApi();
          } catch (err) {
            submitResult.error = err;
          }
          return this.submitted.emit(submitResult);
        }
        return this.values;
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
    } = field;
    return {
      type: inputType,
      name: inputName,
      id, disabled,
      readonly,
      hidden: !visible,
      required,
      placeholder,
    };
  }

  public handleInputChange(e, field) {
    const { model, validationType = 'string', items } = field;
    const { target: { value } } = e;
    let modelValue = validationType === 'number' ? Number(value) : value;
    if (items) {
      modelValue = this.handleCheckboxGroupChange(modelValue, model, value);
    }
    this.values = { ...this.values, [model]: modelValue };
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
      default:
        fieldMethod = 'renderInputField';
        break;
    }
    return (
      <Fragment>
        {visible && (
          <div class={`input-group col-${cols} input-${customType || inputType || type}-container ${inputWrapperClass || ''}`}>
            {label && <label class="input__label" htmlFor={id}>{label}</label>}
            <slot name={`field-label@${id}`} />
            {this[fieldMethod](field)}
            {this.fieldHasErrors(field) && <span class="error-message">{this.fieldErrorMessage(field)}</span>}
          </div>
        )}
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
                        <option value={option.value} selected={defaultOption === option.value}>{option.display}</option>
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

  public renderTextareaField(field) {
    const { attributes, model } = field;
    const { values } = this;
    const props = this.buildProps(field);
    return <textarea class="textarea-input" {...props} {...attributes} defaultValue={values[model]} onChange={(e) => this.handleInputChange(e, field)}></textarea>
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
        {groupTitle && <div class='group-title'>{groupTitle}</div>}
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
          <div class="submit-container">
            <button type="submit" class="submit-container__button" onClick={() => this.submit()}>Submit</button>
          </div>
        </div>
      </Host>
    );
  }

}
