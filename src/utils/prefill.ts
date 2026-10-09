import { FormDocument, FormField, flattenFields } from './schema';

/**
 * Auto-fill: a field says where its answer comes from (`config.prefill = "tenant.phone"`), the host application supplies the data.
 * The form document stays plain JSON, nothing here talks to a server.
 *
 *   field.config.prefill      key into the data object (dotted path)
 *   field.config.prefillLock  true = the visitor sees the value but cannot change it
 *   {{key}}                   in any text of the document (title, description, labels, texts…) is replaced by the value
 */

export type PrefillSource = {
  key: string;
  label: string;
  group?: string;
  /** Hint for the builder: what kind of field it fits. */
  kind?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'list';
  example?: string;
};

export type PrefillData = { [key: string]: any };

const TOKEN = /\{\{\s*([\w.[\]-]+)\s*\}\}/g;

const hasValue = (value: any) => value !== undefined && value !== null && value !== '';

function lookup(data: PrefillData, key: string): any {
  if (hasValue(data[key])) return data[key];
  return key.split('.').reduce<any>((node, part) => (node === undefined || node === null ? undefined : node[part]), data);
}

/** Replaces `{{key}}` in every string of a value (deep). Unknown keys become empty. */
function interpolate<T>(input: T, data: PrefillData): T {
  if (typeof input === 'string') {
    return input.replace(TOKEN, (_, key) => {
      const value = lookup(data, key);
      return hasValue(value) && typeof value !== 'object' ? String(value) : '';
    }) as unknown as T;
  }
  if (Array.isArray(input)) return input.map(item => interpolate(item, data)) as unknown as T;
  if (input && typeof input === 'object') {
    const out: { [key: string]: any } = {};
    Object.keys(input as object).forEach(k => (out[k] = interpolate((input as any)[k], data)));
    return out as T;
  }
  return input;
}

/** Every field that asks for auto-fill, with the key it asks for. */
export function prefillFields(doc: FormDocument): { field: FormField; key: string }[] {
  return flattenFields(doc.fields || [], true)
    .filter(field => field.model && typeof field.config?.prefill === 'string' && field.config.prefill)
    .map(field => ({ field, key: field.config!.prefill as string }));
}

/** The keys a document wants, to check against what the host can provide. */
export function prefillKeys(doc: FormDocument): string[] {
  const keys = new Set<string>(prefillFields(doc).map(item => item.key));
  const json = JSON.stringify(doc);
  let m: RegExpExecArray | null;
  const re = new RegExp(TOKEN.source, 'g');
  while ((m = re.exec(json))) keys.add(m[1]);
  return [...keys];
}

/** Initial values (keyed by field model) for the fields that ask for auto-fill. */
export function prefillValues(doc: FormDocument, data: PrefillData): { [model: string]: any } {
  const values: { [model: string]: any } = {};
  prefillFields(doc).forEach(({ field, key }) => {
    const value = lookup(data, key);
    if (hasValue(value)) values[field.model as string] = value;
  });
  return values;
}

/**
 * Fills `{{tokens}}` in the document and locks the fields that asked for it (only when they actually got a value).
 * Returns a copy; the input is not touched.
 */
export function applyPrefill(doc: FormDocument, data: PrefillData): { doc: FormDocument; values: { [model: string]: any } } {
  const values = prefillValues(doc, data);
  const copy = interpolate(JSON.parse(JSON.stringify(doc)) as FormDocument, data);
  flattenFields(copy.fields || [], true).forEach(field => {
    if (field.model && field.config?.prefillLock && hasValue(values[field.model])) field.readonly = true;
  });
  return { doc: copy, values };
}
