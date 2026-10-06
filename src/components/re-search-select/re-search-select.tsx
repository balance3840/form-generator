import { Component, Event, EventEmitter, Listen, Prop, State, Watch, h } from '@stencil/core';
import { clickedInside } from '../../utils/dom';
import { SearchItem, runSearch } from '../../utils/search';


/**
 * Remote autocomplete. Type to search, pick from the results. With `multiple` the picks pile up as removable chips.
 * The form passes the endpoint in `source`:
 *
 *   { url: 'https://api.example.com/search?q={q}', resultsPath: 'items', labelKey: 'name', valueKey: 'id',
 *     labelTemplate: '{street} {number}, {zip} {city|town}', minChars: 2, debounce: 250, headers: { Authorization: '…' } }
 *
 * Step by step search (street -> number -> unit): `drill: { typeKey: 'type', expandTypes: ['vejnavn', 'adgangsadresse'] }`.
 * Results whose type is listed open the next level when picked (the box is filled with their text and searched again);
 * the others are final. `extraKey` shows a small note next to a result.
 *
 * `labelTemplate` builds a shorter label from several fields: `{a.b}` is replaced by that path, `{a|b}` uses the first
 * one that has a value, and empty parts are dropped. Without it `labelKey` is used.
 *
 * `{q}` in the URL is replaced with the typed text. Without `resultsPath` the response itself must be an array.
 */
@Component({
  tag: 're-search-select',
  styleUrl: 're-search-select.scss',
  shadow: false,
})
export class ReSearchSelect {
  @Prop() modelKey: string;
  @Prop() source: any;
  @Prop() multiple: boolean = false;
  @Prop() placeholder: string;
  @Prop() disabled: boolean = false;
  /** The current selection, owned by the form. */
  @Prop() selected: SearchItem[] = [];
  /** Localized texts: { searching, noResults, remove }. */
  @Prop() texts: { [key: string]: string } = {};
  /** Id of the element that labels the input (aria-labelledby). A `<label for>` is avoided on purpose: Chrome reads such labels ("Address") and pops up its saved addresses over our list. */
  @Prop() labelledBy: string;

  @State() query: string = '';
  @State() results: SearchItem[] = [];
  @State() open: boolean = false;
  @State() loading: boolean = false;
  @State() failed: boolean = false;
  @State() active: number = -1;

  @Event() searchValueChanged: EventEmitter<{ [model: string]: SearchItem[] }>;

  private host: HTMLElement;
  private uid = `search-${Math.random().toString(36).slice(2, 8)}`;
  private timer: any;
  private sequence = 0;

  componentWillLoad() {
    this.syncQueryWithSelection();
  }

  @Watch('selected')
  onSelected() {
    if (!this.multiple && !this.open) this.syncQueryWithSelection();
  }

  /** Single mode shows the chosen label inside the input. */
  private syncQueryWithSelection() {
    if (!this.multiple) this.query = this.selected && this.selected[0] ? this.selected[0].label : '';
  }

  private get minChars() {
    return Number((this.source && this.source.minChars) || 2);
  }

  private async search(q: string) {
    const run = ++this.sequence;
    this.loading = true;
    this.failed = false;
    const outcome = await runSearch(this.source || {}, q);
    if (run !== this.sequence) return; // a newer search is already running
    this.results = outcome.items;
    this.failed = !!outcome.error;
    this.active = this.results.length ? 0 : -1;
    this.loading = false;
  }

  private onInput(value: string) {
    this.query = value;
    this.open = true;
    clearTimeout(this.timer);
    if (!this.multiple && !value && this.selected.length) this.commit([]); // cleared the box: clear the choice
    if (value.trim().length < this.minChars) {
      this.sequence++;
      this.results = [];
      this.loading = false;
      return;
    }
    this.loading = true;
    this.timer = setTimeout(() => this.search(value), Number((this.source && this.source.debounce) || 250));
  }

  private commit(items: SearchItem[]) {
    this.searchValueChanged.emit({ [this.modelKey]: items });
  }

