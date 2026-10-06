import { FormDocument, FormField, NormalizedDocument, isLayoutType, normalizeDocument, uid, upgradeColsToRows } from './schema';

/**
 * v1 -> v2 migration.
 *
 * v1 was a bare array of fields positioned with `layout.row` / `layout.group`, with the API
 * configuration passed in separate `action` / `mapping` props. v2 is a single document:
 *
 *   { version: 2, title, description, fields, theme, settings, action }
 *
 * `migrateV1` converts as much as possible and returns human readable `notes` describing
 * every change that was made, so nothing happens silently.
 */

export type MigrationResult = { doc: FormDocument; notes: string[] };

export type MigrationOptions = {
  /** The v1 `action` prop (object or JSON string). */
  action?: any;
  /** The v1 `mapping` prop (object or JSON string). */
  mapping?: any;
  /**
   * v1 hid every field that did not say `visible: true`. By default the migration keeps that behaviour
   * (those fields get `visible: false`). Set this to show them instead.
   */
  showFieldsWithoutVisible?: boolean;
};

const parse = (value: any) => (typeof value === 'string' ? JSON.parse(value) : value);

export function isLegacySchema(input: any): boolean {
  const parsed = parse(input);
  if (Array.isArray(parsed)) return true;
  return !!parsed && typeof parsed === 'object' && Array.isArray(parsed.fields) && !(parsed.version >= 2);
}

