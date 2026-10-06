---
title: "Rich options"
sidebar_position: 8
---

Radio and checkbox groups can say more about each option (like a list of providers to pick from). Besides `label`, `value` and `group`, an option can have:

| Property | |
| --- | --- |
| `badge` | a short tag after the label, e.g. `"Most used"` |
| `description` | a second line of smaller text under the label |
| `image` | a logo (at most 28 px high, keeps its proportions). Where it goes is set per question with `config.imagePosition`: `left` (default: before the label, on its line; it wraps only when the line is full), `right` (right after the label, before its badge and help), `top` or `bottom` (on a line of its own, above the label or under the description and link). Only `http(s)`, relative and `data:image/…;base64` addresses are used. `imageAlt` describes it for screen readers (empty by default: the label already names it) |
| `link` | `{ label, url }`: a link after the description that opens in a new tab (`rel="noopener noreferrer"`). Only `http(s)` URLs; clicking it does not pick the option |
| `help` | a text behind a small "?" after the label (hover, focus, click or tap; Escape closes it). Clicking the "?" does not pick the option |

```json
{
  "type": "radioGroup", "id": "deposit", "model": "deposit", "label": "Who holds the deposit?",
  "config": { "optionStyle": "cards", "visibleOptions": 3 },
  "options": [
    { "label": "Bank guarantee", "value": "bank", "badge": "Most used", "image": "https://example.com/bank.svg",
      "description": "The bank pays if something goes wrong.", "link": { "label": "Read more", "url": "https://example.com/bank" },
      "help": "You pay a small yearly fee instead of the full deposit." }
  ]
}
```

With `config.optionStyle: "cards"`, options that use any of these get the provider-list look: bordered cards on a light background, the radio / tick on the left and the content on the right, the picked card outlined in the primary colour. Cards without them keep the big tile look. All texts are translatable (`field.<id>.optionBadge.<value>`, `optionDesc`, `optionHelp`, `optionLink`, `optionAlt`), and so is a field's `tooltip` (`field.<id>.tooltip`).
