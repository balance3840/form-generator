---
title: "Checkbox group"
sidebar_position: 16
---

Checkbox group is an input field that allows multiple items selection from pre-defined selection options.

Available radio buttons can be defined in the `items` property.

When it comes to the default values, they can defined with the `checked` property in the `attributes` array. For instance:

```json
{
  // Other field properties
  "items": [
    {
      "label": "Checkbox option 1",
      "value": "check-option-1",
      "attributes": {
        "checked": true
      }
    },
    {
      "label": "Checkbox option 2",
      "value": "check-option-2",
      "attributes": {
        "checked": true
      }
    },
    {
      "label": "Checkbox option 3",
      "value": "check-option-3"
    }
  ]
}
```

### Checkbox group

```html
<re-form-generator
  schema='[{
    "type": "checkboxGroup",
    "inputType": "object",
    "id": "checkbox-group",
    "inputName": "checkbox-group",
    "visible": true,
    "label": "Checkbox Group",
    "model": "checkboxOptions",
    "items": [
      {
        "label": "Checkbox option 1",
        "value": "check-option-1",
        "attributes": {
          "checked": true
        }
      },
      {
        "label": "Checkbox option 2",
        "value": "check-option-2",
        "attributes": {
          "checked": true
        }
      },
      {
        "label": "Checkbox option 3",
        "value": "check-option-3"
      }
    ]
  }]'>
</re-form-generator>
```
