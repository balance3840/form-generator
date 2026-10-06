---
title: "formgenerator_mixed"
sidebar_position: 13
---

### Mixed

Examples about **mixed** `validationType` from [Yup](https://www.npmjs.com/package/yup)

Validation

Implementation

`mixed.required(message?: string | function): Schema`

```json
                
{
  "validationType": "mixed",
  "validations": [
    {
      "name": "required",
      "params": [
        "This field is required"
      ]
    }
  ]
}
```

`mixed.oneOf(arrayOfValues: Array, message?: string | function): Schema`

```json
                
{
  "validationType": "mixed",
  "validations": [
    {
      "name": "oneOf",
      "params": [
        [1, 2, 3], // Example array of valid values
        "The value must be one of ${values}"
      ]
    }
  ]
}
```

`mixed.notOneOf(arrayOfValues: Array, message?: string | function): Schema`

```json
                
{
  "validationType": "mixed",
  "validations": [
    {
      "name": "notOneOf",
      "params": [
        [1, 2, 3], // Example array of invalid values
        "The value must not be one of ${values}"
      ]
    }
  ]
}
```

`mixed.equals(arrayOfValues: Array, message?: string | function): Schema`

```json
                
{
  "validationType": "mixed",
  "validations": [
    {
      "name": "equals",
      "params": [
        [1, 2, 3], // Example array of equal values
        "The value must be equal to one of ${values}"
      ]
    }
  ]
}
```

`mixed.notEquals(arrayOfValues: Array, message?: string | function): Schema`

```json
                
{
  "validationType": "mixed",
  "validations": [
    {
      "name": "notEquals",
      "params": [
        [1, 2, 3], // Example array of not equal values
        "The value must not be equal to one of ${values}"
      ]
    }
  ]
}
```

`mixed.default(value: any): Schema`

```json
                
{
  "validationType": "mixed",
  "validations": [
    {
      "name": "default",
      "params": [
        "default value"
      ]
    }
  ]
}
```

`mixed.nullable(isNullable?: boolean): Schema`

```json
                
{
  "validationType": "mixed",
  "validations": [
    {
      "name": "nullable",
      "params": [
        true // Allows the value to be null
      ]
    }
  ]
}
```
