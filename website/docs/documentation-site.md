---
title: "Documentation site"
sidebar_position: 20
---

The documentation is published at &lt;https://balance3840.github.io/form-generator/> with a version selector (v2 is the default, v1 is kept). It lives in `website/` ([Docusaurus](https://docusaurus.io)):

```bash
cd website
npm install
npm run split   # rebuilds the v2 pages (website/docs) from this readme. Edit the readme, not website/docs
npm start       # local preview
npm run build   # static site in website/build
```

Pushes to `main` publish it through GitHub Actions (`.github/workflows/docs.yml`); set **Settings → Pages → Source** to *GitHub Actions* once. To freeze the current docs as a new version before a breaking release: `npm run docs:version -- 2.0`, then add it to `versions` in `website/docusaurus.config.mjs`.
