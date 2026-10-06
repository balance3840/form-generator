---
title: "App-like flows"
sidebar_position: 9
---

Everything below is plain JSON, so a form can behave like a small application.

**Steps.** A `pageBreak` starts a new step. `settings.stepsLayout: "sidebar"` shows a list of the steps next to the form (a strip on small screens), with a tick on the steps that are filled in; the default is a progress bar. Above the form, `settings.progressStyle` picks `bar` (default), `percent`, `steps` (numbered dots), `titles` (numbered dots with the step titles) or `none`; `showStepCount: false` hides “Step 2 of 4”, `progressPosition: "bottom"` puts it above the buttons, `stepHeader: false` hides the step's title and description on its page, `stepTransition` is `fade` or `slide` (off when the visitor asks for less motion), `backButtonText` renames Back, and `theme.buttonAlign: "split"` puts Back on the left and Next on the right. A page break's `config` sets its own step: `image` (+ `alt`) at the top, `nextLabel` for its Next button, `hideBack: true`. The first step uses `settings.firstStepImage` / `firstStepImageAlt`. Every one of these texts is translatable. `settings.stepNavigation`: `visited` (default, in order: Next and the step list check each step before moving on, and a step gets its tick only when its answers are valid), `free` (any order: every step can be opened, everything is checked on send) or `locked` (the step list only goes back). `settings.nextButtonText` can use `{next}` (title of the next step): `"{next} →"`. `settings.saveDraft: true` keeps the answers in this browser (`draftKey` names the slot; files are not kept) and shows a "Save and exit" button (`exitText`, `exitUrl`); the draft is removed after a successful submit.

**The step list (sidebar).** With `stepsLayout: "sidebar"` the list is on the left; `stepsSide: "right"` moves it to the right (on small screens it is always above the form). These settings add more to the list:

- `stepProgress: true`: each step shows a ring that fills up as its required questions are answered (only questions that are shown count; a repeater counts as answered when it has its `minItems` and the required fields of every item are filled in). A step without required questions is full once it was visited. A full ring on a step without errors becomes a green circle with a tick.
- `sidebarHeader: { title, subtitle?, backUrl?, action? }`: a back arrow and a title at the top of the list ("Back and save as draft"). It replaces the "Save and exit" button. A click saves the draft (with `saveDraft`), then fires `formAction` `{ name: action, field: null, values }` when `action` is set, otherwise fires `exit` and opens `backUrl` (or `exitUrl`). In a frame, `redirectTarget` decides whether the whole page or only the frame moves. `{saved}` in the subtitle becomes "Saved just now" / "Saved 5 minutes ago" (in the form language, kept up to date); it is left out until the first save.
- `sidebarActions: [{ label, variant?, action, name? }]`: full-width buttons under the steps. `variant`: `primary` (default), `secondary`, `outline`, `ghost` or `link` (a centred text link). `action`: `submit` (sends the form like the submit button, with every check), `next` (the next step; hidden on the last one) or `emit` (fires `formAction` with `name`). On small screens, where the list becomes a strip, the buttons move under the form.

```json
"settings": {
  "stepsLayout": "sidebar", "stepProgress": true, "saveDraft": true,
  "sidebarHeader": { "title": "Back and save as draft", "subtitle": "{saved}", "backUrl": "/contracts" },
  "sidebarActions": [
    { "label": "Create contract", "action": "submit" },
    { "label": "Preview", "variant": "link", "action": "emit", "name": "preview" }
  ]
}
```

**Sections.** `{ "type": "section", "label": "Dates", "fields": [ … ] }` groups fields in a card. Rows can sit inside sections. `config.badge` puts a round number ("1") next to the title, `config.tooltip` adds a "?" icon with a help text, and a section with a `disable` rule is greyed out and unusable (a numbered checklist that unlocks step by step). A section without fields is just a card with a title.

**Tabs.** `{ "type": "tabs", "tabs": [ { "id": "a", "label": "Units", "fields": [ … ] }, … ] }`. Answers of all tabs are part of the same form; rules can use fields of other tabs.

**Repeating groups.** The answer is a list of objects, one per item:

```json
{
  "type": "repeater", "id": "guests", "model": "guests",
  "config": { "itemLabel": "Guest #{n}", "addLabel": "Add guest", "minItems": 1, "maxItems": 4, "collapsible": true },
  "fields": [
    { "type": "input", "id": "t_name", "model": "name", "label": "Name", "validations": [{ "name": "required", "params": [] }] },
    { "type": "input", "id": "t_email", "model": "email", "inputType": "email", "label": "Email" }
  ]
}
```

→ `{ "guests": [ { "name": "Anna", "email": "…" }, … ] }`. Config: `layout` (`cards` or `table`), `itemLabel` (`{n}` and `{key}` of an answer in the item), `addLabel`, `addStyle` (`button` or `dashed`), `emptyText`, `minItems` / `maxItems`, `allowAdd` / `allowRemove`, `collapsible` / `startCollapsed`, `presets`. A repeater can contain another repeater (the checklist of a room).

- **Logic inside an item** uses the other fields of the same item by their key (`"condition"`), and still reaches normal fields. Errors are keyed by path (`guests[0].email`).
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
