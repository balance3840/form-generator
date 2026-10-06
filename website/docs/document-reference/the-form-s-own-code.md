---
title: "The form's own code"
sidebar_position: 17
---

`script` (a string at the top of the document) is JavaScript that runs with the form, like the “Script” box of the old forms, but **in a sandbox**: a hidden frame with no access to the page, its cookies, its storage or anybody's login. It talks to the form through a `form` object:

```js
form.on('change', ({ key, value }) => {      // also 'ready', 'step', 'beforeSubmit', 'submitted'
  if (key === 'city') form.filterOptions('projects', o => o.label.includes(value));
});
form.set('year', '2000');                    // or form.set({ a: 1, b: 2 })
form.get('city');                            // form.values: every answer
form.setOptions('projects', [{ label: 'A', value: 'a' }]);   // form.resetOptions('projects') undoes it
form.hide('vat'); form.show('vat');          // hidden fields are not checked and not sent
form.goToStep('stepId'); form.redirect('https://…');
form.alert('Thank you!');                    // a message for the person (plain alert() works too)
form.style('email', { background: '#fff3f3', borderColor: '#e11d48' });   // colours, see below; form.resetStyle('email') undoes it
form.on('beforeSubmit', ({ values }) => values.age < 18 ? 'You must be 18 or older.' : true);  // false or a message stops the send
```

`form.style(field, colours)` takes only colours (`#hex`, `rgb()`/`hsl()` or a colour name) for `background` (the input box), `color` (its text), `borderColor`, `accentColor` (selected options, focus ring), `labelColor` and `highlight` (a coloured box behind the whole question). A second call adds to the first; `null` removes one colour. Nothing else can be styled, so the code cannot add CSS to the page.

The code can call APIs with `fetch`, and `beforeSubmit` waits for an `async` handler (at most 4 seconds). The frame has no origin of its own, so only APIs that allow every site (`Access-Control-Allow-Origin: *`) answer, never with the visitor's cookies or login, and the page's Content-Security-Policy applies.

`form.updateValue` / `form.getValue` work too (the names older scripts used). The prop `allow-script="false"` never runs it; the builder's canvas never does.
