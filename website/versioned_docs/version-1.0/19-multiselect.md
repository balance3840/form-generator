---
title: "Multiselect"
sidebar_position: 19
---

Multiselect is an input field that allows multiple items to be selected. Available selection options should be defined in the `values` property. For instance:

```json
{
  // Other field properties
  "values": [
    {
      "value": 1,
      "display": "Option 1",
      "group": "options"
    },
    {
      "value": 2,
      "display": "Option 2",
      "group": "options"
    },
    {
      "value": 3,
      "display": "Option 3",
      "group": "options"
    }
  ]
}
```

When it comes to the default values, they are controlled through `defaultOptions`, specifing indices of values that should be pre-selected. For example:

```json
{
  // Other field properties
  "defaultOptions": [0, 1]
}
```

### Multiselect

```html
<re-form-generator
  schema='[{
  "type": "multiSelect",
  "id": "multiselect",
  "inputName": "options",
  "inputType": "number",
  "visible": true,
  "label": "Multiselect",
  "model": "options",
  "placeholder": "Select options",
  "values": [
      {
        "value": 1,
        "display": "Option 1",
        "group": "options"
      },
      {
        "value": 2,
        "display": "Option 2",
        "group": "options"
      },
      {
        "value": 3,
        "display": "Option 3",
        "group": "options"
      }
  ]
  }]'>
</re-form-generator>
```
