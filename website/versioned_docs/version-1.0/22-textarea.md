---
title: "Textarea"
sidebar_position: 22
---

Textarea is an input field that allows for multi-line text.

Textarea attributes like `maxlength` or `rows` can be deffined in the `attributes` property in a following way:

```json
      
{
  // Other field properties
  "attributes": {
    "maxlength": 20,
    "rows": 2
  }
}
```

### Textarea

```html
<re-form-generator
  schema='[{
    "type": "textarea",
    "id": "long-text",
    "inputName": "long-text",
    "visible": true,
    "label": "Textarea",
    "model": "longText",
    "readonly": false,
    "disabled": false,
    "placeholder": "Please feed me with some text...",
    "attributes": {
      "maxlength": 20,
      "rows": 2
    }
  }]'>
</re-form-generator>
```
