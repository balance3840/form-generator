---
title: "File drag and drop"
sidebar_position: 18
---

File drag and dropdown input field let the user choose one or more files from their device storage. On default single file selection is allowed. To enable multiple file selection or to control allowed file types, specify the `attributes` property. For instance:

```json
{
  // Other field properties
  "attributes": {
    "multiple": true,
    "accept": "image/*,.pdf"
  }
}
```

Text displayed in the dropdown zone can be changed by defining `textTitle`, `subTitle` and `placeholder` properties.

```json
{
  {
    // Other field properties
    "textTitle":  "Custom title",
    "subTitle": "Custom subtitle",
    "placeholder": "Placeholder"
  }
}
```

### File input

```html
<re-form-generator
  schema='[{
    "type": "file",
    "inputType": "file",
    "label": "Documents",
    "id": "documents",
    "inputName": "documents",
    "visible": "true",
    "model": "documents"
  }]'>
</re-form-generator>
```

* * *

### File input - custom attributes

```html
<re-form-generator
  schema='[{
    "type": "file",
    "inputType": "file",
    "label": "Documents",
    "id": "documents",
    "inputName": "documents",
    "visible": "true",
    "model": "documents",
    "textTitle":  "Custom title",
    "subTitle": "Custom subtitle",
    "placeholder": "Placeholder",
    "attributes": {
        "multiple": true,
        "accept": "image/*,.pdf"
    }
  }]'>
</re-form-generator>
```
