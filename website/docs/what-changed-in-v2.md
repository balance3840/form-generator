---
title: "What changed in v2"
sidebar_position: 2
---

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