export function migrateV1(input: any, options: MigrationOptions = {}): MigrationResult {
  const parsed = parse(input);
  const notes: string[] = [];
  const source: FormField[] = (Array.isArray(parsed) ? parsed : parsed.fields || []).filter(Boolean).map((f: FormField) => ({ ...f }));
  const doc: FormDocument = { version: 2, fields: [] };

  // ---- 1. Layout: rows and groups become a flat list on a 12 column grid ----
  const ordered: FormField[] = [];
  const groupsSeen = new Set<string>();
  let rowCount = 0;
  let groupCount = 0;

  const placeRows = (list: FormField[]) => {
    const placedRows = new Set<string>();
    list.forEach(field => {
      const row = field.layout && field.layout.row;
      if (!row) {
        ordered.push(field);
        return;
      }
      if (placedRows.has(row)) return;
      placedRows.add(row);
      rowCount++;
      const members = list.filter(f => f.layout && f.layout.row === row);
      const total = members.reduce((sum, m) => sum + ((m.layout && m.layout.cols) || 0), 0);
      const fallback = Math.max(1, Math.floor(12 / members.length));
      members.forEach(m => {
        m.layout = { ...m.layout, cols: (m.layout && m.layout.cols) || fallback };
      });
      if (total > 12) {
        notes.push(`Row "${row}" had more than 12 columns; the extra fields will wrap onto a new line.`);
      }
      ordered.push(...members);
    });
  };

  source.forEach(field => {
    const group = field.layout && field.layout.group;
    if (!group) {
      placeRows([field]);
      return;
    }
    if (groupsSeen.has(group)) return;
    groupsSeen.add(group);
    groupCount++;
    const members = source.filter(f => f.layout && f.layout.group === group);
    const title = members.map(m => m.layout && m.layout.groupTitle).find(Boolean);
    if (title) {
      ordered.push({ type: 'heading', id: `heading_${groupCount}`, label: title, config: { level: 'h2' } });
    }
    placeRows(members);
  });

  if (groupCount) notes.push(`${groupCount} group(s) were flattened; group titles became heading blocks.`);
  if (rowCount) notes.push(`${rowCount} row(s) were converted to rows with columns.`);

  // ---- 2. Per field upgrades ----
  const hiddenFixed: string[] = [];
  let choiceFixed = false;
  doc.fields = ordered.map(original => {
    const field: FormField = { ...original };

    // `cols` only mattered inside rows in v1. A lone field was always full width.
    if (field.layout) {
      const { row, group, groupTitle, ...layout } = field.layout;
      if (!row && layout.cols && layout.cols !== 12) {
        delete layout.cols;
      }
      field.layout = layout;
      if (!Object.keys(layout).length) delete field.layout;
    }

    // v1 hid every field that did not explicitly say `visible: true`. v2 shows them by default.
    if (!isLayoutType(field.type) && field.visible === undefined) {
      if (!options.showFieldsWithoutVisible) field.visible = false;
      hiddenFixed.push(field.model || field.id || field.inputName);
    }

    if (!field.id) field.id = uid();
    if (!isLayoutType(field.type) && !field.model) field.model = field.inputName || field.id;

    // v1 had three different shapes for choices; v2 always uses `options: [{ label, value, group? }]`.
    if (field.type === 'select' || field.type === 'multiSelect') {
      if (Array.isArray(field.values)) {
        choiceFixed = true;
        field.options = field.values.map((v: any) => ({ label: String(v.display !== undefined ? v.display : v.value), value: v.value, ...(v.group ? { group: v.group } : {}) }));
        delete field.values;
      }
    }
    if ((field.type === 'checkboxGroup' || field.type === 'radioGroup') && Array.isArray(field.items)) {
      choiceFixed = true;
      const checked = field.items.filter((item: any) => item.attributes && item.attributes.checked).map((item: any) => item.attributes.value);
      field.options = field.items.map((item: any) => ({ label: item.label, value: item.attributes && item.attributes.value !== undefined ? item.attributes.value : item.label }));
      delete field.items;
      if (checked.length && field.defaultValue === undefined) {
        field.defaultValue = field.type === 'radioGroup' ? checked[0] : checked;
      }
    }

    // multiSelect `defaultOptions` were indexes into the options list.
    if (field.type === 'multiSelect' && Array.isArray(field.defaultOptions)) {
      const options = field.options || [];
      field.defaultValue = field.defaultOptions.map((index: number) => options[index] && options[index].value).filter((v: any) => v !== undefined);
      delete field.defaultOptions;
    }
    delete field.selectedWord;

    return field;
  });

  if (choiceFixed) notes.push('Choice fields now use a single "options" list ({ label, value }) instead of "values" / "items".');
  if (hiddenFixed.length) {
    notes.push(
      options.showFieldsWithoutVisible
        ? `v1 hid fields without "visible": true. ${hiddenFixed.length} field(s) had no "visible" property and are now shown (${hiddenFixed.join(', ')}).`
        : `v1 hid fields without "visible": true. ${hiddenFixed.length} field(s) had no "visible" property and were set to visible:false to keep the same behaviour (${hiddenFixed.join(', ')}). Remove the property to show them.`,
    );
  }

  // ---- 3. Form level configuration ----
  if (!Array.isArray(parsed)) {
    ['title', 'description', 'theme'].forEach(key => {
      if (parsed[key] !== undefined) doc[key] = parsed[key];
    });
  }

  const action = options.action !== undefined ? parse(options.action) : !Array.isArray(parsed) ? parsed.action : undefined;
  if (action && Object.keys(action).length) {
    const { submitButtonText, successMessage, errorMessage, formErrorMessage, ...rest } = action;
    const settings: { [key: string]: any } = {};
    if (submitButtonText) settings.submitButtonText = submitButtonText;
    if (successMessage) settings.successMessage = successMessage;
    if (errorMessage) settings.errorMessage = errorMessage;
    if (formErrorMessage) settings.formErrorMessage = formErrorMessage;
    if (rest.webhoookEndpoint) {
      rest.webhookEndpoint = rest.webhoookEndpoint;
      delete rest.webhoookEndpoint;
      notes.push('The misspelled "webhoookEndpoint" action key was renamed to "webhookEndpoint".');
    }
    if (rest.recaptchaSiteKey) {
      settings.captcha = { provider: 'recaptcha', siteKey: rest.recaptchaSiteKey };
      delete rest.recaptchaSiteKey;
      notes.push('"recaptchaSiteKey" became "settings.captcha": { provider: "recaptcha", siteKey }.');
    }
    doc.action = rest;
    if (Object.keys(settings).length) doc.settings = settings;
    notes.push('The "action" prop was merged into the document ("action" + "settings").');
  }

  const mapping = options.mapping !== undefined ? parse(options.mapping) : !Array.isArray(parsed) ? parsed.mapping : undefined;
  if (mapping && Object.keys(mapping).length) {
    doc.action = { ...(doc.action || {}), mapping };
    notes.push('The "mapping" prop was moved to "action.mapping".');
  }

  doc.fields = upgradeColsToRows(doc.fields);

  if (!notes.length) notes.push('Nothing needed to change; the schema is now wrapped in a v2 document.');
  return { doc, notes };
}

/** Accepts v1 or v2 schemas (object or JSON string). v1 schemas are migrated on the fly. */
export function loadDocument(input: any, options: MigrationOptions = {}): NormalizedDocument & { notes: string[] } {
  if (isLegacySchema(input)) {
    const { doc, notes } = migrateV1(input, options);
    return { ...normalizeDocument(doc), legacy: true, notes };
  }
  return { ...normalizeDocument(input), notes: [] };
}
