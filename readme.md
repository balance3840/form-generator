# Form generator v2

A web component that renders themeable, validated forms from a JSON schema.

```html
<script type="module" src="https://unpkg.com/@restrella/form-generator@2/dist/form-generator/form-generator.esm.js"></script>

<re-form-generator id="form"></re-form-generator>
<script>
  const form = document.getElementById('form');
  form.schema = {
    version: 2,
    title: 'Contact us',
    fields: [
      { type: 'input', id: 'name', model: 'name', inputType: 'text', label: 'Name', validationType: 'string', validations: [{ name: 'required' }], layout: { cols: 6 } },
      { type: 'input', id: 'email', model: 'email', inputType: 'email', label: 'Email', validationType: 'string', validations: [{ name: 'required' }, { name: 'email' }], layout: { cols: 6 } },
      { type: 'textarea', id: 'msg', model: 'message', label: 'Message', validationType: 'string' },
    ],
  };
  form.addEventListener('submitted', e => console.log(e.detail.values));
</script>
```

You rarely need to write this JSON by hand: the **[form-builder](../form-builder)** app is a visual editor that produces it.

## What changed in v2

v2 is a breaking release. In short:

| v1 | v2 |
| --- | --- |
| Bare array of fields, plus separate `action` / `mapping` props | One **document**: `{ version: 2, title, description, fields, theme, settings, action }` (the props still work and override the document) |
| `layout.row` / `layout.group` / `groupTitle` | Rows of columns (`type: "columns"`), each column a stack of fields; section titles are `heading` fields |
| Choices as `values` (select), `items` (radio/checkbox) | One shape for every choice field: `options: [{ label, value, group? }]` |
| Pre-checked via `items[].attributes.checked`, multi-select `defaultOptions` (indexes) | `defaultValue` |
| Fields without `visible: true` were hidden | Fields are visible unless `visible: false` |
| Hard-coded colours | Themes (CSS variables), presets, fonts, input styles |
| Success = dismissible alert | Success screen (`settings.successMessage`) |
| – | New: conditional logic, multi-step forms, rating, opinion scale, slider, colour, heading / paragraph / divider blocks |

### Migrating a v1 schema

The generator accepts v1 schemas and **migrates them on the fly**, so old pages keep rendering. To convert for good:

```bash
npm run migrate -- old-schema.json -o new-form.json
# also fold in the old props, and show the fields v1 would have hidden:
npm run migrate -- old-schema.json --action action.json --mapping mapping.json --show-hidden -o new-form.json
```

Every change is reported on stderr. In code: `import { migrateV1 } from '@restrella/form-generator'` returns `{ doc, notes }`. The form builder also has an **Import / migrate** tab that does the same with a report.

## Document reference

```jsonc
{
  "version": 2,
  "title": "Event feedback",
  "description": "Optional text under the title",
  "theme":    { "preset": "indigo", "primaryColor": "#4f46e5" },
  "settings": { "submitButtonText": "Send", "successMessage": "Thanks!" },
  "action":   { "endpoint": "https://api.example.com/forms" },
  "i18n":     { "defaultLanguage": "en", "languages": ["en", "es"], "translations": { "es": { "title": "Opiniones del evento" } } },
  "fields":   [ /* see below */ ]
}
```

### Fields

Inputs accept `config.prefix` / `config.suffix` (fixed text next to the box, e.g. `"m²"`). Button and message texts can use `{count:model}` (number of items picked in a field) and `{value:model}` (its answer). Text inputs also accept `attributes.autocomplete` (e.g. `given-name`, `email`) for browser autofill, `attributes.rows` on `textarea` and `attributes.step` on `number`. Common properties: `type`, `id`, `model` (the key in the submitted data), `label`, `helpText`, `placeholder`, `defaultValue`, `visible`, `disabled`, `readonly`, `validationType`, `validations`, `logic`.

