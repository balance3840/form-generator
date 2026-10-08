/**
 * Checks the flow engine (repeaters, scoped logic, rule states, defaults, i18n of nested blocks).
 * Run with: npx tsx scripts/check-flow.ts
 */
import { FormField, blankItem, childLists, computeStates, defaultValues, draftFields, draftObject, evaluateStates, flattenFields, getByPath, itemInstances, setByPath, withChildList, withDraft } from '../src/utils/schema';
import { pageGradientCss, pageGradientStops, pageMode, pageStyle, pageStyleText, resolveTheme, safeImageUrl, themeToCssVars } from '../src/utils/themes';
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

// tabs and dialogs
const tabs: FormField = { type: 'tabs', id: 'tb', tabs: [{ id: 't1', label: 'Units', fields: [input('a', 'alpha')] }, { id: 't2', label: 'Notes', fields: [input('b', 'beta', { logic: { action: 'hide', match: 'all', conditions: [{ field: 'alpha', operator: 'equals', value: 'x' }] } })] }] };
const dialog: FormField = { type: 'modal', id: 'dlg', label: 'Dialog', fields: [input('d1', 'state'), input('d2', 'why', { logic: { action: 'show', match: 'all', conditions: [{ field: 'state', operator: 'equals', value: 'bad' }] } })] };
check('tabs expose one list per tab', childLists(tabs).map(l => l.id).join() === 't1,t2');
check('withChildList edits one tab', (withChildList(tabs, 't2', []).tabs![1].fields.length === 0) && withChildList(tabs, 't2', []).tabs![0].fields.length === 1);
check('tab fields are transparent, dialog is opaque', flattenFields([tabs, dialog], true).map(f => f.id).join() === 'a,b,dlg' && flattenFields([dialog], true, true).length === 3);
const tabStates = computeStates([input('alpha0', 'alpha'), tabs], { alpha: 'x' });
check('rules work across tabs', tabStates.visible['b'] === false && tabStates.visible['a'] === true);
let withDraftValues: any = withDraft({ name: 'kept' }, { state: 'bad', units: [{ a: 1 }] });
check('draft keys are kept apart and read back', withDraftValues['__draft.state'] === 'bad' && draftObject(withDraftValues).state === 'bad' && withDraftValues.name === 'kept' && !('name' in draftObject(withDraftValues)));
check('clearing the draft', Object.keys(withDraft(withDraftValues, {})).join() === 'name');
const instances = draftFields(dialog.fields!);
check('dialog fields live in the draft namespace', instances[0].model === '__draft.state' && instances[0].id === 'd1~draft' && instances[0]._key === 'state');
const dialogStates: any = { visible: {}, disabled: {}, required: {} };
evaluateStates(instances, withDraftValues, { ...withDraftValues, ...draftObject(withDraftValues) }, dialogStates);
check('dialog rules read the dialog answers', dialogStates.visible['d2~draft'] === true && (evaluateStates(instances, {}, { state: 'ok' }, (dialogStates.visible = {}, dialogStates)), dialogStates.visible['d2~draft'] === false));
const docTabs: any = { version: 2, fields: [tabs], settings: {}, i18n: { defaultLanguage: 'en', languages: ['en', 'da'], translations: { da: { 'field.tb.tab.t1': 'Enheder' } } } };
check('tab labels are translatable', collectTranslatables(docTabs).some(t => t.key === 'field.tb.tab.t1') && (localizeDocument(docTabs, 'da').fields[0] as any).tabs[0].label === 'Enheder');

// ---------------------------------------------------------------- branding: page background + footer
const PNG = 'data:image/png;base64,AAAA';
check('page mode defaults to colour', pageMode({}) === 'color' && pageMode({ pageImage: undefined }) === 'color');
check('page mode defaults to image when one is set', pageMode({ pageImage: PNG }) === 'image' && pageMode({ pageImage: 'javascript:alert(1)' }) === 'color');
check('explicit page mode wins, image mode without image falls back to colour', pageMode({ pageMode: 'gradient', pageImage: PNG }) === 'gradient' && pageMode({ pageMode: 'image' }) === 'color' && pageMode({ pageMode: 'color', pageImage: PNG }) === 'color');
check('gradient stops: defaults, old from/to, even spacing', pageGradientStops({}).length === 2 && pageGradientStops({ pageGradientFrom: '#111111', pageGradientTo: '#222222' }).map(x => x.color).join() === '#111111,#222222' && pageGradientStops({ pageGradientStops: [{ color: '#a' }, { color: '#b' }, { color: '#c' }] }).map(x => x.pos).join() === '0,50,100');
check('gradient stops: explicit positions are clamped, a single stop is ignored', pageGradientStops({ pageGradientStops: [{ color: '#a', pos: -5 }, { color: '#b', pos: 140 }] }).map(x => x.pos).join() === '0,100' && pageGradientStops({ pageGradientStops: [{ color: '#a' }] }).length === 2);
check('linear gradient css', pageGradientCss({ pageGradientStops: [{ color: '#0ea5e9', pos: 0 }, { color: '#1e1b4b', pos: 100 }], pageGradientAngle: 150 }) === 'linear-gradient(150deg, #0ea5e9 0%, #1e1b4b 100%)');
check('radial gradient css ignores the angle', pageGradientCss({ pageGradientType: 'radial', pageGradientStops: [{ color: '#a' }, { color: '#b' }] }).startsWith('radial-gradient(circle at 50% 0%, #a 0%, #b 100%)'));
const gradientStyle = pageStyle({ pageMode: 'gradient', pageGradientStops: [{ color: '#0ea5e9' }, { color: '#1e1b4b' }] });
check('gradient page style', gradientStyle['background-image'].startsWith('linear-gradient(160deg') && gradientStyle['background-color'] === '#0ea5e9' && gradientStyle['background-attachment'] === 'fixed');
const imageStyle = pageStyle({ pageImage: PNG, pageOverlay: 40, pageImageFit: 'tile' });
check('image page style: overlay, tile', imageStyle['background-image'].includes('rgba(0,0,0,0.4)') && imageStyle['background-image'].includes(PNG) && imageStyle['background-repeat'] === 'repeat' && imageStyle['background-size'] === 'auto');
check('image page style: overlay is capped at 80%', pageStyle({ pageImage: PNG, pageOverlay: 999 })['background-image'].includes('rgba(0,0,0,0.8)'));
check('colour page style has only the colour', Object.keys(pageStyle({ pageBackground: '#ffffff' })).join() === 'background-color' && pageStyle({ pageBackground: '#ffffff' })['background-color'] === '#ffffff');
check('page style text is a style attribute string', pageStyleText({ pageBackground: '#ffffff' }) === 'background-color: #ffffff');
check('unsafe page images are ignored', !('background-image' in pageStyle({ pageImage: 'javascript:alert(1)' })) && safeImageUrl('data:text/html;base64,AAAA') === null && safeImageUrl('https://x.test/a.png') === 'https://x.test/a.png');
check('quotes in an image url cannot break out of url("")', !String(pageStyle({ pageImage: 'https://x.test/a".png' })['background-image']).includes('a".png'));
check('heading font becomes a css variable, default follows the body font', themeToCssVars({ headingFont: 'Playfair Display' })['--rfg-heading-font'].includes('Playfair Display') && themeToCssVars({})['--rfg-heading-font'] === 'var(--rfg-font)' && themeToCssVars({ headingFont: 'inherit' })['--rfg-heading-font'] === 'var(--rfg-font)');
check('presets still resolve with the new keys', resolveTheme({ preset: 'midnight' }).primaryColor === '#8b5cf6' && resolveTheme('{"headerAlign":"center"}').headerAlign === 'center');

