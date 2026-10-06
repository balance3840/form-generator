---
title: "Room-list style flows (type picker, global vs. per-item tools)"
sidebar_position: 11
---

- **Add dialog with a type picker**: `presets` on a repeater with `addMode: 'modal'` shows the presets first; `uniqueKey` keeps names unique ("Kitchen 2"), `dialogContent: 'marked'` limits the dialog to fields marked `dialogOnly`.
- **Global vs. per-item actions**: the same button works at two levels. `setAll` takes a nested path (`field: 'rooms.units'`) to change every item of every row; inside an item the plain path only touches that item. A step-level list (e.g. `allDefects`) can use `optionsFrom: { field: 'rooms.units', labelKey, groupKey }` with `searchable` to pick items from all rows, grouped.
- **Translating preset data**: `config.presetTextKeys: ['name', 'unit']` lists the properties inside `presets[].values` (at any depth) whose text people read; those strings appear in the translations next to the preset label (e.g. the room name and the unit names). Stored values such as a condition (`'Good'`) are never translated. `addTitle` and `backLabel` are translatable too.
- **Item pages**: an open item shows everything inside it, tabs and sections included; the rest of the step steps aside. `closeItem` returns to the list (e.g. a "Mark as done" button: `set done` then `closeItem`).
