/**
 * Shared schema helpers used by both the form generator and the form builder.
 *
 * A form is described by a "form document":
 *
 *   {
 *     version: 2,
 *     title, description,
 *     fields: [ ...field definitions... ],
 *     theme: { ... },
 *     settings: { ... },
 *     action: { endpoint, httpMethod, ... }
 *   }
 *
 * The original (v1) format - a bare array of fields - is still accepted everywhere.
 */

export type FormField = {
  type: string;
  id: string;
  model?: string;
  label?: string;
  helpText?: string;
  placeholder?: string;
  inputType?: string;
  inputName?: string;
  visible?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  defaultValue?: any;
  validationType?: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'file';
  validations?: { name: string; params?: any[] }[];
  /** `cols` is only used by the v1 -> v2 upgrade (see upgradeColsToRows); rows are `columns` blocks. */
  layout?: { cols?: number; row?: string; group?: string; groupTitle?: string };
  /** For `type: "columns"`: a row of columns, each column a vertical stack of fields. */
  columns?: FormColumn[];
  /** For `type: "section"` (a titled card of fields), `"repeater"` (the fields every item has) and `"modal"` (the fields of a dialog). */
  fields?: FormField[];
  /** For `type: "tabs"`: the tabs, each with its own fields. */
  tabs?: FormTab[];
  /** One rule, or several: show / hide / enable / disable / require this field depending on other answers. */
  logic?: FieldLogic | FieldLogic[];
  config?: { [key: string]: any };
  attributes?: { [key: string]: any };
  values?: { value: any; display?: string; group?: string }[];
  items?: { label: string; attributes?: { [key: string]: any } }[];
  [key: string]: any;
};

export type FormColumn = { id: string; span: number; fields: FormField[] };
export type FormTab = { id: string; label: string; fields: FormField[] };

export type FieldLogic = {
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require';
  match: 'all' | 'any';
  conditions: LogicCondition[];
};

export type LogicCondition = { field: string; operator: string; value?: any };

export type FormDocument = {
  version: number;
  title?: string;
  description?: string;
  fields: FormField[];
  theme?: { [key: string]: any };
  settings?: { [key: string]: any };
  action?: { [key: string]: any };
  /** Languages and translations, see utils/i18n.ts */
  i18n?: { [key: string]: any };
  /** A footer shown under the form, like the footer of a website. */
  footer?: FormFooter;
};

export type FooterLink = { label: string; url: string; newTab?: boolean };
export type FooterSocial = { type: string; url: string };

/** Footer of the form: text, links (privacy, terms…), social icons and a copyright line. */
export type FormFooter = {
  enabled?: boolean;
  /** `plain` sits on the page, `card` is a second card under the form, `bar` is a full-width coloured strip. */
  style?: 'plain' | 'card' | 'bar';
  align?: 'left' | 'center' | 'right';
  /** Short text, e.g. an address or a sentence about the company. Line breaks are kept. */
  text?: string;
  links?: FooterLink[];
  social?: FooterSocial[];
  /** e.g. "© 2026 Acme ApS". `{year}` becomes the current year. */
  copyright?: string;
  logo?: string;
  logoHeight?: number;
  /** Own colours; by default the footer follows the theme. */
  backgroundColor?: string;
  textColor?: string;
};

export const SOCIAL_NETWORKS: { value: string; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'website', label: 'Website' },
];

/** Field types that only display content (or act) and never hold a value. */
export const LAYOUT_TYPES = ['heading', 'paragraph', 'divider', 'pageBreak', 'columns', 'section', 'tabs', 'modal', 'callout', 'button'];

export const isLayoutType = (type: string) => LAYOUT_TYPES.includes(type);

/** Blocks that contain other fields. */
export const GROUP_TYPES = ['columns', 'section', 'tabs', 'repeater', 'modal'];
export const isGroup = (field: { type: string }) => GROUP_TYPES.includes(field.type);

