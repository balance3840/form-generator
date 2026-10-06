---
title: "Languages (i18n)"
sidebar_position: 14
---

Write the form once in its default language, then add translations. Anything not translated falls back to the default language.

```json
"i18n": {
  "defaultLanguage": "en",
  "languages": ["en", "es", "fr"],
  "detect": true,
  "switcher": "flags",
  "translations": {
    "es": {
      "title": "Contáctanos",
      "settings.submitButtonText": "Enviar",
      "field.name.label": "Tu nombre",
      "field.plan.option.free": "Gratis",
      "ui.submit": "Mandar"
    }
  }
}
```

- **Which language is shown:** the `language` prop if set (it also hides the switcher); else the visitor's choice in the switcher; else the browser language (`navigator.languages`, `detect` is on by default) when it matches one of `languages` (`pt-BR` matches `pt`); else `defaultLanguage`.
- **Switcher:** `"none"` (default), `"flags"` or `"dropdown"`: a language selector at the top of the form. Flags are emoji, so on Windows they show as letters.
- **Keys:** `title`, `description`, `settings.<name>`, `settings.sidebarHeader.<title|subtitle>`, `settings.sidebarActions.<index>.label`, and `field.<field id>.<label|helpText|tooltip|placeholder|content|checkboxLabel|config.minLabel|config.maxLabel|config.unit>`, `field.<id>.option.<option value>`, `field.<id>.<optionDesc|optionBadge|optionHelp|optionLink|optionAlt>.<option value>`, `field.<id>.validation.<rule name>` (a custom error message). The builder's **Translate** tab lists them all.
- **Built-in texts** (buttons, step counter, upload text, default error messages, country names) are translated for `en es fr de it pt nl pl ca da` and can be overridden per language with `ui.*` / `validation.*` keys (see `BUILT_IN_UI` in `src/utils/i18n.ts`). Other languages use English for these unless you provide them. This works for the default language too, so a single-language form can reword them: `"translations": { "en": { "ui.step": "Stage {current} of {total}" } }`. Country names use the browser's `Intl.DisplayNames`.
- `ar`, `he` and `fa` set `dir="rtl"` on the form.

```html
<re-form-generator language="es"></re-form-generator>   <!-- force a language -->
<script>
  form.addEventListener('languageChanged', e => console.log(e.detail.language));
  form.setLanguage('fr');                                 // switch from your own UI
</script>
```
