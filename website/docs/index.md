---
title: "Introduction"
sidebar_position: 1
slug: /
---

A web component that renders themeable, validated forms from a JSON schema.

```html
<script type="module" src="https://unpkg.com/@restrella/form-generator@2/dist/form-generator/form-generator.esm.js"></script>

<re-form-generator id="form"></re-form-generator>
<script>
  const form = document.getElementById('form');
  form.schema = {
    version: 2,
    title: 'Contact us',
    fields: [
      { type: 'input', id: 'name', model: 'name', inputType: 'text', label: 'Name', validationType: 'string', validations: [{ name: 'required' }], layout: { cols: 6 } },
      { type: 'input', id: 'email', model: 'email', inputType: 'email', label: 'Email', validationType: 'string', validations: [{ name: 'required' }, { name: 'email' }], layout: { cols: 6 } },
      { type: 'textarea', id: 'msg', model: 'message', label: 'Message', validationType: 'string' },
    ],
  };
  form.addEventListener('submitted', e => console.log(e.detail.values));
</script>
```

Install it with `npm install @restrella/form-generator`, or load it from a CDN as above.

You rarely need to write this JSON by hand: the **form-builder** app is a visual editor that produces it.