/**
 * The lists of fields a block contains: the columns of a row, or the single list of a section / repeater (whose
 * list id is the block's own id). Used by the builder to walk and edit the tree in one way for every kind of block.
 */
export function childLists(field: FormField): { id: string; fields: FormField[] }[] {
  if (field.type === 'columns') return (field.columns || []).map(c => ({ id: c.id, fields: c.fields || [] }));
  if (field.type === 'tabs') return (field.tabs || []).map(t => ({ id: t.id, fields: t.fields || [] }));
  if (field.type === 'section' || field.type === 'repeater' || field.type === 'modal') return [{ id: field.id, fields: field.fields || [] }];
  return [];
}

/** Returns `field` with the list `listId` replaced. */
export function withChildList(field: FormField, listId: string, fields: FormField[]): FormField {
  if (field.type === 'columns') return { ...field, columns: (field.columns || []).map(c => (c.id === listId ? { ...c, fields } : c)) };
  if (field.type === 'tabs') return { ...field, tabs: (field.tabs || []).map(t => (t.id === listId ? { ...t, fields } : t)) };
  if ((field.type === 'section' || field.type === 'repeater' || field.type === 'modal') && field.id === listId) return { ...field, fields };
  return field;
}

/** The rules of a field's `logic` as a list (it can be one rule or several). */
export function logicRules(field: { logic?: FieldLogic | FieldLogic[] }): FieldLogic[] {
  return !field.logic ? [] : Array.isArray(field.logic) ? field.logic : [field.logic];
}

/** Stores one rule as an object (the usual shape) and several as a list. */
export function packLogic(rules: FieldLogic[]): FieldLogic | FieldLogic[] | undefined {
  return rules.length === 0 ? undefined : rules.length === 1 ? rules[0] : rules;
}

/**
 * Validation rules the generator understands (they map 1:1 to Yup methods) and the metadata the
 * builder uses to offer them. `params` are the *value* parameters; the error message is always the
 * parameter that follows them, e.g. min(3, 'Too short') or oneOf([...], 'Pick one of the list').
 */
/** `field` is the `model` of another field in the form. */
export type RuleParam = 'number' | 'date' | 'text' | 'regex' | 'list' | 'field';
export type RuleSpec = {
  name: string;
  label: string;
  hint?: string;
  params: RuleParam[];
  types: string[];
  /** Key of the localized default message (`validation.<key>` in utils/i18n.ts). */
  key: string;
  /** Default error message. `{label}` and `{0}` (first parameter) are replaced. */
  message: string;
};

