---
title: "Action"
sidebar_position: 4
---

The form action is defined in a JSON schema passed through the `action` attribute of the form generator component.

The properties that can be defined in this object are the following:

*   String `recaptchaSiteKey` - In case your backend endpoint is protected using reCAPTCHA.
*   String `httpMethod` - HTTP method of the endpoint
    *   default: POST
*   String `bearerToken` - Bearer token to be used in the endpoint (if endpoint requires authorization)
*   Boolean `formData` - The request body should be made using form-data
    *   default: false
*   String `endpoint` - Endpoint where the request should be sent
*   String `webhoookEndpoint` - Endpoint where the form events should be sent. List of events:
    *   submit.failed
*   String `formErrorMessage` - Message that should be shown when the validation fails (supports HTML)
*   String `submitButtonText` - Text the submit button should display (supports HTML)
*   String `successMessage` - Text the displayed in success alert after form submition
*   String `errorMessage` - Text the displayed in success alert after form submition in case of errors

An example of how this would look like:

```json
            
{
    "recaptchaSiteKey": "MY_SITE_KEY",
    "bearerToken": "MY_BEARER_TOKEN",
    "formData": true,
    "endpoint": "MY_API_ENDPOINT",
    "webhoookEndpoint": "MY_WEBHOOK_ENDPOINT",
    "formErrorMessage": "Please fix the errors in the form before submiting",
    "submitButtonText": "Send form"
}
```
