---
title: "formgenerator_string"
sidebar_position: 9
---

### String

Examples about **string** `validationType` from [Yup](https://www.npmjs.com/package/yup)

Validation

Implementation

`string.required(message?: string | function): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "required",
      "params": [
        "This is a required field"
      ]
    }
  ]
}
```

`string.nullable(message?: string | function): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "nullable",
      "params": [
      ]
    }
  ]
}
```

`string.length(limit: number | Ref, message?: string | function): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "length",
      "params": [
        15,
        "The string should be exactly ${length} characters"
      ]
    }
  ]
}
```

`string.min(limit: number | Ref, message?: string | function): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "min",
      "params": [
        10,
        "The string should contain minimum ${min} characters"
      ]
    }
  ]
}
```

`string.max(limit: number | Ref, message?: string | function): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "max",
      "params": [
        20,
        "The string should contain maximum ${max} characters"
      ]
    }
  ]
}
```

`string.matches(regex: RegExp, message?: string | function): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "matches",
      "params": [
        "^[a-zA-Z0-9]*$", // Regex pattern
        "The string should match the required pattern"
      ]
    }
  ]
}
```

`string.matches(regex: RegExp, options: \{ message: string, excludeEmptyString: bool \}): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "matches",
      "params": [
        "^[a-zA-Z0-9]*$", // Regex pattern
        {
          "message": "The string should match the required pattern",
          "excludeEmptyString": true
        }
      ]
    }
  ]
}
```

`string.email(message?: string | function): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "email",
      "params": [
        "The string should be a valid email address"
      ]
    }
  ]
}
```

`string.url(message?: string | function): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "url",
      "params": [
        "The string should be a valid URL"
      ]
    }
  ]
}
```

`string.uuid(message?: string | function): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "uuid",
      "params": [
        "The string should be a valid UUID"
      ]
    }
  ]
}
```

`string.datetime(options?: \{message?: string | function, allowOffset?: boolean, precision?: number\})`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "datetime",
      "params": [
        {
          "message": "The string should be a valid datetime",
          "allowOffset": true,
          "precision": 3
        }
      ]
    }
  ]
}
```

`string.datetime(message?: string | function)`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "datetime",
      "params": [
        "The string should be a valid datetime"
      ]
    }
  ]
}
```

`string.ensure(): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "ensure",
      "params": []
    }
  ]
}
```

`string.trim(message?: string | function): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "trim",
      "params": [
        "The string should not have leading or trailing whitespace"
      ]
    }
  ]
}
```

`string.lowercase(message?: string | function): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "lowercase",
      "params": [
        "The string should be in lowercase"
      ]
    }
  ]
}
```

`string.uppercase(message?: string | function): Schema`

```json
                
{
  "validationType": "string",
  "validations": [
    {
      "name": "uppercase",
      "params": [
        "The string should be in uppercase"
      ]
    }
  ]
}
```