export const RULE_SPECS: RuleSpec[] = [
  { name: 'required', label: 'Required', params: [], types: ['string', 'number', 'date', 'array', 'object', 'boolean', 'file'], key: 'required', message: '{label} is required' },

  { name: 'min', label: 'Minimum length', hint: 'Characters', params: ['number'], types: ['string'], key: 'minLength', message: '{label} must be at least {0} characters' },
  { name: 'max', label: 'Maximum length', hint: 'Characters', params: ['number'], types: ['string'], key: 'maxLength', message: '{label} must be at most {0} characters' },
  { name: 'length', label: 'Exact length', hint: 'Characters', params: ['number'], types: ['string', 'array'], key: 'length', message: '{label} must be exactly {0}' },
  { name: 'email', label: 'Valid email', params: [], types: ['string'], key: 'email', message: 'Please enter a valid email address' },
  { name: 'url', label: 'Valid URL', params: [], types: ['string'], key: 'url', message: 'Please enter a valid URL' },
  { name: 'uuid', label: 'Valid UUID', params: [], types: ['string'], key: 'uuid', message: '{label} must be a valid UUID' },
  { name: 'matches', label: 'Matches a pattern', params: ['regex'], types: ['string'], key: 'matches', message: '{label} is not in the right format' },
  { name: 'lowercase', label: 'Lowercase only', params: [], types: ['string'], key: 'lowercase', message: '{label} must be lowercase' },
  { name: 'uppercase', label: 'Uppercase only', params: [], types: ['string'], key: 'uppercase', message: '{label} must be uppercase' },
  { name: 'sameAs', label: 'Must match another field', hint: 'e.g. confirm email', params: ['field'], types: ['string', 'number'], key: 'sameAs', message: '{label} must match {0}' },
  { name: 'notSameAs', label: 'Must differ from another field', params: ['field'], types: ['string', 'number'], key: 'notSameAs', message: '{label} must be different from {0}' },
  { name: 'oneOf', label: 'Only allowed values', hint: 'Comma separated', params: ['list'], types: ['string', 'number'], key: 'oneOf', message: '{label} must be one of the allowed values' },
  { name: 'notOneOf', label: 'Forbidden values', hint: 'Comma separated', params: ['list'], types: ['string', 'number'], key: 'notOneOf', message: '{label} has a value that is not allowed' },

  { name: 'min', label: 'Minimum value', params: ['number'], types: ['number'], key: 'min', message: '{label} must be at least {0}' },
  { name: 'max', label: 'Maximum value', params: ['number'], types: ['number'], key: 'max', message: '{label} must be at most {0}' },
  { name: 'moreThan', label: 'Greater than', params: ['number'], types: ['number'], key: 'moreThan', message: '{label} must be greater than {0}' },
  { name: 'lessThan', label: 'Less than', params: ['number'], types: ['number'], key: 'lessThan', message: '{label} must be less than {0}' },
  { name: 'integer', label: 'Whole number', params: [], types: ['number'], key: 'integer', message: '{label} must be a whole number' },
  { name: 'positive', label: 'Positive', params: [], types: ['number'], key: 'positive', message: '{label} must be a positive number' },
  { name: 'negative', label: 'Negative', params: [], types: ['number'], key: 'negative', message: '{label} must be a negative number' },
  { name: 'minField', label: 'At least the value of…', hint: 'Another field', params: ['field'], types: ['number'], key: 'minField', message: '{label} must be at least {0}' },
  { name: 'maxField', label: 'At most the value of…', hint: 'Another field', params: ['field'], types: ['number'], key: 'maxField', message: '{label} must be at most {0}' },

  { name: 'min', label: 'Earliest date', params: ['date'], types: ['date'], key: 'minDate', message: '{label} must be on or after {0}' },
  { name: 'max', label: 'Latest date', params: ['date'], types: ['date'], key: 'maxDate', message: '{label} must be on or before {0}' },
  { name: 'minField', label: 'Not before…', hint: 'Another date field', params: ['field'], types: ['date'], key: 'notBeforeField', message: '{label} must be on or after {0}' },
  { name: 'maxField', label: 'Not after…', hint: 'Another date field', params: ['field'], types: ['date'], key: 'notAfterField', message: '{label} must be on or before {0}' },

  { name: 'maxFileSize', label: 'Maximum file size', hint: 'MB per file', params: ['number'], types: ['file'], key: 'maxFileSize', message: 'Each file must be smaller than {0} MB' },
  { name: 'fileTypes', label: 'Allowed file types', hint: 'e.g. .pdf, .png, image/*', params: ['list'], types: ['file'], key: 'fileTypes', message: 'This file type is not allowed' },
  { name: 'minFiles', label: 'Minimum number of files', params: ['number'], types: ['file'], key: 'minFiles', message: 'Upload at least {0} file(s)' },
  { name: 'maxFiles', label: 'Maximum number of files', params: ['number'], types: ['file'], key: 'maxFiles', message: 'Upload at most {0} file(s)' },

  { name: 'min', label: 'Minimum choices', params: ['number'], types: ['array'], key: 'minChoices', message: 'Choose at least {0} option(s)' },
  { name: 'max', label: 'Maximum choices', params: ['number'], types: ['array'], key: 'maxChoices', message: 'Choose at most {0} option(s)' },
];

