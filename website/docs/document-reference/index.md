---
title: "Document reference"
sidebar_position: 3
slug: /document-reference
---

```jsonc
{
  "version": 2,
  "title": "Event feedback",
  "description": "Optional text under the title",
  "theme":    { "preset": "indigo", "primaryColor": "#4f46e5" },
  "settings": { "submitButtonText": "Send", "successMessage": "Thanks!" },
  "action":   { "endpoint": "https://api.example.com/forms" },
  "i18n":     { "defaultLanguage": "en", "languages": ["en", "es"], "translations": { "es": { "title": "Opiniones del evento" } } },
  "fields":   [ /* see below */ ]
}
```