| `type` | Notes |
| --- | --- |
| `input` | `inputType`: `text email number tel url password date time datetime-local month week color checkbox` (`checkbox` uses `checkboxLabel`) |
| `textarea` | |
| `select`, `multiSelect`, `radioGroup`, `checkboxGroup` | `options: [{ label, value, group? }]` (`group` lists options together in a dropdown). For radio / checkbox groups: `config.optionColumns` (1-4) and `config.allowOther` + `config.otherLabel` add an "Other…" option with a text box (the typed text is the answer). `config.optionStyle: "cards"` shows each choice as a card with a title and an optional option `description`, `"chips"` as small pills you switch on and off (a checkbox group as chips is a multi-pick); `config.optionsFrom: { field, labelKey }` takes the choices from the items of a repeating group (e.g. the units of this room); on a radio group `config.autoAdvance` goes to the next step as soon as an answer is picked |
| `toggle` | on/off switch (`validationType: "boolean"`) |
| `address` | address search with short labels ("Street 5, 2200 City"). `config.provider`: `osm` (OpenStreetMap, worldwide, free, no key, light use), `google` (Places API New), `mapbox`, `geoapify`, `dk` (Danish official register, Dataforsyningen) or `custom` (your own `source`, as in `search`). Keyed providers take `config.apiKey` (it is visible in the page: restrict it to your domain). `config.countries` (ISO codes, e.g. `["dk"]`) and `config.city` narrow the search, `config.multiple` allows several picks (use `validationType: "array"`), `config.answer` is what is saved: `text` (default), `id` or `both` (`{ id, label }`). Floors and doors are only available from providers that have them (e.g. `dk`) |
| `search` | live search against your own endpoint, with removable chips when `config.multiple`. `config.source`: `{ url: "https://…?q={q}", resultsPath, labelKey, labelTemplate, valueKey, minChars, debounce, headers }`. The answer is the `valueKey` of the pick (a list when `multiple`, so use `validationType: "array"`). The endpoint must return JSON and allow requests from your site (CORS). **Step by step search** (street → number → floor/door): add `source.drill: { typeKey: "type", expandTypes: ["vejnavn", "adgangsadresse"] }`. Results of those types open the next level when picked (the box is filled with their text and searched again; a result that equals the box text is the answer), other types are final. `source.extraKey` shows a small note next to a result, `source.labelTemplate` builds a short label from several fields |
| `countrySelect` | `showDialCode`, `modelValueKey` (`code` by default, or `name` / `dialCode`), `defaultValue` |
| `file` | `attributes: { accept, multiple }`. `config.preview` shows thumbnails of chosen images, `config.compact` replaces the big drop area with a small "add" button (good for photos), `config.fileStyle: "block"` makes that button a full-width dashed bar |
| `rating` | `config: { max }` |
| `scale` | `config: { min, max, minLabel, maxLabel }` |
| `slider` | `config: { min, max, step, unit }` |
| `heading`, `paragraph`, `divider` | content blocks (`label` / `helpText`, `content`, `config.level`) |
| `columns` | a **row** of columns, see [Layout](#layout-rows-and-columns) |
| `pageBreak` | splits the form into steps. Its `label` is the title of the step that starts after it, `helpText` its description (the first step's are `settings.firstStepTitle` / `firstStepDescription`). It can have `logic` to skip the whole step |
| `section` | a titled card around other fields (`fields`). `config`: `style` (`card` or `plain`), `collapsible`, `startCollapsed`. See [App-like flows](#app-like-flows) |
| `repeater` | a group people can add several of (tenants, rooms, meters…). The answer is a list of objects. See [App-like flows](#app-like-flows) |
| `tabs` | switch between groups of fields: `tabs: [{ id, label, fields }]`, `config.style` (`line` or `pills`). The tab with an error opens by itself |
| `modal` | a dialog (pop-up form) that a button opens with the `openModal` action: `label` (title), `fields`, `config.confirmLabel` / `cancelLabel` / `confirmActions`. See [Dialogs](#dialogs) |
| `button` | a button that runs `config.actions`, see [Buttons and actions](#buttons-and-actions) |
| `callout` | a message box: `label` (title), `content`, `config.tone` (`info success warning danger`). Combine with `logic` to show it only when it applies |
| `signature` | a box to sign in (finger, pen, mouse). The answer is a PNG data URL. `config.height`, `config.hint`. `config.mode: "dialog"` shows a grey box with a button (`signLabel`) that opens the signing pad in a dialog and then shows the signature |

### Layout: rows and columns

Fields are stacked top to bottom. To put fields side by side, wrap them in a `columns` row. Every column has a `span` (out of 12) and holds its **own stack of fields**, so you can have three short fields on the left next to one tall field on the right:

```json
{
  "type": "columns",
  "id": "row1",
  "config": { "align": "start", "justify": "start" },
  "columns": [
    { "id": "left",  "span": 8, "fields": [ { "type": "input", "id": "name", "model": "name", "label": "Name" }, { "type": "input", "id": "email", "model": "email", "label": "Email" } ] },
    { "id": "right", "span": 4, "fields": [ { "type": "textarea", "id": "bio", "model": "bio", "label": "About you" } ] }
  ]
}
```

- `config.align`: vertical alignment of the columns, `start` `center` `end` or `stretch`.
- `config.justify`: where a row whose spans add up to less than 12 sits, `start` `center` or `end` (e.g. a single centered `span: 6` column).
- Rows can't be nested. A row can have `logic` to show or hide all of it, and columns stack on narrow screens.
- The old per-field width (`layout.cols`) is still understood: adjacent partial-width fields are grouped into rows automatically when the schema loads.

### Validation

`validationType` is a Yup type (`string number boolean date array object`); `validations` is a list of `{ name, params }` where `name` is a Yup method. The message is the last parameter, and a friendly default is used when omitted:

```json
{ "name": "required", "params": ["Please tell us your name"] }
{ "name": "min", "params": [3, "At least 3 characters"] }
{ "name": "matches", "params": ["^[0-9]{5}$", "Five digits please"] }
```

On a `boolean` field, `required` means "must be ticked". A rule whose value is empty is ignored.

Available rules by `validationType` (the builder offers exactly these):

| Type | Rules |
| --- | --- |
| `string` | `required` `min` / `max` / `length` (characters) `email` `url` `uuid` `matches` (regex string) `lowercase` `uppercase` `oneOf` / `notOneOf` (list of values) `sameAs` / `notSameAs` (another field) |
| `number` | `required` `min` `max` `moreThan` `lessThan` `integer` `positive` `negative` `oneOf` / `notOneOf` `sameAs` / `notSameAs` `minField` / `maxField` (another field) |
| `date` | `required` `min` `max` (earliest / latest date) `minField` / `maxField` (not before / not after another field) |
| `array` | `required` `min` `max` `length` (number of choices) |
| `boolean` | `required` (must be ticked) |
| `file` (used automatically for `type: "file"`) | `required` `maxFileSize` (MB per file) `fileTypes` (`[".pdf", "image/*"]`) `minFiles` `maxFiles` |

Rules that compare with another field take that field's `model` as their value, e.g. `{ "name": "sameAs", "params": ["email", "The emails do not match"] }` or `{ "name": "minField", "params": ["startDate", "End must be after the start"] }`. If the referenced field no longer exists the rule is ignored. A file field's `attributes.accept` is enforced on submit too, not just used as a hint for the file picker.

### Conditional logic


```json
"logic": { "action": "show", "match": "all", "conditions": [{ "field": "attended", "operator": "equals", "value": "yes" }] }
```

`action` is one of `show`, `hide`, `disable` (can't be edited while the rule matches), `enable` (can **only** be edited while it matches) and `require` (becomes required while it matches). Give `logic` a **list** of rules to combine several (every show/hide rule has to allow it). Operators: `equals not_equals contains not_contains gt lt empty not_empty`. `field` is another field's `model`. For lists (checkbox groups, repeaters) `gt` / `lt` compare the number of entries, so `{ "field": "tenants", "operator": "lt", "value": 1 }` means "no tenant added". Hidden fields are not validated and not submitted; fields switched off by a rule are not validated.

### App-like flows

Everything below is plain JSON, so a form can behave like a small application.

**Steps.** A `pageBreak` starts a new step. `settings.stepsLayout: "sidebar"` shows a list of the steps next to the form (a strip on small screens), with a tick on the steps that are filled in; the default is a progress bar. `settings.stepNavigation`: `visited` (default: steps already visited), `free` (any step) or `locked` (only back). `settings.nextButtonText` can use `{next}` (title of the next step): `"{next} →"`. `settings.saveDraft: true` keeps the answers in this browser (`draftKey` names the slot; files are not kept) and shows a "Save and exit" button (`exitText`, `exitUrl`); the draft is removed after a successful submit.

**Sections.** `{ "type": "section", "label": "Dates", "fields": [ … ] }` groups fields in a card. Rows can sit inside sections. `config.badge` puts a round number ("1") next to the title, `config.tooltip` adds a "?" icon with a help text, and a section with a `disable` rule is greyed out and unusable (a numbered checklist that unlocks step by step). A section without fields is just a card with a title.

**Tabs.** `{ "type": "tabs", "tabs": [ { "id": "a", "label": "Units", "fields": [ … ] }, … ] }`. Answers of all tabs are part of the same form; rules can use fields of other tabs.

**Repeating groups.** The answer is a list of objects, one per item:

```json
{
  "type": "repeater", "id": "tenants", "model": "tenants",
  "config": { "itemLabel": "Tenant #{n}", "addLabel": "Add tenant", "minItems": 1, "maxItems": 4, "collapsible": true },
  "fields": [
    { "type": "input", "id": "t_name", "model": "name", "label": "Name", "validations": [{ "name": "required", "params": [] }] },
    { "type": "input", "id": "t_email", "model": "email", "inputType": "email", "label": "Email" }
  ]
}
```

→ `{ "tenants": [ { "name": "Anna", "email": "…" }, … ] }`. Config: `layout` (`cards` or `table`), `itemLabel` (`{n}` and `{key}` of an answer in the item), `addLabel`, `addStyle` (`button` or `dashed`), `emptyText`, `minItems` / `maxItems`, `allowAdd` / `allowRemove`, `collapsible` / `startCollapsed`, `presets`. A repeater can contain another repeater (the checklist of a room).

- **Logic inside an item** uses the other fields of the same item by their key (`"condition"`), and still reaches normal fields. Errors are keyed by path (`tenants[0].email`).
- **`layout: "table"`**: the first child must be a `columns` row; its columns become the table columns (the headers are their labels). Anything after that row appears under the row, only while it has something to show (e.g. defect details of a unit that is "Damaged").
- **`presets`**: `[{ "label": "Kitchen", "description": "…", "values": { "name": "Kitchen", "units": [ { "unit": "Stove" } ] } }]`. The add button then opens these choices and the new item starts with the `values` (nested lists included).

**Small cards, dialogs and pages for items.** Besides `cards` (the fields inline) and `table`, a repeater can show its items as small cards (`layout: "grid"`, `columns`, or any layout with `itemOpen` other than `inline`). A card has a title (`itemLabel`), a summary line (`itemMeta`; `{count:defects|No defects|1 defect|# defects}` picks a text by the number of items in a nested group, `{key}` of an array lists its entries), an optional **Done** button (`doneField`: a yes/no answer of the item) and a ⋮ menu. Config:

| | |
| --- | --- |
| `itemOpen` | `inline` (default for cards), `modal` (clicking a card edits it in a dialog) or `page` (the item replaces the list, with a Back link, `backLabel`; its fields can use tabs and buttons) |
| `addMode` | `inline` (a blank item is added) or `modal` (a dialog with the item's fields asks first: `addTitle`, `editTitle`, `confirmLabel`, `cancelLabel`) |
| `itemMenu` | the ⋮ menu: any of `edit duplicate up down remove` (default for small cards: all) |
| `sortable` | drag small cards to reorder them (default on) |

Fields of an item can be `config.dialogOnly` (only in the item's dialog, e.g. the type of a meter) or `config.hideInDialog` (left out of it, e.g. a "+" button in a table row).

### Dialogs

A `modal` block is a form in a pop-up. It is placed anywhere (typically inside the item or step whose answers it needs) and opened by a button with `{ "type": "openModal", "modal": "<block id>", "values": { … } }`. What people type stays in the dialog (it is not part of the answers) until they confirm; then the block's `config.confirmActions` run, and they can use it as `{draft:key}`:

```json
{ "type": "modal", "id": "stateDialog", "label": "Set the condition of everything",
  "fields": [ { "type": "radioGroup", "id": "s", "model": "state", "label": "Condition", "options": [ … ], "validations": [{ "name": "required" }] } ],
  "config": { "confirmLabel": "Set condition", "confirmActions": [ { "type": "setAll", "field": "units", "key": "condition", "value": "{draft:state}" } ] } }
```

Fields inside a dialog are validated when it is confirmed. Names used by buttons, actions and `optionsFrom` are looked up from the item the block sits in outward, so "units" inside a room means that room's units.

**Buttons and actions.** `{ "type": "button", "label": "Review report", "config": { "variant": "outline", "actions": [ { "type": "emit", "name": "review" } ] } }`. `variant`: `primary secondary outline ghost danger`; `size: "large"`; `align`: `start center end stretch`; `icon`: `arrow-right arrow-left plus check download`. Give a button `logic` to show it or to `disable` it while something is missing. Actions run in order and stop at the first one that cannot continue:

| Action | |
| --- | --- |
| `next` / `back` | move between steps (`next` checks the current step first) |
| `goto` | `{ "type": "goto", "step": "<page break id>" or "start", "validate": true }` |
| `set` | `{ "type": "set", "field": "model", "value": "x" }` (inside an item: a field of the same item first) |
| `add` | `{ "type": "add", "field": "tenants", "values": { … } }` adds an item (through its dialog when the group has `addMode: "modal"`). In `values`, `{key}` is an answer of the item the button is in: a "+" in a unit row can open the defect dialog with `{ "units": ["{unit}"] }` |
| `setAll` | `{ "type": "setAll", "field": "units", "key": "condition", "value": "Good" }` sets one answer on every item of a group |
| `openModal` | `{ "type": "openModal", "modal": "<block id>", "values": { … } }` opens a [dialog](#dialogs) |
| `submit` / `reset` | send / start over. A page with its own `submit` button hides the built-in submit button |
| `link` | `{ "type": "link", "url": "https://…", "newTab": true }` (http, https, mailto, tel or relative) |
| `emit` | fires the `formAction` event `{ name, field, values }` so your own code can react |
| `saveDraft` / `exit` | save progress / save and fire `exit` (then open `settings.exitUrl`) |

### Room-list style flows (type picker, global vs. per-item tools)

- **Add dialog with a type picker**: `presets` on a repeater with `addMode: 'modal'` shows the presets first; `uniqueKey` keeps names unique ("Kitchen 2"), `dialogContent: 'marked'` limits the dialog to fields marked `dialogOnly`.
- **Global vs. per-item actions**: the same button works at two levels. `setAll` takes a nested path (`field: 'rooms.units'`) to change every item of every row; inside an item the plain path only touches that item. A step-level list (e.g. `allDefects`) can use `optionsFrom: { field: 'rooms.units', labelKey, groupKey }` with `searchable` to pick items from all rows, grouped.
- **Item pages**: an open item shows everything inside it, tabs and sections included; the rest of the step steps aside. `closeItem` returns to the list (e.g. a "Mark as done" button: `set done` then `closeItem`).

### Theme

`theme` takes a `preset` (`indigo minimal soft ocean forest sunset midnight mono`) and/or overrides: `logo logoHeight logoAlign cover coverHeight` (images: `https://…`, a relative path or a `data:image/…` URL; anything else is ignored) `primaryColor backgroundColor textColor pageBackground fontFamily borderRadius inputStyle (outlined|filled|underlined) spacing (compact|comfortable|spacious) cardStyle (shadow|bordered|flat) maxWidth buttonStyle (solid|outline) buttonWidth (full|auto) buttonAlign (left|center|right) labelStyle (normal|uppercase) customCss`. Everything is exposed as `--rfg-*` CSS variables you can also override from your own CSS.

### Languages (i18n)

Write the form once in its default language, then add translations. Anything not translated falls back to the default language.

```json
"i18n": {
  "defaultLanguage": "en",
  "languages": ["en", "es", "fr"],
  "detect": true,
  "switcher": "flags",
  "translations": {
    "es": {
      "title": "Contáctanos",
      "settings.submitButtonText": "Enviar",
      "field.name.label": "Tu nombre",
      "field.plan.option.free": "Gratis",
      "ui.submit": "Mandar"
    }
  }
}
```

- **Which language is shown:** the `language` prop if set (it also hides the switcher); else the visitor's choice in the switcher; else the browser language (`navigator.languages`, `detect` is on by default) when it matches one of `languages` (`pt-BR` matches `pt`); else `defaultLanguage`.
- **Switcher:** `"none"` (default), `"flags"` or `"dropdown"`: a language selector at the top of the form. Flags are emoji, so on Windows they show as letters.
- **Keys:** `title`, `description`, `settings.<name>`, and `field.<field id>.<label|helpText|placeholder|content|checkboxLabel|config.minLabel|config.maxLabel|config.unit>`, `field.<id>.option.<option value>`, `field.<id>.validation.<rule name>` (a custom error message). The builder's **Translate** tab lists them all.
- **Built-in texts** (buttons, step counter, upload text, default error messages, country names) are translated for `en es fr de it pt nl pl ca da` and can be overridden per language with `ui.*` / `validation.*` keys (see `BUILT_IN_UI` in `src/utils/i18n.ts`). Other languages use English for these unless you provide them. This works for the default language too, so a single-language form can reword them: `"translations": { "en": { "ui.step": "Stage {current} of {total}" } }`. Country names use the browser's `Intl.DisplayNames`.
- `ar`, `he` and `fa` set `dir="rtl"` on the form.

```html
<re-form-generator language="es"></re-form-generator>   <!-- force a language -->
<script>
  form.addEventListener('languageChanged', e => console.log(e.detail.language));
  form.setLanguage('fr');                                 // switch from your own UI
</script>
```

### Spam protection

`settings.captcha`: `{ "provider": "turnstile", "siteKey": "…", "theme": "auto" }`.

| `provider` | |
| --- | --- |
| `honeypot` | a hidden trap field, no account or key. A submission that fills it is silently dropped. Stops simple bots only |
| `turnstile` | Cloudflare Turnstile (answers get `cf-turnstile-response`) |
| `hcaptcha` | hCaptcha (`h-captcha-response`) |
| `recaptcha` | Google reCAPTCHA v2 checkbox (`g-recaptcha-response`) |
| `recaptcha3` | Google reCAPTCHA v3, invisible (`g-recaptcha-response`) |

The token travels with the answers, **and your server must verify it** with the provider's *secret* key (see the builder's "Show how to check it"). The old `action.recaptchaSiteKey` still works as reCAPTCHA v2. Each provider publishes test site keys that always pass, handy while building.

### Keys and secrets in a front-end form

Everything in a web page is readable by visitors, so treat anything you put in a form as public:

- **Fine to include:** captcha *site* keys, Mapbox public (`pk.`) tokens, and Google / Geoapify browser keys **that you restricted** to your domain and to one API, with a spending limit or quota alert set.
- **Never include:** captcha *secret* keys, Mapbox `sk.` tokens, unrestricted keys, and `action.bearerToken` values that are not meant to be public (the token is sent from the visitor's browser).
- **For a key you cannot restrict**, put a small proxy in between: the form calls your address, the proxy adds the key and forwards the request. The builder generates a ready-to-paste Cloudflare Worker for the address providers ("Keep the key off the page") and switches the field to it.
- Submit the form to **your own server** (`action.endpoint`) and verify captcha tokens there.

### Settings & action

`settings`: `autofill` (`false` stops the browser from suggesting saved addresses and the like; a single field can do the same with `attributes.autocomplete: "off"`) `submitButtonText successMessage errorMessage formErrorMessage showTitle showProgress hideSubmitButton allowResubmit redirectUrl`, and for steps `stepsLayout stepNavigation firstStepTitle firstStepDescription nextButtonText saveDraft draftKey exitText exitUrl` (see [App-like flows](#app-like-flows)).

`action` (optional): `endpoint httpMethod bearerToken headers formData webhookEndpoint recaptchaSiteKey mapping`. Without an endpoint the form just emits `submitted`.

## Component API

| Prop | |
| --- | --- |
| `schema` | document (object or JSON string) or a v1 array |
| `model` | initial values keyed by `model` |
| `action`, `mapping` | override `schema.action` / `action.mapping` |
| `theme` | object, preset id, or JSON string; overrides `schema.theme` |
| `language` | forces a language (e.g. `es`, `pt-BR`); see [Languages](#languages-i18n) |
| `designMode` | used by the builder: shows every field, no logic, inert |

Events: `submitted` (`{ values, response, error }`), `valueChanged`, `validationError`, `handleSubmit`, `languageChanged` (`{ language }`), `formAction` (`{ name, field, values }`, from a button's `emit` action), `stepChanged` (`{ index, id, title }`), `draftSaved`, `exit`.
Methods: `submit()`, `validate()`, `reset()`, `getValues()`, `updateValue(key, value)` (keys inside a repeater are paths like `tenants[0].email`), `goToStep(id, validate?)`, `setLanguage(code)`, `getLanguage()`.
Slots: `field-label@<field id>` renders custom content under a field's label.

## Development

```bash
npm install
npm start          # dev server with the demo page (src/index.html)
npm run build      # build the package
npm test
npm run check:flow   # logic checks for repeaters, rules, defaults and translations (no browser needed)
```