/** The validation type that decides which rules apply: file inputs always use the `file` rules. */
export const effectiveValidationType = (field: { type: string; validationType?: string }): string => (field.type === 'file' ? 'file' : field.validationType || 'string');

export const ruleSpecFor = (name: string, validationType = 'string'): RuleSpec | undefined =>
  RULE_SPECS.find(spec => spec.name === name && spec.types.includes(validationType));

export const LOGIC_OPERATORS = [
  { value: 'equals', label: 'is', needsValue: true },
  { value: 'not_equals', label: 'is not', needsValue: true },
  { value: 'contains', label: 'contains', needsValue: true },
  { value: 'not_contains', label: 'does not contain', needsValue: true },
  { value: 'gt', label: 'is greater than', needsValue: true },
  { value: 'lt', label: 'is less than', needsValue: true },
  { value: 'not_empty', label: 'is filled in', needsValue: false },
  { value: 'empty', label: 'is empty', needsValue: false },
];

let uidCounter = 0;
export function uid(prefix = 'f'): string {
  uidCounter++;
  return `${prefix}_${Math.random().toString(36).slice(2, 7)}${uidCounter.toString(36)}`;
}

/** "What's your name?" -> "whatsYourName" */
export function toModelKey(label: string, fallback = 'field'): string {
  const words = (label || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);
  if (!words.length) return fallback;
  const key = words.map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join('');
  return /^[0-9]/.test(key) ? `f${key}` : key;
}

export function uniqueModelKey(base: string, taken: Set<string>): string {
  let key = base;
  let n = 2;
  while (taken.has(key)) {
    key = `${base}${n++}`;
  }
  return key;
}

function parseMaybeJson(input: any) {
  if (typeof input === 'string') {
    return JSON.parse(input);
  }
  return input;
}

export type NormalizedDocument = { doc: FormDocument; legacy: boolean };

/** A row of columns. (Sections and repeaters are `isGroup` too, but rows are the only ones that lay children out side by side.) */
export const isContainer = (field: { type: string }) => field.type === 'columns';

/**
 * Depth first list of every field. Rows and sections are included before their children unless `leaves` is set.
 * A repeater holds a value (a list of items) and a dialog keeps its answers apart, so both count as leaves; the fields inside
 * them are only listed with `deep`.
 */
export function flattenFields(fields: FormField[], leaves = false, deep = false): FormField[] {
  const out: FormField[] = [];
  const walk = (list: FormField[]) =>
    list.forEach(field => {
      if (field.type === 'columns' || field.type === 'section' || field.type === 'tabs') {
        if (!leaves) out.push(field);
        childLists(field).forEach(l => walk(l.fields));
      } else if (field.type === 'repeater' || field.type === 'modal') {
        out.push(field);
        if (deep) walk(field.fields || []);
      } else {
        out.push(field);
      }
    });
  walk(fields);
  return out;
}

/* ------------------------------------------------------------- repeater scope */

/**
 * Answers inside a repeater live at paths like `tenants[0].email` (`rooms[1].units[3].condition` when nested).
 * Plain keys (no `[`) are ordinary top level answers.
 */
function parsePath(model: string): (string | number)[] {
  const first = model.indexOf('[');
  const out: (string | number)[] = [model.slice(0, first)];
  const re = /\[(\d+)\](?:\.([^[\]]+))?/g;
  re.lastIndex = first;
  let m: RegExpExecArray | null;
  while ((m = re.exec(model))) {
    out.push(Number(m[1]));
    if (m[2] !== undefined) out.push(m[2]);
  }
  return out;
}

export function getByPath(values: any, model: string): any {
  if (!model || !values) return undefined;
  if (model.indexOf('[') < 0) return values[model];
  let current = values;
  for (const token of parsePath(model)) {
    if (current === undefined || current === null) return undefined;
    current = current[token as any];
  }
  return current;
}

