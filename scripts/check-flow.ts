/**
 * Checks the flow engine (repeaters, scoped logic, rule states, defaults, i18n of nested blocks).
 * Run with: npx tsx scripts/check-flow.ts
 */
import { FormField, blankItem, computeStates, defaultValues, flattenFields, getByPath, itemInstances, setByPath } from '../src/utils/schema';
import { BUILT_IN_UI, UI_KEYS, collectTranslatables, localizeDocument } from '../src/utils/i18n';

let failures = 0;
const check = (name: string, ok: boolean, detail?: any) => {
  if (!ok) {
    failures++;
    console.error('FAIL', name, detail !== undefined ? JSON.stringify(detail) : '');
  } else console.log('ok  ', name);
};

const input = (id: string, model: string, extra: Partial<FormField> = {}): FormField => ({ type: 'input', inputType: 'text', id, model, label: model, ...extra });

const units: FormField = {
  type: 'repeater',
  id: 'units',
  model: 'units',
  config: { layout: 'table', presets: [] },
  fields: [
    input('u', 'unit'),
    input('c', 'condition', { defaultValue: 'New' }),
    input('d', 'defect', { logic: { action: 'show', match: 'any', conditions: [{ field: 'condition', operator: 'equals', value: 'Damaged' }] } }),
  ],
};
const rooms: FormField = {
  type: 'repeater',
  id: 'rooms',
  model: 'rooms',
  config: { minItems: 1, presets: [{ label: 'Kitchen', description: 'With stove', values: { name: 'Kitchen', units: [{ unit: 'Stove' }] } }] },
  fields: [input('n', 'name'), units, { type: 'toggle', id: 't', model: 'done', label: 'done', defaultValue: false }],
};
const button: FormField = { type: 'button', id: 'b', label: 'Go', logic: { action: 'disable', match: 'all', conditions: [{ field: 'rooms', operator: 'lt', value: 2 }] } };
const phone: FormField = input('p', 'phone', { logic: { action: 'require', match: 'all', conditions: [{ field: 'name0', operator: 'not_empty' }] } });
const fields: FormField[] = [input('n0', 'name0'), rooms, button, phone];

// paths
let values: any = { rooms: [{ name: 'A', units: [{ unit: 'x', condition: 'Damaged' }, { unit: 'y', condition: 'New' }] }] };
check('getByPath nested', getByPath(values, 'rooms[0].units[1].condition') === 'New');
values = setByPath(values, 'rooms[0].units[1].condition', 'Worn');
check('setByPath nested + immutable', getByPath(values, 'rooms[0].units[1].condition') === 'Worn' && values.rooms[0].units[0].condition === 'Damaged');
const created = setByPath({}, 'rooms[2].name', 'Z');
check('setByPath creates lists', Array.isArray(created.rooms) && created.rooms[2].name === 'Z');

// instances
const items = itemInstances(rooms, values);
check('item instances', items.length === 1 && items[0].model === 'rooms[0]' && items[0].fields[0].model === 'rooms[0].name' && items[0].fields[0].id === 'n~0');
const nested = itemInstances(items[0].fields[1], values);
check('nested item instances', nested.length === 2 && nested[1].fields[1].model === 'rooms[0].units[1].condition' && nested[1].fields[1].id === 'c~0~1', nested.map(n => n.fields[1].id));

// states
let st = computeStates(fields, { ...values, name0: '' });
check('defect shown only for damaged unit', st.visible['d~0~0'] === true && st.visible['d~0~1'] === false);
check('button disabled while rooms < 2', st.disabled['b'] === true);
st = computeStates(fields, { ...values, rooms: [...values.rooms, { name: 'B', units: [] }], name0: 'x' });
check('button enabled with 2 rooms (array length compare)', st.disabled['b'] === false);
check('require rule', st.required['p'] === true && computeStates(fields, { ...values, name0: '' }).required['p'] === false);
const hiddenRepeater = computeStates([{ ...rooms, visible: false }], values);
check('hidden repeater hides items', hiddenRepeater.visible['n~0'] === false);

// defaults
const defaults = defaultValues(fields);
check('repeater minItems default', Array.isArray(defaults.rooms) && defaults.rooms.length === 1 && defaults.rooms[0].done === false && Array.isArray(defaults.rooms[0].units));
const preset = blankItem(rooms, rooms.config!.presets[0].values);
check('preset fills nested items with defaults', preset.name === 'Kitchen' && preset.units[0].unit === 'Stove' && preset.units[0].condition === 'New', preset);
check('flattenFields shallow vs deep', flattenFields(fields, true).length === 4 && flattenFields(fields, true, true).length === 10, [flattenFields(fields, true).length, flattenFields(fields, true, true).length]);

// i18n
const doc: any = {
  version: 2,
  fields: [
    { ...rooms, fields: [rooms.fields![0], { ...units, label: 'Units', fields: [input('u', 'unit', { label: 'Unit' })] }] },
    { type: 'radioGroup', id: 'r', model: 'r', label: 'Pick', options: [{ label: 'A', value: 'a', description: 'About A' }] },
  ],
  settings: { nextButtonText: 'Next', exitText: 'Save' },
  i18n: { defaultLanguage: 'en', languages: ['en', 'da'], translations: { da: { 'field.u.label': 'Enhed', 'field.r.optionDesc.a': 'Om A', 'field.rooms.preset.0.label': 'Køkken', 'settings.nextButtonText': 'Næste' } } },
};
const keys = collectTranslatables(doc).map(t => t.key);
check('collects nested labels, option descriptions, presets, settings', ['field.u.label', 'field.r.optionDesc.a', 'field.rooms.preset.0.label', 'settings.nextButtonText'].every(k => keys.includes(k)), keys);
const da = localizeDocument(doc, 'da');
const roomsDa: any = da.fields[0];
check('localizes nested + presets + descriptions + settings', roomsDa.fields[1].fields[0].label === 'Enhed' && roomsDa.config.presets[0].label === 'Køkken' && (da.fields[1] as any).options[0].description === 'Om A' && da.settings!.nextButtonText === 'Næste');

const english = Object.keys(BUILT_IN_UI.en);
Object.keys(BUILT_IN_UI).forEach(lang => {
  const dict = BUILT_IN_UI[lang];
  const missing = english.filter(k => !dict[k]);
  const placeholders = english.filter(k => (BUILT_IN_UI.en[k].match(/\{\w+\}/g) || []).sort().join() !== ((dict[k] || '').match(/\{\w+\}/g) || []).sort().join());
  check(`built-in texts ${lang} complete (${english.length} keys)`, !missing.length && !placeholders.length, { missing, placeholders });
});
check('UI_KEYS includes the extras', UI_KEYS.includes('ui.itemTitle') && UI_KEYS.includes('validation.minItems'));

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
