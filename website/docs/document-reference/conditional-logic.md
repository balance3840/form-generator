---
title: "Conditional logic"
sidebar_position: 7
---

```json
"logic": { "action": "show", "match": "all", "conditions": [{ "field": "attended", "operator": "equals", "value": "yes" }] }
```

`action` is one of `show`, `hide`, `disable` (can't be edited while the rule matches), `enable` (can **only** be edited while it matches) and `require` (becomes required while it matches). Give `logic` a **list** of rules to combine several (every show/hide rule has to allow it). `match` is `all` (AND), `any` (OR) or `none` (NOT any). A condition can be a **group** with its own `match` and `conditions`, nested as deep as needed: `(A or B) and (C and D)` is `{ "match": "all", "conditions": [ { "match": "any", "conditions": [A, B] }, { "match": "all", "conditions": [C, D] } ] }`. Empty groups are ignored. Operators: `equals not_equals contains not_contains gt lt empty not_empty`. `field` is another field's `model`. For lists (checkbox groups, repeaters) `gt` / `lt` compare the number of entries, so `{ "field": "guests", "operator": "lt", "value": 1 }` means "no guest added". Hidden fields are not validated and not submitted; fields switched off by a rule are not validated.

**Months, weeks and years.** `{ "type": "month" }` answers `"2026-10"`, `{ "type": "week" }` an ISO week `"2026-W42"` (picked as a calendar row, with week numbers), `{ "type": "year" }` `"2026"`. `config.multiple: true` answers a list; `config.minDate` / `maxDate` (`"today"`, `"+60"` or a date) grey out what is outside.
