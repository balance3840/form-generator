import { Component, Prop, Listen, State, Event, EventEmitter, h } from '@stencil/core';
import countries from './countries';

@Component({
  tag: 're-country-select',
  styleUrl: 're-country-select.scss',
  shadow: false,
})
export class ReCountrySelect {

  public availableCountries: any[] = [];
  @Prop() inputOptions: any;
  @Prop() disabled: any;
  @Prop() modelKey: string;
  @Prop() defaultValue: string;
  @Prop() zIndex: string;
  @Prop() inputDisplayKey: string;
  @Prop() showDialCode: boolean = false;
  /** Language used for the country names (via Intl.DisplayNames); the stored value (the code) never changes. */
  @Prop() language: string;
  @State() filteredCountries: any[] = []
  @State() dropdownVisible: boolean = false;
  @State() selectedCountry: any = null;
  @State() countryInputValue: any = '';
  @State() showSelectedWrapper: boolean = true;
  @State() countrySelectRef: HTMLInputElement;
  @Event() selectedCountryChanged: EventEmitter<any>;


  /** Country names in `language` when the browser can translate them, English otherwise. */
  private localizedCountries(): any[] {
    const language = this.language;
    if (!language || language.toLowerCase().startsWith('en') || typeof (Intl as any).DisplayNames !== 'function') return countries;
    try {
      const names = new (Intl as any).DisplayNames([language], { type: 'region' });
      return countries
        .map(country => ({ ...country, englishName: country.name, name: names.of(String(country.code).toUpperCase()) || country.name }))
        .sort((a, b) => a.name.localeCompare(b.name, language));
    } catch (e) {
      return countries;
    }
  }

  componentWillLoad() {
    this.availableCountries = this.localizedCountries();
    if (this.defaultValue) {
      const wanted = String(this.defaultValue).toLowerCase();
      // the stored value can be the code, the name or the dial code depending on the field's `modelValueKey`
      const selectedCountry = this.availableCountries.find(country => [country.code, country.name, country.englishName, country.dialCode].some(v => v && String(v).toLowerCase() === wanted));
      if (!selectedCountry) return;
      this.selectCountry(null, selectedCountry);
    }
  }

  handleInputChange(e) {
    if (e.keyCode === 8 && this.selectedCountry) {
      this.countryInputValue = '';
      this.countrySelectRef.placeholder = this.inputOptions.placeholder;
      this.showSelectedWrapper = false;
      return;
    }
    const value = e.target.value.toLowerCase();
    const filteredCountries = this.availableCountries.filter(country => {
      return country.name.toLowerCase().includes(value) || (country.englishName || '').toLowerCase().includes(value) || country.dialCode.toLowerCase().includes(value)
    });
    this.filteredCountries = filteredCountries;
    if (e.target.value) {
      this.countrySelectRef.placeholder = '';
      this.showSelectedWrapper = false;
    } else {
      this.showSelectedWrapper = true;
    }
  }

  selectCountry(e, country) {
    if (e) {
      e.preventDefault();
    }
    this.selectedCountry = country;
    const inputDisplayKey = this.inputDisplayKey || 'name';
    this.countryInputValue = country[inputDisplayKey];
    const modelKey = this.modelKey;
    this.selectedCountryChanged.emit({
      [modelKey]: country
    });
    this.dropdownVisible = false;
    if (this.countrySelectRef) {
      this.countrySelectRef.value = '';
      this.countrySelectRef.placeholder = '';
      this.showSelectedWrapper = true;
    }
  }

  renderCountries(countries) {
    let inputClass = 'country-select-dropdown-wrapper '
    inputClass += this.dropdownVisible ? '' : 'hidden';
    return (
      <div class={inputClass}>
        {countries.map(country => (
          <div class="dropdown-item" onClick={e => this.selectCountry(e, country)} key={country.code}>
            <img src={`https://flagcdn.com/16x12/${country.code}.png`} class="flag" />
            {country.name} {this.showDialCode && `(${country.dialCode})`}
          </div>
        ))}
      </div>
    )
  }

  @Listen('click', { target: 'document' })
  handleOutsideClick(event: MouseEvent) {
    if (!this.countrySelectRef) return;
    if (!this.countrySelectRef.contains(event.target as Node)) {
      if (this.countrySelectRef.value) {
        this.countrySelectRef.value = '';
        this.showSelectedWrapper = false;
        this.countrySelectRef.placeholder = this.inputOptions.placeholder;
        this.countrySelectRef.classList.add('no-indent');
      }
      this.dropdownVisible = false;
    }
  }

  handleFocus(e) {
    if (e) {
      e.preventDefault();
    }
    this.filteredCountries = [];
    this.dropdownVisible = true;
    if (this.selectedCountry) {
      this.countrySelectRef?.classList.add('no-indent')
    }
  }

  render() {
    let selectedFlag = this.selectedCountry ? `https://flagcdn.com/28x21/${this.selectedCountry.code}.png` : 'https://hocococdn.blob.core.windows.net/images/placeholders/globe-icon.png'
    return (
      <div>
        <div class="country-select-input-wrapper" >
          <div class="dropdown-container" style={{ zIndex: this.zIndex }}>
            <div class={`selected-country-wrapper ${!this.showSelectedWrapper ? 'hidden' : ''}`}>
              <img src={selectedFlag} class="selected-flag" />
              <span class='selected-country-value'>{this.countryInputValue}</span>
            </div>
            <input
              type="text"
              class={`country-search`}
              onKeyUp={e => this.handleInputChange(e)}
              onFocus={e => this.handleFocus(e)}
              ref={(el) => { this.countrySelectRef = el }}
              disabled={this.disabled}
              autoComplete="one-time-code"
              placeholder={!this.selectedCountry ? (this.inputOptions.placeholder || "Search country by name") : ''}
            />
            <div class="dropdown" />
            {this.renderCountries(this.filteredCountries.length ? this.filteredCountries : this.availableCountries)}
          </div>
        </div>
      </div>
    );
  }

}
