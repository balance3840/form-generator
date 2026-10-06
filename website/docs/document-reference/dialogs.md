---
title: "Dialogs"
sidebar_position: 10
---

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
| `add` | `{ "type": "add", "field": "guests", "values": { … } }` adds an item (through its dialog when the group has `addMode: "modal"`). In `values`, `{key}` is an answer of the item the button is in: a "+" in a unit row can open the defect dialog with `{ "units": ["{unit}"] }` |
| `setAll` | `{ "type": "setAll", "field": "units", "key": "condition", "value": "Good" }` sets one answer on every item of a group |
| `openModal` | `{ "type": "openModal", "modal": "<block id>", "values": { … } }` opens a [dialog](/document-reference/dialogs) |
| `submit` / `reset` | send / start over. A page with its own `submit` button hides the built-in submit button |
| `link` | `{ "type": "link", "url": "https://…", "newTab": true }` (http, https, mailto, tel or relative) |
| `emit` | fires the `formAction` event `{ name, field, values }` so your own code can react |
| `saveDraft` / `exit` | save progress / save and fire `exit` (then open `settings.exitUrl`) |