const footerDoc: any = {
  version: 2,
  fields: [],
  footer: { style: 'card', text: 'Acme ApS', links: [{ label: 'Privacy', url: 'https://x.test/p' }, { label: 'Terms', url: 'https://x.test/t' }], copyright: '© {year} Acme' },
  i18n: { defaultLanguage: 'en', languages: ['en', 'da'], translations: { da: { 'footer.text': 'Acme ApS (dansk)', 'footer.link.1': 'Vilkår', 'footer.copyright': '© {year} Acme A/S' } } },
};
const footerKeys = collectTranslatables(footerDoc).filter(t => t.group === 'Footer').map(t => t.key).join();
check('footer texts are translatable', footerKeys === 'footer.text,footer.link.0,footer.link.1,footer.copyright', footerKeys);
const localizedFooter = localizeDocument(footerDoc, 'da').footer as any;
check('footer is localized, untranslated parts keep the source', localizedFooter.text === 'Acme ApS (dansk)' && localizedFooter.links[0].label === 'Privacy' && localizedFooter.links[1].label === 'Vilkår' && localizedFooter.copyright.includes('A/S') && localizedFooter.style === 'card' && localizedFooter.links[1].url === 'https://x.test/t');
check('documents without a footer stay without one', !('footer' in localizeDocument({ version: 2, fields: [], i18n: footerDoc.i18n } as any, 'da')));


// ---------------------------------------------------------------- preset text + dialog titles are translatable
const presetRepeater: FormField = {
  type: 'repeater',
  id: 'pr',
  model: 'rooms',
  config: { addTitle: 'Add room', backLabel: 'Back to the rooms', presetTextKeys: ['name', 'unit'], presets: [{ label: 'Kitchen', values: { name: 'Kitchen', units: [{ unit: 'Ceiling', condition: 'Good' }, { unit: 'Stove', condition: 'Good' }] } }] },
  fields: [input('pn', 'name')],
};
const presetDoc: any = { version: 2, fields: [presetRepeater], i18n: { defaultLanguage: 'en', languages: ['en', 'da'], translations: { da: { 'field.pr.config.addTitle': 'Tilføj rum', 'field.pr.config.backLabel': 'Tilbage til rummene', 'field.pr.preset.0.value.name': 'Køkken', 'field.pr.preset.0.value.units.0.unit': 'Loft', 'field.pr.preset.0.value.units.1.unit': 'Komfur' } } } };
const presetKeys = collectTranslatables(presetDoc).map(t => t.key);
check('dialog title and back link are translatable', presetKeys.includes('field.pr.config.addTitle') && presetKeys.includes('field.pr.config.backLabel'));
check('only the listed preset keys are translatable', presetKeys.includes('field.pr.preset.0.value.name') && presetKeys.includes('field.pr.preset.0.value.units.1.unit') && !presetKeys.some(k => k.includes('condition')), presetKeys);
const daPreset: any = (localizeDocument(presetDoc, 'da').fields[0] as any).config;
check('preset text is localized, stored values (conditions) are not', daPreset.presets[0].values.name === 'Køkken' && daPreset.presets[0].values.units[0].unit === 'Loft' && daPreset.presets[0].values.units[1].condition === 'Good' && daPreset.addTitle === 'Tilføj rum' && daPreset.backLabel === 'Tilbage til rummene');
check('without presetTextKeys preset values stay as they are', collectTranslatables({ version: 2, fields: [{ ...presetRepeater, config: { presets: presetRepeater.config!.presets } }] } as any).every(t => !t.key.includes('.value.')));


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
