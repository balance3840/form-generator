---
title: "Form Schema"
sidebar_position: 6
---

The `schema` attribute is basically the core of the component. In this, you can specify all the fields, layout, and validations that your form should contain.

Further in the doumentation we will conver the different type of fields and validations you can use in the form, for now let's just see an example of how a field looks like in the schema:

```json
            
{
  "type": "input",
  "id": "name",
  "inputType": "text",
  "inputName": "name",
  "visible": true,
  "label": "Name",
  "model": "applicantName",
  "readonly": false,
  "disabled": false,
  "placeholder": "John",
  "validationType": "string",
  "validations": [
    {
      "name": "required",
      "params": [
        "First name is a required field"
      ]
    }
  ]
}
```

These properties in the schema can vary based on the `type` and as mentioned before are going to be detailed individually. These are some of the most common properties that can be applied to the fields:

*   String `type` - Input field type. Accepted values:
    *   input
    *   textarea
    *   toggle
    *   select
    *   checkboxGroup
    *   radioGroup
    *   multiSelect
    *   countrySelect
    *   file
*   String `id` - id selector of the field
*   Boolean `visible` - Wether the field should be visible or not
*   String `label` - Field label (supports HTML)
*   String `model` - Object property name to be send to the API
*   Boolean `readonly` - Wether the field is read only or not
*   Boolean `disabled` - Wether the field is disabled or not
*   String `placeholder` - Field placeholder
*   String `validationType` - [Yup](https://www.npmjs.com/package/yup) validation type
    *   [string](https://www.npmjs.com/package/yup#string)
    *   [number](https://www.npmjs.com/package/yup#number)
    *   [date](https://www.npmjs.com/package/yup#date)
    *   [array](https://www.npmjs.com/package/yup#array)
    *   [mixed](https://www.npmjs.com/package/yup#mixed)
*   Array `validations` - Validations rule to apply based on [Yup](https://www.npmjs.com/package/yup) validation type (This is explained in [Validations](08-validations.md) section)
