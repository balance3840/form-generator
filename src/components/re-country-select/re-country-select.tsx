import { Component, Element, Prop, Listen, State, Event, EventEmitter, Watch, h } from '@stencil/core';
import { clickedInside } from '../../utils/dom';
import countries from './countries';

const GLOBE_ICON =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2228%22 height=%2221%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23999%22 stroke-width=%221.5%22%3E%3Ccircle cx=%2212%22 cy=%2212%22 r=%229%22/%3E%3Cpath d=%22M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18%22/%3E%3C/svg%3E';

/** Translated and sorted lists, per language: building one takes ~250 Intl lookups and a sort, so it is done once. */
const localizedCache = new Map<string, any[]>();

/** Country names in `language` when the browser can translate them, English otherwise. */
function localizedCountries(language: string): any[] {
  if (!language || language.toLowerCase().startsWith('en') || typeof (Intl as any).DisplayNames !== 'function') return countries;
  const cached = localizedCache.get(language);
  if (cached) return cached;
  let list: any[] = countries;
  try {
    const names = new (Intl as any).DisplayNames([language], { type: 'region' });
    list = countries
      .map(country => ({ ...country, englishName: country.name, name: names.of(String(country.code).toUpperCase()) || country.name }))
      .sort((a, b) => a.name.localeCompare(b.name, language));
  } catch (e) {
    list = countries;
  }
  localizedCache.set(language, list);
  return list;
}

/** Lower case without accents, so "aland" finds "Åland" and "osterrike" finds "Österrike". */
function normalize(value: any): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

let instanceCounter = 0;

@Component({
  tag: 're-country-select',
  styleUrl: 're-country-select.scss',
  shadow: false,
})
export class ReCountrySelect {
  @Element() el: HTMLElement;

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
  /** Small picker (flag and dial code) in front of a phone number: the list opens wider than the box. */
  @Prop() compact: boolean = false;
  /** Only offer these countries (codes like "dk", "se"). Empty: all of them. */
  @Prop() only: string[];
  /** Read out by screen readers (the compact picker has no visible label). */
  @Prop() ariaLabelText: string;

  @State() availableCountries: any[] = [];
  @State() selectedCountry: any = null;
  /** What the person typed to search. Empty: the whole list is shown. */
  @State() query: string = '';
  @State() dropdownVisible: boolean = false;
  /** Index of the highlighted row while navigating with the keyboard (-1: none; the mouse uses :hover). */
  @State() activeIndex: number = -1;
  /** The list opens upwards when there is no room below the field. */
  @State() openUp: boolean = false;

  @Event() selectedCountryChanged: EventEmitter<any>;

  private input: HTMLInputElement;
  private panel: HTMLDivElement;
  private readonly listId = `re-country-list-${++instanceCounter}`;

  componentWillLoad() {
    this.loadCountries();
    this.syncSelection();
  }

  @Watch('language')
  @Watch('only')
  loadCountries() {
    const only = (this.only || []).map(c => String(c).toLowerCase());
    this.availableCountries = localizedCountries(this.language).filter(country => !only.length || only.includes(country.code));
    // keep the chosen country, now with its name in the new language
    if (this.selectedCountry) this.selectedCountry = this.availableCountries.find(c => c.code === this.selectedCountry.code) || null;
  }

  /** The answer changed from outside (draft restored, form reset): show it, without reporting it back. */
  @Watch('defaultValue')
  syncSelection() {
    if (!this.defaultValue) {
      this.selectedCountry = null;
      return;
    }
    const wanted = String(this.defaultValue).toLowerCase();
    // the stored value can be the code, the name or the dial code depending on the field's `modelValueKey`
    const found = this.availableCountries.find(country =>
      [country.code, country.name, country.englishName, country.dialCode].some(v => v && String(v).toLowerCase() === wanted),
    );
    if (found) this.selectedCountry = found;
  }

  private visibleCountries(): any[] {
    const query = normalize(this.query.trim());
    if (!query) return this.availableCountries;
    const digits = query.replace(/[^\d]/g, '');
    const starts: any[] = [];
    const contains: any[] = [];
    for (const country of this.availableCountries) {
      const name = normalize(country.name);
      const english = normalize(country.englishName);
      if (name.startsWith(query) || english.startsWith(query) || country.code === query) starts.push(country);
      else if (name.includes(query) || english.includes(query) || (digits && country.dialCode.replace('+', '').startsWith(digits))) contains.push(country);
    }
    // names starting with the search come first ("ma" → Madagaskar before Guatemala)
    return starts.concat(contains);
  }

