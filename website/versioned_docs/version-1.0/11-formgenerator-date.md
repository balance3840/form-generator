---
title: "formgenerator_date"
sidebar_position: 11
---

### Date

Examples about **date** `validationType` from [Yup](https://www.npmjs.com/package/yup)

Validation

Implementation

`date.min(limit: Date | string | Ref, message?: string | function): Schema`

```json
                
{
  "validationType": "date",
  "validations": [
    {
      "name": "min",
      "params": [
        "2023-01-01", // Date limit
        "The date should be later than ${min}"
      ]
    }
  ]
}
```

`date.max(limit: Date | string | Ref, message?: string | function): Schema`

```json
                
{
  "validationType": "date",
  "validations": [
    {
      "name": "max",
      "params": [
        "2024-01-01", // Date limit
        "The date should be earlier than ${max}"
      ]
    }
  ]
}
```
