# Contributing

## Run it locally

```bash
npm install
npm start            # dev server with the demo page (src/index.html)
npm run build        # build the package
npm test
npm run check:flow   # logic checks for repeaters, rules, defaults and translations (no browser needed)
```

## Documentation site

The documentation is built from `readme.md` with [Docusaurus](https://docusaurus.io) in `website/`. Version 1 is kept
next to the current one, and the version selector defaults to the current version:

```bash
cd website
npm install
npm run split   # rebuilds the v2 pages (website/docs) from the readme. Edit the readme, not website/docs
npm start       # local preview
npm run build   # static site in website/build
```

Pushes to `main` publish it to GitHub Pages (`.github/workflows/docs.yml`). To freeze the current docs as a new
version before a breaking release: `npm run docs:version -- 2.0`, then add it to `versions` in
`website/docusaurus.config.mjs`.

## Releasing

Pushing a version tag publishes to npm and creates a GitHub release (`.github/workflows/release.yml`). Pull requests
and pushes to `main` are built by `ci.yml`.

```bash
npm version 2.0.0          # bumps package.json and creates the tag v2.0.0
git push --follow-tags
```

The tag must match the `package.json` version. Versions with a suffix (`2.0.0-alpha.1`) are published under that npm
tag (`alpha`) and marked as pre-releases; plain versions get `latest`.
