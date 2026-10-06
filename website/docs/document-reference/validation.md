---
title: "Validation"
sidebar_position: 6
---

`validationType` is a Yup type (`string number boolean date array object`); `validations` is a list of `{ name, params }` where `name` is a Yup method. The message is the last parameter, and a friendly default is used when omitted:

```json
{ "name": "required", "params": ["Please tell us your name"] }
{ "name": "min", "params": [3, "At least 3 characters"] }
{ "name": "matches", "params": ["^[0-9]{5}$", "Five digits please"] }
```

On a `boolean` field, `required` means "must be ticked". A rule whose value is empty is ignored.

Available rules by `validationType`:

| Type | Rules |
| --- | --- |
| `string` | `required` `min` / `max` / `length` (characters) `email` `url` `uuid` `matches` (regex string) `lowercase` `uppercase` `oneOf` / `notOneOf` (list of values) `sameAs` / `notSameAs` (another field) |
| `number` | `required` `min` `max` `moreThan` `lessThan` `integer` `positive` `negative` `oneOf` / `notOneOf` `sameAs` / `notSameAs` `minField` / `maxField` (another field) |
| `date` | `required` `min` `max` (earliest / latest date) `minField` / `maxField` (not before / not after another field) |
| `array` | `required` `min` `max` `length` (number of choices) |
| `boolean` | `required` (must be ticked) |
| `file` (used automatically for `type: "file"`) | `required` `maxFileSize` (MB per file) `fileTypes` (`[".pdf", "image/*"]`) `minFiles` `maxFiles` |

Phone and e-mail checks: `phone` (a number that exists in its country's numbering plan, checked with libphonenumber-js: length and leading digits), `phoneCountries` (`[["dk", "se"], "message"]`: only numbers from these countries) and `emailDomains` (`[["company.com"], "message"]`: only addresses on these domains, subdomains included).

Not every rule makes sense for every input: the builder offers them per kind of input, through `rulesFor(field)` / `RULES_BY_KIND` (a phone number gets `phone`, `phoneCountries`, `matches`, `sameAs`…; a URL `url`, `maxLength`, `matches`; a dropdown, a Likert or a ranking only `required`).

Rules that compare with another field take that field's `model` as their value, e.g. `{ "name": "sameAs", "params": ["email", "The emails do not match"] }` or `{ "name": "minField", "params": ["startDate", "End must be after the start"] }`. If the referenced field no longer exists the rule is ignored. A file field's `attributes.accept` is enforced on submit too, not just used as a hint for the file picker.
