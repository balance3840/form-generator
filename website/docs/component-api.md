---
title: "Component API"
sidebar_position: 19
---

| Prop | |
| --- | --- |
| `schema` | document (object or JSON string) or a v1 array |
| `model` | initial values keyed by `model` |
| `action`, `mapping` | override `schema.action` / `action.mapping` |
| `theme` | object, preset id, or JSON string; overrides `schema.theme` |
| `language` | forces a language (e.g. `es`, `pt-BR`); see [Languages](/document-reference/languages-i18n) |
| `designMode` | used by the builder: shows every field, no logic, inert |

Events: `submitted` (`{ values, response, error }`), `valueChanged`, `validationError`, `handleSubmit`, `languageChanged` (`{ language }`), `formAction` (`{ name, field, values }`, from a button's `emit` action; from the step list's header or buttons `field` is `null`), `stepChanged` (`{ index, id, title }`), `draftSaved` (`{ values }`, every time the draft is saved), `exit` (`{ values }`, "Save and exit" or the step list's back link).
Methods: `submit()`, `validate()`, `reset()`, `getValues()`, `updateValue(key, value)` (keys inside a repeater are paths like `guests[0].email`), `goToStep(id, validate?)`, `setLanguage(code)`, `getLanguage()`.
Slots: `field-label@<field id>` renders custom content under a field's label.