  /** Opens the next level of a step by step search: the box takes the item's text and is searched again straight away. */
  private expand(item: SearchItem) {
    // street names continue with a space ("Main Street "), buildings keep their text as is
    this.query = item.label.includes(',') ? item.label : `${item.label} `;
    this.open = true;
    this.active = -1;
    clearTimeout(this.timer);
    this.search(this.query);
    (this.host.querySelector('input') as HTMLInputElement).focus();
  }

  private pick(item: SearchItem) {
    // an expandable item opens the next level, unless we are already looking at its own list: then it is the answer
    if (item.expandable && item.label.trim() !== this.query.trim()) {
      this.expand(item);
      return;
    }
    if (this.multiple) {
      const picked: SearchItem = { value: item.value, label: item.label };
      if (!this.selected.some(s => String(s.value) === String(picked.value))) this.commit([...this.selected, picked]);
      this.query = '';
      this.results = [];
    } else {
      this.commit([{ value: item.value, label: item.label }]);
      this.query = item.label;
      this.open = false;
    }
  }

  private remove(item: SearchItem) {
    this.commit(this.selected.filter(s => String(s.value) !== String(item.value)));
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.open = true;
      this.active = Math.min(this.active + 1, this.results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.active = Math.max(this.active - 1, 0);
    } else if (e.key === 'Enter') {
      if (this.open && this.results[this.active]) {
        e.preventDefault();
        this.pick(this.results[this.active]);
      }
    } else if (e.key === 'Escape') {
      this.open = false;
    } else if (e.key === 'Backspace' && this.multiple && !this.query && this.selected.length) {
      this.remove(this.selected[this.selected.length - 1]);
    }
  }

  @Listen('click', { target: 'document' })
  onDocumentClick(event: MouseEvent) {
    if (this.host && !clickedInside(event, this.host)) {
      this.open = false;
      this.syncQueryWithSelection();
    }
  }

  render() {
    const t = this.texts || {};
    const showList = this.open && this.query.trim().length >= this.minChars;
    return (
      <div class="search-select" ref={el => (this.host = el)}>
        <div class={`search-box ${this.disabled ? 'is-disabled' : ''} ${this.open ? 'is-open' : ''}`} onClick={() => !this.disabled && (this.host.querySelector('input') as HTMLInputElement).focus()}>
          {this.multiple &&
            this.selected.map(item => (
              <span class="search-chip" key={String(item.value)} title={item.label}>
                <span class="search-chip-label">{item.label}</span>
                {!this.disabled && (
                  <button type="button" class="search-chip-x" aria-label={`${t.remove || 'Remove'} ${item.label}`} onClick={e => (e.stopPropagation(), this.remove(item))}>
                    ×
                  </button>
                )}
              </span>
            ))}
          <input
            class="search-input"
            id={this.uid}
            type="search"
            role="combobox"
            aria-labelledby={this.labelledBy}
            aria-expanded={showList ? 'true' : 'false'}
            aria-autocomplete="list"
            autocomplete="off"
            disabled={this.disabled}
            placeholder={this.multiple && this.selected.length ? '' : this.placeholder}
            value={this.query}
            onInput={(e: any) => this.onInput(e.target.value)}
            onFocus={() => (this.open = true)}
            onKeyDown={e => this.onKeyDown(e)}
          />
        </div>
        {showList && (
          <ul class="search-list" role="listbox">
            {this.loading && <li class="search-note">{t.searching || 'Searching…'}</li>}
            {!this.loading && !this.results.length && <li class="search-note">{this.failed ? t.error || 'Could not load results' : t.noResults || 'No results'}</li>}
            {this.results.map((item, i) => (
              <li
                key={`${item.value}-${i}`}
                role="option"
                aria-selected={i === this.active ? 'true' : 'false'}
                class={`search-option ${i === this.active ? 'is-active' : ''} ${this.selected.some(s => String(s.value) === String(item.value)) ? 'is-selected' : ''}`}
                onMouseDown={e => e.preventDefault()}
                onClick={() => this.pick(item)}
                onMouseEnter={() => (this.active = i)}
              >
                <span class="search-option-label">{item.label}</span>
                {item.extra && <span class="search-option-extra">{item.extra}</span>}
                {item.expandable && item.label.trim() !== this.query.trim() && <span class="search-option-more" aria-hidden="true">›</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}
