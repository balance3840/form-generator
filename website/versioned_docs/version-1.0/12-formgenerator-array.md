---
title: "formgenerator_array"
sidebar_position: 12
---

### Array

Examples about **array** `validationType` from [Yup](https://www.npmjs.com/package/yup)

Validation

Implementation

`array.json(): this`

```json
                
{
  "validationType": "array",
  "validations": [
    {
      "name": "json",
      "params": []
    }
  ]
}
```

`array.length(length: number | Ref, message?: string | function): this`

```json
                
{
  "validationType": "array",
  "validations": [
    {
      "name": "length",
      "params": [
        5,
        "The array should contain exactly ${length} items"
      ]
    }
  ]
}
```

`array.min(limit: number | Ref, message?: string | function): this`

```json
                
{
  "validationType": "array",
  "validations": [
    {
      "name": "min",
      "params": [
        2,
        "The array should contain at least ${min} items"
      ]
    }
  ]
}
```

`array.max(limit: number | Ref, message?: string | function): this`

```json
                
{
  "validationType": "array",
  "validations": [
    {
      "name": "max",
      "params": [
        10,
        "The array should contain at most ${max} items"
      ]
    }
  ]
}
```

`array.ensure(): this`

```json
                
{
  "validationType": "array",
  "validations": [
    {
      "name": "ensure",
      "params": []
    }
  ]
}
```

`array.compact(rejector: (value) => boolean): Schema`

```json
                
{
  "validationType": "array",
  "validations": [
    {
      "name": "compact",
      "params": [
        "function(value) { return value === null; }"
      ]
    }
  ]
}
```
