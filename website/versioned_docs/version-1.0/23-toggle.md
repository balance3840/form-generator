---
title: "Toggle"
sidebar_position: 23
---

The toggle input is used to choose one of two values.

The `inputType` and `validationType` should be defined as `boolean`.

```json
{
  // Other field properties
  "inputType": "boolean",
  "validationType": "boolean"
}
```

### Toggle

```html
<re-form-generator
  schema='[{
    "type": "toggle",
    "id": "toggle-input",
    "inputType": "boolean",
    "inputName": "is-on",
    "visible": true,
    "label": "Do you want subscribe?",
    "model": "isOn",
    "validationType": "boolean",
    "defaultValue": true,
    "attributes": {
      "value": true
    }
  }]'>
</re-form-generator>
```
