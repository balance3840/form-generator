import { Component, Listen, Prop, State, h, Event, EventEmitter, } from '@stencil/core';


@Component({
  tag: 're-multi-select',
  styleUrl: 're-multi-select.scss',
  shadow: false,
})
export class MultiSelect {
  @Prop() options: Array<{ value: any, label: string }>;
  @Prop() inputOptions: any;
  @Prop() defaultOptions: any;
  @Prop() inputName: string;
  @Prop() disabled: boolean;
  @Prop() modelKey: string;
  @State() selectedOptions: Array<any> = [];
  @State() isOpen: boolean = false;
  @State() multiSelectRef: HTMLDivElement;
  @State() availableOptions: Array<{ value: any, label: string }>;
  @Event() multiSelectValueChanged: EventEmitter<any>;

  toggleOption(option: any) {
    if (this.selectedOptions.includes(option)) {
      this.selectedOptions = this.selectedOptions.filter(opt => opt !== option);
      this.isOpen = true;
    } else {
      this.selectedOptions = [...this.selectedOptions, option];
    }
    const modelKey = this.modelKey;
    const selectedOptionsValues = this.selectedOptions.map(option => option.value);
    this.multiSelectValueChanged.emit({
      [modelKey]: selectedOptionsValues
    });
  }

  toggleDropdown(e, keepOpen = false) {
    if (keepOpen && this.isOpen) {
      if (e.target.className === 'arrow') {
        this.isOpen = !this.isOpen;
      } else {
        this.isOpen = true;
      }
    } else {
      this.isOpen = !this.isOpen;
    }
  }

  @Listen('click', { target: 'document' })
  handleOutsideClick(event: MouseEvent) {
    if (!this.multiSelectRef.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }

  componentWillLoad() {
    this.availableOptions = this.options;
    if (this.defaultOptions) {
      this.defaultOptions.map(defaultOption => {
        this.selectedOptions =  [ ...this.selectedOptions, this.availableOptions[defaultOption]];
      })
      const modelKey = this.modelKey;
      const selectedOptionsValues = this.selectedOptions.map(option => option.value);
      this.multiSelectValueChanged.emit({
        [modelKey]: selectedOptionsValues
      });
    }
  }

  render() {
    let classNames = "multi-select__header";
    if (this.disabled) {
      classNames += ' disabled';
    }
    return (
      <div class="multi-select" ref={(el) => {this.multiSelectRef = el}}>
        <div class={classNames} onClick={(e) => this.toggleDropdown(e, true)}>
          {(this.selectedOptions.length) ?
            (
              this.isOpen ? 
                <div class="selected_options">
                  {
                    this.selectedOptions.map(option => (
                      <div class="selected_options__option">
                        <span class="selected_options__option-description">{ option.label }</span>
                        <span class="selected_options__option-close" onClick={() => this.toggleOption(option)}>×</span>
                      </div>
                    ))
                  }
                </div>
              : <span> {this.selectedOptions.length} { this.inputOptions?.selectedWord || 'selected'}</span>
            ) : <span> { this.inputOptions?.placeholder || 'Select...' }</span>
          }
          <div class="arrow"><span class={this.isOpen ? 'arrow-up' : 'arrow-down'}></span></div>
        </div>
        {this.isOpen && (
          <ul class="multi-select__options">
            {this.availableOptions.map(option => (
              <li
                class={`multi-select__option ${this.selectedOptions.includes(option) ? 'selected' : ''}`}
                onClick={() => this.toggleOption(option)}
              >
                { option.label }
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}
