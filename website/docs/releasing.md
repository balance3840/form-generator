---
title: "Releasing"
sidebar_position: 21
---

Pushing a version tag publishes to npm and creates a GitHub release (`.github/workflows/release.yml`). Pull requests and pushes to `main` are built by `ci.yml`.

```bash
npm version 2.0.0          # bumps package.json and creates the tag v2.0.0
git push --follow-tags
```

The tag must match the `package.json` version. Versions with a suffix (`2.0.0-alpha.1`) are published under that npm tag (`alpha`) and marked as pre-releases; plain versions get `latest`.