  private displayText(country: any): string {
    if (!country) return '';
    return country[this.inputDisplayKey || 'name'] || '';
  }

  private selectCountry(country: any) {
    this.selectedCountry = country;
    this.query = '';
    this.activeIndex = -1;
    this.dropdownVisible = false;
    if (this.input) this.input.value = '';
    this.selectedCountryChanged.emit({ [this.modelKey]: country });
  }

  /** Opens the list. It is positioned against the window (fixed) and opens upwards when there is more room above. */
  private openDropdown() {
    if (this.disabled || this.dropdownVisible) return;
    this.activeIndex = -1;
    this.dropdownVisible = true;
    this.placePanel();
    // show the chosen country right away, without the person having to scroll to it
    requestAnimationFrame(() => {
      const selected = this.panel && (this.panel.querySelector('.dropdown-item.is-selected') as HTMLElement);
      if (selected && this.panel) this.panel.scrollTop = selected.offsetTop - this.panel.clientHeight / 2 + selected.offsetHeight / 2;
    });
  }

  private closeDropdown() {
    this.dropdownVisible = false;
    this.activeIndex = -1;
    // half-typed search text is dropped: the box shows the chosen country again
    this.query = '';
    if (this.input) this.input.value = '';
  }

  /**
   * Places the list next to the field. It writes the panel's style directly instead of going through a @State, so
   * following a scroll does not re-render the ~190 rows.
   */
  private placePanel() {
    const input = this.input;
    if (!input || typeof window === 'undefined') return;
    const rect = input.getBoundingClientRect();
    const margin = 8;
    const below = window.innerHeight - rect.bottom - margin;
    const above = rect.top - margin;
    const up = below < 200 && above > below;
    const room = Math.max(120, Math.min(260, up ? above : below));
    // the compact picker is narrow: its list gets room for the country names, without leaving the window
    const field = this.compact ? (input.closest('.rfg-phone') as HTMLElement) || input : input;
    const fieldRect = field.getBoundingClientRect();
    const width = this.compact ? Math.min(Math.max(fieldRect.width, 300), window.innerWidth - 2 * margin) : rect.width;
    const left = Math.max(margin, Math.min(this.compact ? fieldRect.left : rect.left, window.innerWidth - width - margin));
    if (this.openUp !== up) this.openUp = up;
    const panel = this.panel;
    if (!panel) return;
    panel.style.position = 'fixed';
    panel.style.left = `${left}px`;
    panel.style.width = `${width}px`;
    panel.style.maxHeight = `${room}px`;
    panel.style.top = up ? 'auto' : `${rect.bottom + 4}px`;
    panel.style.bottom = up ? `${window.innerHeight - rect.top + 4}px` : 'auto';
  }

  componentDidRender() {
    if (this.dropdownVisible) this.placePanel();
  }

  /** The field moved (page or dialog scrolled, window resized) while the list is open. Scrolling the list itself does not move it. */
  @Listen('scroll', { target: 'window', capture: true, passive: true })
  handleScroll(event: Event) {
    if (!this.dropdownVisible || event.target === this.panel) return;
    this.placePanel();
  }

  @Listen('resize', { target: 'window', passive: true })
  handleResize() {
    if (this.dropdownVisible) this.placePanel();
  }

  @Listen('click', { target: 'document' })
  handleOutsideClick(event: MouseEvent) {
    // the whole picker counts (flag, arrow, list), also when it sits inside a shadow root
    if (this.dropdownVisible && !clickedInside(event, this.el)) this.closeDropdown();
  }

