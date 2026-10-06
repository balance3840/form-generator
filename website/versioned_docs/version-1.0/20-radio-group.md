---
title: "Radio group"
sidebar_position: 20
---

Radio group is an input field that allows single value selection from pre-defined radio buttons. Selecting any radio button automatically deselects any other currently-selected radio button.

Available radio buttons can be defined in the `items` property.

When it comes to the default value, it is defined with the `checked` property in the `attributes` array. For instance:

```json
{
  // Other field properties
  "items": [
    {
      "label": "Radio 1",
      "value": "radio-1"
    },
    {
      "label": "Radio 2",
      "value": "radio-2",
      "attributes": {
        "checked": true
      }
    },
    {
      "label": "Radio 3",
      "value": "radio-3"
    }
  ]
}
```

### Radio group

```html
<re-form-generator
  schema='[{
    "type": "radioGroup",
    "inputType": "radio",
    "id": "radio-group",
    "inputName": "radio-group",
    "visible": true,
    "label": "Radio Group",
    "model": "radioOption",
    "items": [
      {
        "label": "Radio 1",
        "value": "radio-1"
      },
      {
        "label": "Radio 2",
        "value": "radio-2",
        "attributes": {
          "checked": true
        }
      },
      {
        "label": "Radio 3",
        "value": "radio-3"
      }
    ]
  }]'>
</re-form-generator>
```
