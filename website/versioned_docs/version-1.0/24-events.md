---
title: "Events"
sidebar_position: 24
---

Name

Description

Code Example

`submitted`

Event emitted when the form is submitted. When form action is not defined, event will emit all form values, otherwise, if action is defined, the response of the request will be passed as an argument of the callback.

```
<script>
  const formGenerator = document.querySelector('re-form-generator');
  formGenerator.addEventListener('submitted', event => { 
    console.log(event.detail);
  });
</script>
```

`validationError`

In the submit process when there are errors this event is emitted.

```
<script>
  const formGenerator = document.querySelector('re-form-generator');
  formGenerator.addEventListener('validationError', event => { 
    console.log(event.detail);
  });
</script>
```

`valueChanged`

Event is emitted every time when form input data changes.

```
<script>
  const formGenerator = document.querySelector('re-form-generator');
  formGenerator.addEventListener('valueChanged', event => { 
    console.log(event.detail);
  });
</script>
```
