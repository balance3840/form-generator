---
title: "Keys and secrets in a front-end form"
sidebar_position: 16
---

Everything in a web page is readable by visitors, so treat anything you put in a form as public:

- **Fine to include:** captcha *site* keys, Mapbox public (`pk.`) tokens, and Google / Geoapify browser keys **that you restricted** to your domain and to one API, with a spending limit or quota alert set.
- **Never include:** captcha *secret* keys, Mapbox `sk.` tokens, unrestricted keys, and `action.bearerToken` values that are not meant to be public (the token is sent from the visitor's browser).
- **For a key you cannot restrict**, put a small proxy in between: the form calls your address, the proxy adds the key and forwards the request. The builder generates a ready-to-paste Cloudflare Worker for the address providers ("Keep the key off the page") and switches the field to it.
- Submit the form to **your own server** (`action.endpoint`) and verify captcha tokens there.
