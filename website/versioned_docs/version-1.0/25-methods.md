---
title: "Methods"
sidebar_position: 25
---

Name

Description

Code Example

`updateValue`

Updates the value of the model.

```
<script>
  const formGenerator = document.querySelector('re-form-generator');
  formGenerator.addEventListener('valueChanged', event => { 
    const field = event.detail;
    const { birthday } = field;
    if (birthday) {
      const parts = birthday.split('-');
      const [year, month, date] = parts;
      formGenerator.updateValue('year', year);
      formGenerator.updateValue('month', month);
      formGenerator.updateValue('date', date);
    }
  });
</script>
```

`submit`

It will submit the form with its values and will trigger the `submitted` event.

```
<script>
  const formGenerator = document.querySelector('re-form-generator');
  formGenerator.submit();
</script>
```

`validate`

Validates the form. In case of errors, the `validationError` event will be emitted.

```
<script>
  const formGenerator = document.querySelector('re-form-generator');
  formGenerator.validate();
</script>
```
