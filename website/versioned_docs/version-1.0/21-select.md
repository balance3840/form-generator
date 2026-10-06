---
title: "Select"
sidebar_position: 21
---

Select is an input field that allows an item to be selected out of pre-defined options. Available selection options should be defined in the `values` property. Each `value` object should be described by following attributes: `value`, `display` and `group`. For instance:

```json
{
  // Other field properties
  "values": [
    {
      "value": "one",
      "display": "Option 1",
      "group": "options"
    },
    {
      "value": "two",
      "display": "Option 2",
      "group": "options"
    },
    {
      "value": "three",
      "display": "Option 3",
      "group": "options"
    }
  ]
}
```

When it comes to the default value, it is controlled through `defaultValue`, specifing of `value` property of the option that should be pre-selected. For example:

```json
{
  // Other field properties
  "defaultValue": "one"
}
```

### Select

```html
<re-form-generator
  schema='[{
    "type": "select",
    "id": "select",
    "inputName": "options",
    "visible": true,
    "label": "Select",
    "model": "selectOption",
    "readonly": false,
    "disabled": false,
    "placeholder": "Please select an option...",
    "defaultValue": "two",
    "values": [
      {
        "value": "one",
        "display": "Option 1",
        "group": "Options"
      },
      {
        "value": "two",
        "display": "Option 2",
        "group": "Options"
      },
      {
        "value": "three",
        "display": "Option 3",
        "group": "Options"
      }
    ]
  }]'>
</re-form-generator>
```
