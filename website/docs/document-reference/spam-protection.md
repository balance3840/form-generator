---
title: "Spam protection"
sidebar_position: 15
---

`settings.captcha`: `{ "provider": "turnstile", "siteKey": "…", "theme": "auto" }`.

| `provider` | |
| --- | --- |
| `honeypot` | a hidden trap field, no account or key. A submission that fills it is silently dropped. Stops simple bots only |
| `turnstile` | Cloudflare Turnstile (answers get `cf-turnstile-response`) |
| `hcaptcha` | hCaptcha (`h-captcha-response`) |
| `recaptcha` | Google reCAPTCHA v2 checkbox (`g-recaptcha-response`) |
| `recaptcha3` | Google reCAPTCHA v3, invisible (`g-recaptcha-response`) |

The token travels with the answers, **and your server must verify it** with the provider's *secret* key (see the builder's "Show how to check it"). The old `action.recaptchaSiteKey` still works as reCAPTCHA v2. Each provider publishes test site keys that always pass, handy while building.
