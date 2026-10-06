---
title: "Layout: rows and columns"
sidebar_position: 5
---

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