/** Returns a copy of `values` with `model` set (immutable, creates the lists / objects on the way). */
export function setByPath(values: any, model: string, value: any): any {
  if (model.indexOf('[') < 0) return { ...values, [model]: value };
  const path = parsePath(model);
  const assign = (node: any, i: number): any => {
    const key = path[i];
    // a missing level becomes a list when it is addressed by a number
    const copy: any = Array.isArray(node) || (node == null && typeof key === 'number') ? [...(node || [])] : { ...(node || {}) };
    copy[key] = i === path.length - 1 ? value : assign(node ? node[key] : undefined, i + 1);
    return copy;
  };
  return assign(values, 0);
}

/**
 * A copy of a repeater's item fields for one item: ids get a suffix and models become the item's path, so every
 * input of every item is a normal field with its own id and answer. `_key` keeps the original (relative) key, which is
 * what logic conditions and validation rules inside the item refer to.
 */
export function instantiate(fields: FormField[], modelPrefix: string, suffix: string): FormField[] {
  return fields.map(f => {
    const next: FormField = { ...f, id: `${f.id}${suffix}`, _suffix: suffix, _template: f.id, _prefix: modelPrefix };
    if (f.model) {
      next._key = f.model;
      next.model = `${modelPrefix}.${f.model}`;
      delete next.inputName;
    }
    if (f.type === 'columns') next.columns = (f.columns || []).map(c => ({ ...c, id: `${c.id}${suffix}`, fields: instantiate(c.fields || [], modelPrefix, suffix) }));
    else if (f.type === 'section') next.fields = instantiate(f.fields || [], modelPrefix, suffix);
    else if (f.type === 'tabs') next.tabs = (f.tabs || []).map(t => ({ ...t, id: `${t.id}${suffix}`, fields: instantiate(t.fields || [], modelPrefix, suffix) }));
    // a repeater (or dialog) inside an item keeps its template: its items are expanded from its path later
    return next;
  });
}

export type RepeaterItem = { index: number; model: string; suffix: string; fields: FormField[] };

/** The items of a repeater (a field or an instance of one) for the given values, each with its own copy of the fields. */
export function itemInstances(repeater: FormField, values: { [key: string]: any }): RepeaterItem[] {
  const list = getByPath(values, repeater.model as string);
  const items = Array.isArray(list) ? list : [];
  const suffix = (repeater._suffix as string) || '';
  return items.map((_item: any, index: number) => {
    const model = `${repeater.model}[${index}]`;
    const itemSuffix = `${suffix}~${index}`;
    return { index, model, suffix: itemSuffix, fields: instantiate(repeater.fields || [], model, itemSuffix) };
  });
}

/** The starting answers of `fields` (default values; repeaters get their minimum number of blank items). */
export function defaultValues(fields: FormField[]): { [key: string]: any } {
  const out: { [key: string]: any } = {};
  flattenFields(fields, true).forEach(field => {
    if (!field.model || isLayoutType(field.type)) return;
    if (field.type === 'repeater') {
      out[field.model] = repeaterDefault(field);
    } else if (field.defaultValue !== undefined) {
      out[field.model] = deepClone(field.defaultValue);
    } else if (field.type === 'slider') {
      out[field.model] = (field.config && field.config.min) || 0;
    }
  });
  return out;
}

/** A new item of `repeater` with the defaults of its fields, plus `extra` answers. */
export function blankItem(repeater: FormField, extra: { [key: string]: any } = {}): { [key: string]: any } {
  const item: { [key: string]: any } = { ...defaultValues(repeater.fields || []), ...deepClone(extra) };
  // items given for a repeater inside this one start from its defaults too
  flattenFields(repeater.fields || [], true)
    .filter(f => f.type === 'repeater' && f.model && Array.isArray(extra[f.model]))
    .forEach(nested => (item[nested.model as string] = extra[nested.model as string].map((inner: any) => blankItem(nested, inner))));
  return item;
}

