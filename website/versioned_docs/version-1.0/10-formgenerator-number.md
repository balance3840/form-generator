---
title: "formgenerator_number"
sidebar_position: 10
---

### Number

Examples about **number** `validationType` from [Yup](https://www.npmjs.com/package/yup)

Validation

Implementation

`number.min(limit: number | Ref, message?: string | function): Schema`

```json
                
{
  "validationType": "number",
  "validations": [
    {
      "name": "min",
      "params": [
        5,
        "The number should be at least ${min}"
      ]
    }
  ]
}
```

`number.max(limit: number | Ref, message?: string | function): Schema`

```json
                
{
  "validationType": "number",
  "validations": [
    {
      "name": "max",
      "params": [
        100,
        "The number should be at most ${max}"
      ]
    }
  ]
}
```

`number.lessThan(max: number | Ref, message?: string | function): Schema`

```json
                
{
  "validationType": "number",
  "validations": [
    {
      "name": "lessThan",
      "params": [
        50,
        "The number should be less than ${less}"
      ]
    }
  ]
}
```

`number.moreThan(min: number | Ref, message?: string | function): Schema`

```json
                
{
  "validationType": "number",
  "validations": [
    {
      "name": "moreThan",
      "params": [
        10,
        "The number should be more than ${more}"
      ]
    }
  ]
}
```

`number.nullable(message?: string | function): Schema`

```json
                
{
  "validationType": "number",
  "validations": [
    {
      "name": "nullable",
      "params": []
    }
  ]
}
```

`number.positive(message?: string | function): Schema`

```json
                
{
  "validationType": "number",
  "validations": [
    {
      "name": "positive",
      "params": [
        "The number should be positive"
      ]
    }
  ]
}
```

`number.negative(message?: string | function): Schema`

```json
                
{
  "validationType": "number",
  "validations": [
    {
      "name": "negative",
      "params": [
        "The number should be negative"
      ]
    }
  ]
}
```

`number.integer(message?: string | function): Schema`

```json
                
{
  "validationType": "number",
  "validations": [
    {
      "name": "integer",
      "params": [
        "The number should be an integer"
      ]
    }
  ]
}
```

`number.truncate(): Schema`

```json
                
{
  "validationType": "number",
  "validations": [
    {
      "name": "truncate",
      "params": []
    }
  ]
}
```

`number.round(type: 'floor' | 'ceil' | 'trunc' | 'round' = 'round'): Schema`

```json
                
{
  "validationType": "number",
  "validations": [
    {
      "name": "round",
      "params": [
        "round"
      ]
    }
  ]
}
```
