---
title: "Branding: logo, cover, page background, footer"
sidebar_position: 12
---

Everything lives in `theme` (look) and `footer` (content):

- `theme.logo`, `logoHeight`, `logoAlign`, `logoLink` (makes it a link), `logoAlt`.
- `theme.cover`, `coverHeight`, `coverPosition` (`top|center|bottom`), `coverOverlay` (0-80, darkens it), `coverStyle` (`banner` or `hero`, which puts the logo, title and description on the image).
- `theme.pageImage`, `pageImageFit` (`cover|contain|tile`), `pageOverlay`: a background image behind the form. The component is only the card, so the page applies it with `pageStyle(theme)` (an object) or `pageStyleText(theme)` (a `style` string), both exported.
- `theme.headingFont` (a separate font for titles) and `theme.headerAlign` (`left|center`).
- `footer`: `{ enabled, style: 'plain'|'card'|'bar', align, text, links: [{label,url,newTab}], social: [{type,url}], copyright ("© {year} Acme"), logo, logoHeight, backgroundColor, textColor }`. It renders under the card; its text, link labels and copyright are translatable. Social types: facebook, instagram, linkedin, x, youtube, tiktok, email, phone, website.