function repeaterDefault(repeater: FormField): any[] {
  const given = Array.isArray(repeater.defaultValue) ? repeater.defaultValue : [];
  const items = given.map((item: any) => blankItem(repeater, item));
  const min = Number(repeater.config && repeater.config.minItems) || 0;
  while (items.length < min) items.push(blankItem(repeater));
  return items;
}

/** Horizontal placement helpers shared by the generator and the builder. */
export function rowLayout(row: { config?: { [key: string]: any }; columns?: FormColumn[] }) {
  const spans = (row.columns || []).map(c => Math.min(12, Math.max(1, c.span || 1)));
  const total = spans.reduce((a, b) => a + b, 0);
  const free = Math.max(0, 12 - total);
  const justify = (row.config && row.config.justify) || 'start';
  const start = justify === 'center' ? Math.floor(free / 2) : justify === 'end' ? free : 0;
  const align = (row.config && row.config.align) || 'start';
  return { spans, total, firstColumn: start + 1, alignItems: align === 'stretch' ? 'stretch' : align === 'center' ? 'center' : align === 'end' ? 'end' : 'start' };
}

/**
 * Before v2.1 fields had a width (`layout.cols`) and neighbours simply flowed next to each other. Rows are now explicit
 * `columns` blocks, so adjacent partial-width fields are grouped into one row (a lone one becomes a narrow row).
 */
export function upgradeColsToRows(fields: FormField[]): FormField[] {
  if (!fields.some(f => !isContainer(f) && f.layout && f.layout.cols && f.layout.cols < 12)) {
    return fields.map(stripCols);
  }
  const out: FormField[] = [];
  let group: FormField[] = [];
  let used = 0;
  const flush = () => {
    if (!group.length) return;
    out.push({
      type: 'columns',
      id: uid('row'),
      config: { align: 'start', justify: 'start' },
      columns: group.map(f => ({ id: uid('col'), span: (f.layout && f.layout.cols) || 12, fields: [stripCols(f)] })),
    });
    group = [];
    used = 0;
  };
  fields.forEach(field => {
    const cols = !isContainer(field) && !['heading', 'paragraph', 'divider', 'pageBreak'].includes(field.type) ? (field.layout && field.layout.cols) || 12 : 12;
    if (cols >= 12) {
      flush();
      out.push(stripCols(field));
      return;
    }
    if (used + cols > 12) flush();
    group.push(field);
    used += cols;
  });
  flush();
  return out;
}

function stripCols(field: FormField): FormField {
  if (!field.layout || !('cols' in field.layout)) return field;
  const { cols, ...layout } = field.layout;
  const next = { ...field, layout };
  if (!Object.keys(layout).length) delete next.layout;
  return next;
}

function ensureIds(fields: FormField[]): FormField[] {
  return fields.filter(Boolean).map((field: FormField) => {
    const next = { ...field };
    if (!next.id) next.id = uid();
    if (isContainer(next)) {
      next.columns = (next.columns || []).map(column => ({ ...column, id: column.id || uid('col'), span: column.span || 6, fields: ensureIds(column.fields || []) }));
    } else if (next.type === 'tabs') {
      next.tabs = (next.tabs || []).map(t => ({ ...t, id: t.id || uid('tab'), label: t.label || '', fields: ensureIds(t.fields || []) }));
    } else if (next.type === 'section' || next.type === 'modal') {
      next.fields = ensureIds(next.fields || []);
    } else if (next.type === 'repeater') {
      next.fields = ensureIds(next.fields || []);
      if (!next.model) next.model = next.inputName || next.id;
    } else if (!isLayoutType(next.type) && !next.model) {
      next.model = next.inputName || next.id;
    }
    return next;
  });
}

/**
 * Accepts a v2 document (object or JSON string) and returns it with ids / model keys filled in and legacy
 * per-field widths upgraded to rows. A bare array is treated as a flat list of v2 fields; use `loadDocument`
 * (migrate.ts) to accept v1 schemas too.
 */