  /** ↑ ↓ move the highlight, Enter picks, Escape / Tab close. */
  private handleKeyDown(e: KeyboardEvent) {
    const list = this.visibleCountries();
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!this.dropdownVisible) {
        this.openDropdown();
        return;
      }
      if (!list.length) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      const start = this.activeIndex < 0 ? Math.max(-1, list.findIndex(c => this.selectedCountry && c.code === this.selectedCountry.code)) : this.activeIndex;
      this.activeIndex = start < 0 && step < 0 ? list.length - 1 : Math.max(0, Math.min(list.length - 1, start + step));
      requestAnimationFrame(() => {
        const item = this.panel && this.panel.querySelector('.dropdown-item.is-active');
        if (item && (item as any).scrollIntoView) (item as any).scrollIntoView({ block: 'nearest' });
      });
    } else if (e.key === 'Enter') {
      if (!this.dropdownVisible) return;
      // Enter after typing picks the best match without having to arrow down to it
      const pick = this.activeIndex >= 0 ? list[this.activeIndex] : this.query.trim() ? list[0] : null;
      if (pick) {
        e.preventDefault();
        this.selectCountry(pick);
      }
    } else if (e.key === 'Escape') {
      if (this.dropdownVisible) {
        e.preventDefault();
        this.closeDropdown();
      }
    } else if (e.key === 'Tab') {
      this.closeDropdown();
    }
  }

  private handleInput(e: Event) {
    this.query = (e.target as HTMLInputElement).value;
    this.activeIndex = -1;
    if (!this.dropdownVisible) this.openDropdown();
    if (this.panel) this.panel.scrollTop = 0;
  }

  private renderCountries(list: any[]) {
    const selectedCode = this.selectedCountry && this.selectedCountry.code;
    return (
      <div
        class={`country-select-dropdown-wrapper ${this.dropdownVisible ? '' : 'hidden'} ${this.openUp ? 'up' : ''}`}
        id={this.listId}
        role="listbox"
        ref={el => (this.panel = el)}
        // keeps the focus in the search box, so picking a row (or dragging the scrollbar) does not close the list first
        onMouseDown={(e: Event) => e.preventDefault()}
        // the mouse takes over from the keyboard: only one row looks highlighted
        onMouseMove={() => {
          if (this.activeIndex !== -1) this.activeIndex = -1;
        }}
      >
        {/* the rows (and their flags) only exist while the list is open */}
        {this.dropdownVisible &&
          list.map((country, i) => (
            <div
              class={`dropdown-item ${selectedCode === country.code ? 'is-selected' : ''} ${i === this.activeIndex ? 'is-active' : ''}`}
              id={`${this.listId}-${country.code}`}
              role="option"
              aria-selected={selectedCode === country.code ? 'true' : 'false'}
              onClick={() => this.selectCountry(country)}
              key={country.code}
            >
              <img src={`https://flagcdn.com/16x12/${country.code}.png`} class="flag" alt="" width={20} height={15} loading="lazy" decoding="async" />
              <span class="country-name">{country.name}</span>
              {this.showDialCode && <span class="country-dial">({country.dialCode})</span>}
            </div>
          ))}
        {this.dropdownVisible && !list.length && <div class="dropdown-empty">{this.noResultsText}</div>}
      </div>
    );
  }

  render() {
    const list = this.dropdownVisible ? this.visibleCountries() : [];
    const selected = this.selectedCountry;
    const flag = selected ? `https://flagcdn.com/28x21/${selected.code}.png` : GLOBE_ICON;
    const searchPlaceholder = (this.inputOptions && this.inputOptions.placeholder) || (this.compact ? '' : 'Search country by name');
    // the chosen country is the box's placeholder: the caret sits where the text starts and typing simply replaces it
    const placeholder = selected ? this.displayText(selected) : searchPlaceholder;
    const active = this.activeIndex >= 0 && list[this.activeIndex];
    return (
      <div class={this.compact ? 'is-compact' : ''}>
        <div class={`country-select-input-wrapper ${this.dropdownVisible ? 'is-open' : ''}`} style={{ zIndex: this.zIndex }}>
          <div class="dropdown-container">
            <img src={flag} class={`selected-flag ${this.query ? 'is-searching' : ''}`} alt="" aria-hidden="true" />
            <input
              type="text"
              class={`country-search ${selected ? 'has-selection' : ''}`}
              value={this.query}
              onInput={e => this.handleInput(e)}
              onKeyDown={e => this.handleKeyDown(e)}
              onFocus={() => this.openDropdown()}
              // after picking a country the box keeps the focus: a click opens the list again
              onClick={() => this.openDropdown()}
              onBlur={() => this.closeDropdown()}
              ref={el => (this.input = el)}
              role="combobox"
              aria-expanded={this.dropdownVisible ? 'true' : 'false'}
              aria-controls={this.listId}
              aria-autocomplete="list"
              aria-activedescendant={active ? `${this.listId}-${active.code}` : undefined}
              aria-label={this.ariaLabelText || (selected ? this.displayText(selected) : undefined)}
              disabled={this.disabled}
              autoComplete="one-time-code"
              spellcheck={false}
              placeholder={placeholder}
            />
            <span class="country-chevron" aria-hidden="true"></span>
            {this.renderCountries(list)}
          </div>
        </div>
      </div>
    );
  }
}
