---
title: "Theme"
sidebar_position: 13
---

`theme` takes a `preset` (`indigo minimal soft ocean forest sunset midnight mono`) and/or overrides: `logo logoHeight logoAlign cover coverHeight` (images: `https://…`, a relative path or a `data:image/…` URL; anything else is ignored) `primaryColor backgroundColor textColor pageBackground fontFamily borderRadius inputStyle (outlined|filled|underlined) spacing (compact|comfortable|spacious) cardStyle (shadow|bordered|flat) maxWidth buttonStyle (solid|outline) buttonWidth (full|auto|equal: Back and Next in halves) buttonAlign (left|center|right) labelStyle (normal|uppercase) customCss`. Everything is exposed as `--rfg-*` CSS variables you can also override from your own CSS.