export function normalizeDocument(input: any): NormalizedDocument {
  const parsed = parseMaybeJson(input);
  let doc: FormDocument;
  let legacy = false;
  if (Array.isArray(parsed) || parsed == null) {
    legacy = true;
    doc = { version: 2, fields: parsed || [] };
  } else if (typeof parsed === 'object' && Array.isArray(parsed.fields)) {
    doc = { ...parsed, version: parsed.version || 2 };
  } else {
    throw new Error('Schema must be an array of fields or an object with a "fields" array');
  }
  doc.fields = upgradeColsToRows(ensureIds(doc.fields));
  return { doc, legacy };
}

export function isEmptyValue(value: any): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof FileList !== 'undefined' && value instanceof FileList) return value.length === 0;
  return false;
}

export function evaluateCondition(condition: LogicCondition, values: { [key: string]: any }): boolean {
  const actual = getByPath(values, condition.field);
  const expected = condition.value;
  const asArray = (v: any) => (Array.isArray(v) ? v.map(String) : [String(v ?? '')]);
  switch (condition.operator) {
    case 'equals':
      return Array.isArray(actual) ? actual.map(String).includes(String(expected)) : String(actual ?? '') === String(expected ?? '');
    case 'not_equals':
      return !evaluateCondition({ ...condition, operator: 'equals' }, values);
    case 'contains':
      return Array.isArray(actual) ? asArray(actual).includes(String(expected)) : String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
    case 'not_contains':
      return !evaluateCondition({ ...condition, operator: 'contains' }, values);
    // a list (checkboxes, repeater items) is compared by its number of entries
    case 'gt':
      return Array.isArray(actual) ? actual.length > Number(expected) : !isEmptyValue(actual) && Number(actual) > Number(expected);
    case 'lt':
      return Array.isArray(actual) ? actual.length < Number(expected) : !isEmptyValue(actual) && Number(actual) < Number(expected);
    case 'empty':
      return isEmptyValue(actual);
    case 'not_empty':
      return !isEmptyValue(actual);
    default:
      return true;
  }
}

export type FieldStates = { visible: { [id: string]: boolean }; disabled: { [id: string]: boolean }; required: { [id: string]: boolean } };

/**
 * Evaluates the logic of `fields` (shown / disabled / required, by field id) into `states`. `scope` is what conditions can
 * read (the form's answers, plus the item's own answers inside a repeater); `values` are the real answers, used to find the
 * items of repeaters.
 */
export function evaluateStates(fields: FormField[], values: { [key: string]: any }, scope: { [key: string]: any }, states: FieldStates, parentVisible = true, parentDisabled = false) {
  const walk = (list: FormField[], visibleSoFar: boolean, disabledSoFar: boolean, current: { [key: string]: any }) =>
    list.forEach(field => {
      let visible = visibleSoFar && field.visible !== false;
      let disabled = disabledSoFar;
      let required = false;
      logicRules(field).forEach(rule => {
        const conditions = (rule.conditions || []).filter(c => c.field);
        if (!conditions.length) return;
        const results = conditions.map(c => evaluateCondition(c, current));
        const matched = rule.match === 'any' ? results.some(Boolean) : results.every(Boolean);
        if (rule.action === 'hide') {
          if (matched) visible = false;
        } else if (rule.action === 'disable') {
          if (matched) disabled = true;
        } else if (rule.action === 'enable') {
          if (!matched) disabled = true;
        } else if (rule.action === 'require') {
          if (matched) required = true;
        } else if (!matched) {
          visible = false; // show
        }
      });
      states.visible[field.id] = visible;
      states.disabled[field.id] = disabled || field.disabled === true;
      states.required[field.id] = required;
      if (!visible && field.model) delete current[(field._key as string) || field.model];
      if (field.type === 'columns') (field.columns || []).forEach(column => walk(column.fields || [], visible, disabled, current));
      else if (field.type === 'section') walk(field.fields || [], visible, disabled, current);
      else if (field.type === 'tabs') (field.tabs || []).forEach(tab => walk(tab.fields || [], visible, disabled, current));
      else if (field.type === 'repeater') {
        itemInstances(field, values).forEach(item => walk(item.fields, visible, disabled, { ...current, ...(getByPath(values, item.model) || {}) }));
      }
    });
  walk(fields, parentVisible, parentDisabled, scope);
}

