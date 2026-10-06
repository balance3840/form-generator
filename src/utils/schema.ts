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
  logic?: FieldLogic;
  config?: { [key: string]: any };
  attributes?: { [key: string]: any };
  values?: { value: any; display?: string; group?: string }[];
  items?: { label: string; attributes?: { [key: string]: any } }[];
  [key: string]: any;
};

export type FormColumn = { id: string; span: number; fields: FormField[] };

export type FieldLogic = {
  action: 'show' | 'hide';
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
};

/** Field types that only display content and never hold a value. */
export const LAYOUT_TYPES = ['heading', 'paragraph', 'divider', 'pageBreak', 'columns'];

export const isLayoutType = (type: string) => LAYOUT_TYPES.includes(type);

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

export const isContainer = (field: { type: string }) => field.type === 'columns';

/** Depth first list of every field. Containers (`columns` rows) are included before their children unless `leaves` is set. */
export function flattenFields(fields: FormField[], leaves = false): FormField[] {
  const out: FormField[] = [];
  const walk = (list: FormField[]) =>
    list.forEach(field => {
      if (isContainer(field)) {
        if (!leaves) out.push(field);
        (field.columns || []).forEach(column => walk(column.fields || []));
      } else {
        out.push(field);
      }
    });
  walk(fields);
  return out;
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
  const actual = values[condition.field];
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
    case 'gt':
      return !isEmptyValue(actual) && Number(actual) > Number(expected);
    case 'lt':
      return !isEmptyValue(actual) && Number(actual) < Number(expected);
    case 'empty':
      return isEmptyValue(actual);
    case 'not_empty':
      return !isEmptyValue(actual);
    default:
      return true;
  }
}

/**
 * Computes which fields are visible for the given values. Fields are evaluated in order (rows included), and a
 * field hidden by logic counts as "empty" for the fields that depend on it. Hiding a row hides everything in it.
 */
export function computeVisibility(fields: FormField[], values: { [key: string]: any }): { [id: string]: boolean } {
  const visibility: { [id: string]: boolean } = {};
  const effective: { [key: string]: any } = { ...values };
  const walk = (list: FormField[], parentVisible: boolean) =>
    list.forEach(field => {
      let visible = parentVisible && field.visible !== false;
      const logic = field.logic;
      if (visible && logic && logic.conditions && logic.conditions.length) {
        const results = logic.conditions.filter(c => c.field).map(c => evaluateCondition(c, effective));
        if (results.length) {
          const matched = logic.match === 'any' ? results.some(Boolean) : results.every(Boolean);
          visible = logic.action === 'hide' ? !matched : matched;
        }
      }
      visibility[field.id] = visible;
      if (!visible && field.model) {
        delete effective[field.model];
      }
      if (isContainer(field)) (field.columns || []).forEach(column => walk(column.fields || [], visible));
    });
  walk(fields, true);
  return visibility;
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
