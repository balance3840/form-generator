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
  @State() values: any = null;
  @State() validationErrors: any = {};
  @State() processedRows: any = [];
  @State() processedGroups: any = [];
  @Event() handleSubmit: EventEmitter<any>;
  @Event() validationError: EventEmitter<any>;
  public fields: any[] = [];
  public tag: string = 'input';
  public validationSchema: any = null;

  componentWillLoad() {
    this.buildModelSchema();
  }

  componentWillUpdate() {
    this.processedRows = [];
    this.processedGroups = [];
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

  @Method()
  async submit() {
    return await this.validateForm(this.values)
      .then(() => {
        this.resetValidationErrors();
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
    const { model, validationType = 'string' } = field;
    const { target: { value } } = e;
    let modelValue = validationType === 'number' ? Number(value) : value;
    this.values = { ...this.values, [model]: modelValue };
  }

  public renderField(field) {
    const { inputType, type, inputWrapperClass, id, label, layout } = field;
    const cols = layout && layout.cols || 12;
    let fieldMethod = 'renderInputField';
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
      default:
        fieldMethod = 'renderInputField';
        break;
    }
    return (
      <Fragment>
        <div class={`input-group col-${cols} input-${inputType || type}-container ${inputWrapperClass || ''}`}>
          {label && <label class="input__label" htmlFor={id}>{label}</label>}
          <slot name={`field-label@${id}`} />
          {this[fieldMethod](field)}
          {this.fieldHasErrors(field) && <span class="error-message">{this.fieldErrorMessage(field)}</span>}
        </div>
      </Fragment>
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
        <select {...props} {...attributes} onChange={(e) => this.handleInputChange(e, field)}>
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
    return <textarea class="channel-input" {...props} {...attributes} defaultValue={values[model]} onChange={(e) => this.handleInputChange(e, field)}></textarea>
  }

  public renderInputField(field) {
    const { attributes, model, inputType } = field;
    const { values } = this;
    const props = this.buildProps(field);
    return <input class={`channel-input input-${inputType}`} {...props} {...attributes} defaultValue={values[model]} onChange={(e) => this.handleInputChange(e, field)}></input>;
  }

  public renderToggleField(field) {
    const { attributes, model } = field;
    const { values } = this;
    const props = this.buildProps(field);
    const inputProps = { ...props, type: 'checkbox' };
    return (
      <label class="switch">
        <input class="channel-input" {...inputProps} {...attributes} defaultValue={values[model]} onChange={(e) => this.handleInputChange(e, field)}></input>
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
        </div>
      </Host>
    );
  }

}