/**
 * Evaluates every field's logic for the given values: is it shown, disabled, required. Fields are evaluated in order
 * (rows, sections and tabs included) and a field hidden by logic counts as "empty" for the fields that depend on it. Hiding a
 * block hides everything in it, disabling one disables it all. Fields inside a repeater are evaluated once per item (their
 * ids are `<id>~<item>`), and their conditions can use the other fields of the same item. The fields of a dialog are not
 * part of the form: see `DRAFT`.
 */
export function computeStates(fields: FormField[], values: { [key: string]: any }): FieldStates {
  const states: FieldStates = { visible: {}, disabled: {}, required: {} };
  evaluateStates(fields, values, { ...values }, states);
  return states;
}

/** Which fields are visible for the given values (see `computeStates`). */
export function computeVisibility(fields: FormField[], values: { [key: string]: any }): { [id: string]: boolean } {
  return computeStates(fields, values).visible;
}

/* --------------------------------------------------------------- dialog answers */

/**
 * The answers typed in a dialog (an "add item" form, a block of type `modal`) are kept apart from the form's answers under
 * keys that start with `__draft.` until the dialog is confirmed. The fields of the dialog are instantiated with this prefix.
 */
export const DRAFT = '__draft';
export const DRAFT_SUFFIX = '~draft';
export const draftFields = (fields: FormField[]) => instantiate(fields, DRAFT, DRAFT_SUFFIX);

/** The dialog's answers as a plain object (`{ type: "x" }`). */
export function draftObject(values: { [key: string]: any }): { [key: string]: any } {
  const out: { [key: string]: any } = {};
  Object.keys(values).forEach(key => {
    if (key.startsWith(`${DRAFT}.`)) out[key.slice(DRAFT.length + 1)] = values[key];
  });
  return out;
}

/** `values` with the dialog's answers replaced by `draft` (pass `{}` to clear them). */
export function withDraft(values: { [key: string]: any }, draft: { [key: string]: any }): { [key: string]: any } {
  const out: { [key: string]: any } = {};
  Object.keys(values).forEach(key => {
    if (!key.startsWith(`${DRAFT}.`)) out[key] = values[key];
  });
  Object.keys(draft).forEach(key => (out[`${DRAFT}.${key}`] = draft[key]));
  return out;
}

/** Minimal HTML sanitizer so labels can keep simple formatting (<b>, <a>, ...) safely. */
const ALLOWED_TAGS = ['B', 'STRONG', 'I', 'EM', 'U', 'A', 'BR', 'SPAN', 'SMALL', 'CODE'];
export function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined' || html == null) return html;
  const value = String(html);
  if (!/[<&]/.test(value)) return value;
  const template = document.createElement('template');
  template.innerHTML = value;
  const walk = (node: Element) => {
    Array.from(node.children).forEach((child: Element) => {
      if (!ALLOWED_TAGS.includes(child.tagName)) {
        child.replaceWith(document.createTextNode(child.textContent || ''));
        return;
      }
      Array.from(child.attributes).forEach(attr => {
        const keep = child.tagName === 'A' && ['href', 'target', 'rel'].includes(attr.name) && !/^\s*javascript:/i.test(attr.value);
        if (!keep) child.removeAttribute(attr.name);
      });
      walk(child);
    });
  };
  walk(template.content as any);
  return template.innerHTML;
}

export function deepClone<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}
