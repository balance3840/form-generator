---
title: "Fields mapping (optional)"
sidebar_position: 5
---

The fields are send to the api endpoint specified in the config based on the `model` property inside the field in the schema.

Let's say you have a simple form with fields contaning the models `firstName` and `lastName`, the form generator will generate a request body similar to the following one:

```json
                
{
    "name": "FIELD_VALUE",
    "lastName": "FIELD_VALUE"
}
```

However, this will not always be the format the API will expect. The form generator offers a way to define a custom field mapping by passing an array. Following the previous example, let's say that now we want to put the `name` and `lastName` inside a `person` object.

This can be achieved using the following object structure:

```json
            
{
    "name": ["person.name"],
    "lastName": ["person.lastName"]
}
```

It is important to mention that you can map the same field to multiple objects/object property. Here is an example:

```json
            
{
    "name": ["person.name", "applicant.name"],
    "lastName": ["person.lastName", "person.familyName"]
}
```
