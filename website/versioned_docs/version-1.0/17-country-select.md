---
title: "Country select"
sidebar_position: 17
---

Country select field allow selecting country or dial code. Countries are searchable by their names and dial codes. The `modelValueKey` property defines which value is selected: `name`, `dialCode` or `code`. The `inputDisplayKey` property is resposible for the value that is displayed after country selection. To specify `defaultValue` use lowercase country ISO code, for example, `"defaultValue": "dk"`.

### Country select

```html
<re-form-generator
  schema='[{
    "type": "countrySelect",
    "id": "country",
    "inputName": "country",
    "visible": true,
    "label": "Country",
    "model": "country",
    "modelValueKey": "code",
    "placeholder": "Select country",
    "layout": {
        "row": "row1",
        "cols": 6
    }
  }]'>
</re-form-generator>
```

* * *

### Dial code

```html
<re-form-generator
  schema='[{
    "type": "countrySelect",
    "id": "dial_code",
    "inputName": "dial_code",
    "visible": true,
    "label": "Dial code",
    "model": "dial_code",
    "defaultValue": "dk",
    "modelValueKey": "dialCode",
    "inputDisplayKey": "dialCode",
    "showDialCode": true,
    "placeholder": "Select dial code",
    "layout": {
        "row": "row1",
        "cols": 4
    }
  }]'>
</re-form-generator>
```
