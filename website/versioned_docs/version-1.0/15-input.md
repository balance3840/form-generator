---
title: "Input"
sidebar_position: 15
---

Input field allow following `inputType` values in the form schema:

*   [checkbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox)
*   [color](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color)
*   [date](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)
*   [datetime-local](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local)
*   [email](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email)
*   [month](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/month)
*   [number](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number)
*   [password](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/password)
*   [range](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range)
*   [tel](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/tel)
*   [text](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text)
*   [time](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/time)
*   [url](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/url)
*   [week](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/week)

If you want to specify any attirbutte that given input type supports natively you can do it in the schema using `attributtes` property. For example, if you want an `inputType` week to have the attibutes `min` and `max`, you can do it as follow:

```json
{
  // Other field properties
  "inputType": "week",
  "attributes": {
    "min": "2024-W1",
    "max": "2024-W10"
  }
}
```

* * *

### Checkbox

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "checkbox-field",
    "inputType": "checkbox",
    "inputName": "checkbox-name",
    "visible": "true",
    "label": "Checkbox field",
    "model": "checkboxField"
  }]'>
</re-form-generator>
```

* * *

### Color

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "color-field",
    "inputType": "color",
    "inputName": "color-name",
    "visible": "true",
    "label": "Color field",
    "model": "colorField"
    "defaultValue": "#FFC0CB"
  }]'>
</re-form-generator>
```

* * *

### Date

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "date-field",
    "inputType": "date",
    "inputName": "date-name",
    "visible": "true",
    "label": "Date field",
    "model": "dateField"
  }]'>
</re-form-generator>
```

* * *

### Datetime-local

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "datetime-local-field",
    "inputType": "datetime-local",
    "inputName": "datetime-local-name",
    "visible": "true",
    "label": "Datetime-local field",
    "model": "datetime-localField"
  }]'>
</re-form-generator>
```

* * *

### Email

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "email-field",
    "inputType": "email",
    "inputName": "email-name",
    "visible": "true",
    "label": "Email field",
    "model": "emailField",
    "placeholder": "example@example.com"
  }]'>
</re-form-generator>
```

* * *

### Month

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "month-field",
    "inputType": "month",
    "inputName": "month-name",
    "visible": "true",
    "label": "Month field",
    "model": "monthField"
  }]'>
</re-form-generator>
```

* * *

### Number

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "number-field",
    "inputType": "number",
    "inputName": "number-name",
    "visible": "true",
    "label": "<h1>I also support HTML</h1>",
    "model": "numberField",
    "defaultValue": 69
  }]'>
</re-form-generator>
```

* * *

### Password

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "password-field",
    "inputType": "password",
    "inputName": "password-name",
    "visible": "true",
    "label": "Password field",
    "model": "passwordField"
  }]'>
</re-form-generator>
```

* * *

### range

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "range-field",
    "inputType": "range",
    "inputName": "range-name",
    "visible": "true",
    "label": "Range field",
    "model": "rangeField",
    "attributes": {
      "min": 0,
      "max": 100,
      "step": 10
    },
    "defaultValue": 50
  }]'>
</re-form-generator>
```

* * *

### Tel

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "phone-field",
    "inputType": "tel",
    "inputName": "phone-name",
    "visible": "true",
    "label": "Phone field",
    "model": "phoneField",
    "attributes": {
      "pattern":"[0-9]{3}-[0-9]{3}-[0-9]{4}"
    }
  }]'>
</re-form-generator>
```

* * *

### text

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "text-field",
    "inputType": "text",
    "inputName": "text-name",
    "visible": "true",
    "label": "Text field",
    "model": "textField",
    "defaultValue": "This is a disabled and readonly field",
    "readonly": true,
    "disabled": true
  }]'>
</re-form-generator>
```

* * *

### Time

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "time-field",
    "inputType": "time",
    "inputName": "time-name",
    "visible": "true",
    "label": "Time field",
    "model": "timeField"
  }]'>
</re-form-generator>
```

* * *

### Url

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "url-field",
    "inputType": "url",
    "inputName": "url-name",
    "visible": "true",
    "label": "Url field",
    "model": "urlField"
  }]'>
</re-form-generator>
```

* * *

### Week

```html
<re-form-generator
  schema='[{
    "type": "input",
    "id": "week-field",
    "inputType": "week",
    "inputName": "week-name",
    "visible": "true",
    "label": "Week field",
    "model": "weekField"
  }]'>
</re-form-generator>
```
