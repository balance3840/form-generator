---
title: "Layout"
sidebar_position: 7
---

The layout configuration is specified inside the layout property of the field in the form [schema](06-form-schema.md). Here is an example:

```json
                
{
    // Other field properties
    "layout": {
        "row": "row1", // Row where it should be displayed,
        "cols": 6, // Number of columns to display (from 1 to 12),
        "group": "applicant", // If the field is part of a group (Optional)
        "groupTitle": "Applicant details" // Title of the group (Optional)
    }
}
```
