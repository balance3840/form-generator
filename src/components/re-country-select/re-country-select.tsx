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
  /** Shown when the search matches nothing. */
  @Prop() noResultsText: string = 'No results';
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
  /** Index of the highlighted row while navigating with the keyboard. */
  @State() activeIndex: number = -1;
  /** The list opens upwards when there is no room below the field. */
  @State() openUp: boolean = false;
  /** Where the list sits (viewport coordinates), so no scroll area or dialog around the field can clip it. */
  @State() panelStyle: { [key: string]: string } = {};
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

  private visibleCountries(): any[] {
    return this.filteredCountries.length ? this.filteredCountries : this.availableCountries;
  }

  /** ↑ ↓ move the highlight, Enter picks, Escape / Tab close. */
  handleKeyDown(e: KeyboardEvent) {
    const list = this.visibleCountries();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!this.dropdownVisible) this.openDropdown();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      this.activeIndex = Math.max(0, Math.min(list.length - 1, (this.activeIndex < 0 ? (step > 0 ? -1 : list.length) : this.activeIndex) + step));
      requestAnimationFrame(() => {
        const item = this.countrySelectRef && this.countrySelectRef.closest('.country-select-input-wrapper')?.querySelector('.dropdown-item.is-active');
        if (item && (item as any).scrollIntoView) (item as any).scrollIntoView({ block: 'nearest' });
      });
    } else if (e.key === 'Enter') {
      if (this.dropdownVisible && this.activeIndex >= 0 && list[this.activeIndex]) {
        e.preventDefault();
        this.selectCountry(null, list[this.activeIndex]);
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      this.dropdownVisible = false;
      this.activeIndex = -1;
    }
  }

  handleInputChange(e) {
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key)) return;
    this.activeIndex = -1;
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
    this.activeIndex = -1;
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
      <div class={`${inputClass} ${this.openUp ? 'up' : ''}`} role="listbox" style={this.panelStyle} onMouseDown={(e: Event) => e.preventDefault()}>
        {countries.map((country, i) => (
          <div
            class={`dropdown-item ${this.selectedCountry && this.selectedCountry.code === country.code ? 'is-selected' : ''} ${i === this.activeIndex ? 'is-active' : ''}`}
            role="option"
            aria-selected={this.selectedCountry && this.selectedCountry.code === country.code ? 'true' : 'false'}
            onClick={e => this.selectCountry(e, country)}
            onMouseEnter={() => (this.activeIndex = i)}
            key={country.code}
          >
            <img src={`https://flagcdn.com/16x12/${country.code}.png`} class="flag" alt="" />
            <span class="country-name">{country.name}</span>
            {this.showDialCode && <span class="country-dial">({country.dialCode})</span>}
          </div>
        ))}
        {!countries.length && <div class="dropdown-empty">{this.noResultsText}</div>}
      </div>
    )
  }

  /** Opens the list. It is positioned against the window (fixed) and opens upwards when there is more room above. */
  private openDropdown() {
    this.filteredCountries = [];
    this.activeIndex = -1;
    this.dropdownVisible = true;
    this.placePanel();
  }

  private placePanel() {
    const input = this.countrySelectRef;
    if (!input || typeof window === 'undefined') return;
    const rect = input.getBoundingClientRect();
    const margin = 8;
    const below = window.innerHeight - rect.bottom - margin;
    const above = rect.top - margin;
    const up = below < 200 && above > below;
    const room = Math.max(120, Math.min(260, up ? above : below));
    this.openUp = up;
    this.panelStyle = {
      position: 'fixed',
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${room}px`,
      ...(up ? { bottom: `${window.innerHeight - rect.top + 4}px`, top: 'auto' } : { top: `${rect.bottom + 4}px`, bottom: 'auto' }),
    };
  }

  /** The field moved (page or dialog scrolled, window resized) while the list is open. */
  @Listen('scroll', { target: 'window', capture: true, passive: true })
  @Listen('resize', { target: 'window', passive: true })
  handleReposition() {
    if (this.dropdownVisible) this.placePanel();
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

  /** Focus moved to another field (Tab, click elsewhere): close the list and drop half-typed search text. */
  handleBlur() {
    this.dropdownVisible = false;
    this.activeIndex = -1;
    const input = this.countrySelectRef;
    if (input && input.value) {
      input.value = '';
      this.showSelectedWrapper = true;
      if (!this.selectedCountry) input.placeholder = this.inputOptions.placeholder;
    }
  }

  handleFocus(e) {
    if (e) {
      e.preventDefault();
    }
    this.openDropdown();
    if (this.selectedCountry) {
      this.countrySelectRef?.classList.add('no-indent')
    }
  }

  render() {
    let selectedFlag = this.selectedCountry ? `https://flagcdn.com/28x21/${this.selectedCountry.code}.png` : 'https://hocococdn.blob.core.windows.net/images/placeholders/globe-icon.png'
    return (
      <div>
        <div class={`country-select-input-wrapper ${this.dropdownVisible ? 'is-open' : ''}`} style={{ zIndex: this.zIndex }}>
          <div class="dropdown-container">
            <div class={`selected-country-wrapper ${!this.showSelectedWrapper ? 'hidden' : ''}`}>
              <img src={selectedFlag} class="selected-flag" alt="" />
              <span class='selected-country-value'>{this.countryInputValue}</span>
            </div>
            <input
              type="text"
              class={`country-search`}
              onKeyDown={e => this.handleKeyDown(e)}
              onKeyUp={e => this.handleInputChange(e)}
              role="combobox"
              aria-expanded={this.dropdownVisible ? 'true' : 'false'}
              aria-autocomplete="list"
              onFocus={e => this.handleFocus(e)}
              onBlur={() => this.handleBlur()}
              ref={(el) => { this.countrySelectRef = el }}
              disabled={this.disabled}
              autoComplete="one-time-code"
              placeholder={!this.selectedCountry ? (this.inputOptions.placeholder || "Search country by name") : ''}
            />
            <span class="country-chevron" aria-hidden="true"></span>
            {this.renderCountries(this.filteredCountries.length ? this.filteredCountries : this.availableCountries)}
          </div>
        </div>
      </div>
    );
  }

}
