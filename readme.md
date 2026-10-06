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
| `select`, `multiSelect`, `radioGroup`, `checkboxGroup` | `options: [{ label, value, group? }]` (`group` lists options together in a dropdown). For radio / checkbox groups: `config.optionColumns` (1-4) and `config.allowOther` + `config.otherLabel` add an "Other…" option with a text box (the typed text is the answer) |
| `toggle` | on/off switch (`validationType: "boolean"`) |
| `address` | address search with short labels ("Street 5, 2200 City"). `config.provider`: `osm` (OpenStreetMap, worldwide, free, no key, light use), `google` (Places API New), `mapbox`, `geoapify`, `dk` (Danish official register, Dataforsyningen) or `custom` (your own `source`, as in `search`). Keyed providers take `config.apiKey` (it is visible in the page: restrict it to your domain). `config.countries` (ISO codes, e.g. `["dk"]`) and `config.city` narrow the search, `config.multiple` allows several picks (use `validationType: "array"`), `config.answer` is what is saved: `text` (default), `id` or `both` (`{ id, label }`). Floors and doors are only available from providers that have them (e.g. `dk`) |
| `search` | live search against your own endpoint, with removable chips when `config.multiple`. `config.source`: `{ url: "https://…?q={q}", resultsPath, labelKey, labelTemplate, valueKey, minChars, debounce, headers }`. The answer is the `valueKey` of the pick (a list when `multiple`, so use `validationType: "array"`). The endpoint must return JSON and allow requests from your site (CORS). **Step by step search** (street → number → floor/door): add `source.drill: { typeKey: "type", expandTypes: ["vejnavn", "adgangsadresse"] }`. Results of those types open the next level when picked (the box is filled with their text and searched again; a result that equals the box text is the answer), other types are final. `source.extraKey` shows a small note next to a result, `source.labelTemplate` builds a short label from several fields |
| `countrySelect` | `showDialCode`, `modelValueKey` (`code` by default, or `name` / `dialCode`), `defaultValue` |
| `file` | `attributes: { accept, multiple }` |
| `rating` | `config: { max }` |
| `scale` | `config: { min, max, minLabel, maxLabel }` |
| `slider` | `config: { min, max, step, unit }` |
| `heading`, `paragraph`, `divider` | content blocks (`label` / `helpText`, `content`, `config.level`) |
| `columns` | a **row** of columns, see [Layout](#layout-rows-and-columns) |
| `pageBreak` | splits the form into steps with a progress bar. Its `label` is the title of the step that starts after it (the first step's title is `settings.firstStepTitle`) |

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

Operators: `equals not_equals contains not_contains gt lt empty not_empty`. `field` is another field's `model`. Hidden fields are not validated and not submitted.

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

`settings`: `autofill` (`false` stops the browser from suggesting saved addresses and the like; a single field can do the same with `attributes.autocomplete: "off"`) `submitButtonText successMessage errorMessage formErrorMessage showTitle showProgress hideSubmitButton allowResubmit redirectUrl`.

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

Events: `submitted` (`{ values, response, error }`), `valueChanged`, `validationError`, `handleSubmit`, `languageChanged` (`{ language }`).
Methods: `submit()`, `validate()`, `reset()`, `getValues()`, `updateValue(key, value)`, `setLanguage(code)`, `getLanguage()`.
Slots: `field-label@<field id>` renders custom content under a field's label.

## Development

```bash
npm install
npm start          # dev server with the demo page (src/index.html)
npm run build      # build the package
npm test
```
