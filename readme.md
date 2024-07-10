Documentation
=============

Form generator
--------------

Guide for implementing and understanding the form generator web component library.

* * *

*   **Version:** 0.0.14
*   **Authors:** [Ramiro Estrella](https://github.com/balance3840) [Adrianna Wiącek](https://github.com/losica)

*   **Created:** 3 July, 2024
*   **Update:** 3 July, 2024

* * *

Installation
------------

Follow the steps below to setup the form generator in your website:

1.  Place the following scripts preferably just before the closing `body` tag in the HTML
    *   `<script type="module" src="https://unpkg.com/@restrella/form-generator@0.0.14/dist/form-generator/form-generator.esm.js"></script>`
    *   `<script nomodule src="https://unpkg.com/@restrella/form-generator@0.0.14/dist/form-generator/form-generator.js"></script>`
2.  Insert the `re-form-generator` tag where you want the component to be displayed
3.  You are good to go for adding your form schema now!

* * *

Basic Usage
-----------

The form generator follows a JSON schema structure to add fields and configuration to the form. Here is the sample for your reference:  

    
    <!DOCTYPE html>
    <html lang="en">
        <head>
        <title>Form Generator</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <script
            type="module"
            src="https://unpkg.com/@restrella/form-generator@0.0.14/dist/form-generator/form-generator.esm.js"
        ></script>
        <script
            nomodule
            src="https://unpkg.com/@restrella/form-generator@0.0.14/dist/form-generator/form-generator.js"
        ></script>
        </head>
        <body>
        <re-form-generator
            schema='[
            {
            "type": "input",
            "id": "name",
            "inputType": "text",
            "inputName": "name",
            "visible": true,
            "label": "Name",
            "model": "applicantName",
            "readonly": false,
            "disabled": false,
            "placeholder": "John",
            "validationType": "string",
            "validations": [
                {
                "name": "required",
                "params": [
                    "First name is a required field"
                ]
                }
            ],
            "layout": {
                "row": "row1",
                "cols": 6,
                "group": "applicant",
                "groupTitle": "Job application form"
            }
            },
            {
            "type": "input",
            "id": "lastName",
            "inputType": "text",
            "inputName": "lastName",
            "visible": true,
            "label": "Last name",
            "model": "applicantLastName",
            "readonly": false,
            "disabled": false,
            "placeholder": "Doe",
            "validationType": "string",
            "validations": [
                {
                "name": "required",
                "params": [
                    "Last name is a required field"
                ]
                }
            ],
            "layout": {
                "row": "row1",
                "cols": 6,
                "group": "applicant"
            }
            },
            {
            "type": "input",
            "id": "email",
            "inputType": "email",
            "inputName": "email",
            "visible": true,
            "label": "Email",
            "model": "applicantEmail",
            "readonly": false,
            "disabled": false,
            "placeholder": "john.doe@email.com",
            "validationType": "string",
            "validations": [
                {
                "name": "required",
                "params": [
                    "Email is a required field"
                ]
                },
                {
                "name": "email",
                "params": [
                    "The email is not in the right format"
                ]
                }
            ],
            "layout": {
                "group": "applicant"
            }
            },
            {
            "type": "select",
            "id": "position",
            "inputName": "position",
            "visible": true,
            "label": "What position are you applying for?",
            "model": "apllicationPosition",
            "readonly": false,
            "disabled": false,
            "placeholder": "Please select a position...",
            "defaultValue": "",
            "values": [
                {
                "value": 1,
                "display": "Chief Executive Officer (CEO)",
                "group": "Vacant positions"
                },
                {
                "value": 2,
                "display": "Chief Technology Officer (CTO)",
                "group": "Vacant positions"
                }
            ],
            "validationType": "number",
            "validations": [
                {
                "name": "required"
                }
            ],
            "layout": {
                "row": "row2",
                "group": "applicant",
                "cols": 6
            }
            },
            {
            "type": "input",
            "id": "availableDate",
            "inputType": "date",
            "inputName": "availableDate",
            "visible": true,
            "label": "Available date",
            "model": "availableDate",
            "readonly": false,
            "disabled": false,
            "validationType": "date",
            "validations": [
                {
                "name": "required",
                "params": ["Available date is required"]
                },
                {
                "name": "max",
                "params": ["2024-02-20", "You should be available before the the 20th of February"]
                }
            ],
            "layout": {
                "group": "applicant",
                "row": "row2",
                "cols": 6
            }
            },
            {
            "type": "input",
            "id": "referenceName",
            "inputType": "text",
            "inputName": "referenceName",
            "placeholder": "Martin",
            "visible": true,
            "label": "First name",
            "model": "referenceName",
            "readonly": false,
            "disabled": false,
            "validationType": "string",
            "validations": [
                {
                "name": "required"
                }
            ],
            "layout": {
                "group": "reference",
                "groupTitle": "Personal references",
                "row": "row3",
                "cols": 6
            }
            },
            {
            "type": "input",
            "id": "referenceLastName",
            "inputType": "text",
            "inputName": "referenceLastName",
            "placeholder": "Martin",
            "visible": true,
            "label": "Last name",
            "model": "referenceLastName",
            "readonly": false,
            "disabled": false,
            "validationType": "string",
            "validations": [
                {
                "name": "required"
                }
            ],
            "layout": {
                "group": "reference",
                "row": "row3",
                "cols": 6
            }
            }
        ]'
            action='{
            "httpMethod": "POST",
            "endpoint": "ENDPOINT",
            "bearerToken": "TOKEN",
            "formData": "true",
            "submitButtonText": "Apply now"
        }'
        >
        </re-form-generator>
        </body>
    </html>
              

* * *

Action
------

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

            `{     "recaptchaSiteKey": "MY_SITE_KEY",     "bearerToken": "MY_BEARER_TOKEN",     "formData": true,     "endpoint": "MY_API_ENDPOINT",     "webhoookEndpoint": "MY_WEBHOOK_ENDPOINT",     "formErrorMessage": "Please fix the errors in the form before submiting",     "submitButtonText": "Send form" }`
              
          

* * *

Fields mapping (optional)
-------------------------

The fields are send to the api endpoint specified in the config based on the `model` property inside the field in the schema.

Let's say you have a simple form with fields contaning the models `firstName` and `lastName`, the form generator will generate a request body similar to the following one:

                `{     "name": "FIELD_VALUE",     "lastName": "FIELD_VALUE" }`
                
            

However, this will not always be the format the API will expect. The form generator offers a way to define a custom field mapping by passing an array. Following the previous example, let's say that now we want to put the `name` and `lastName` inside a `person` object.

This can be achieved using the following object structure:

            `{     "name": ["person.name"],     "lastName": ["person.lastName"] }`
            
            

It is important to mention that you can map the same field to multiple objects/object property. Here is an example:

            `{     "name": ["person.name", "applicant.name"],     "lastName": ["person.lastName", "person.familyName"] }`
            
        

* * *

Form Schema
-----------

The `schema` attribute is basically the core of the component. In this, you can specify all the fields, layout, and validations that your form should contain.

Further in the doumentation we will conver the different type of fields and validations you can use in the form, for now let's just see an example of how a field looks like in the schema:

            `{   "type": "input",   "id": "name",   "inputType": "text",   "inputName": "name",   "visible": true,   "label": "Name",   "model": "applicantName",   "readonly": false,   "disabled": false,   "placeholder": "John",   "validationType": "string",   "validations": [     {       "name": "required",       "params": [         "First name is a required field"       ]     }   ] }`
            
          

These properties in the schema can vary based on the `type` and as mentioned before are going to be detailed individually. These are some of the most common properties that can be applied to the fields:

*   String `type` - Input field type. Accepted values:
    *   input
    *   textarea
    *   toggle
    *   select
    *   checkboxGroup
    *   radioGroup
    *   multiSelect
    *   countrySelect
    *   file
*   String `id` - id selector of the field
*   Boolean `visible` - Wether the field should be visible or not
*   String `label` - Field label (supports HTML)
*   String `model` - Object property name to be send to the API
*   Boolean `readonly` - Wether the field is read only or not
*   Boolean `disabled` - Wether the field is disabled or not
*   String `placeholder` - Field placeholder
*   String `validationType` - [Yup](https://www.npmjs.com/package/yup) validation type
    *   [string](https://www.npmjs.com/package/yup#string)
    *   [number](https://www.npmjs.com/package/yup#number)
    *   [date](https://www.npmjs.com/package/yup#date)
    *   [array](https://www.npmjs.com/package/yup#array)
    *   [mixed](https://www.npmjs.com/package/yup#mixed)
*   Array `validations` - Validations rule to apply based on [Yup](https://www.npmjs.com/package/yup) validation type (This is explained in [Validations](#formgenerator_validations) section)

* * *

Layout
------

The layout configuration is specified inside the layout property of the field in the form [schema](#formgenerator_schema). Here is an example:

                `{     // Other field properties     "layout": {         "row": "row1", // Row where it should be displayed,         "cols": 6, // Number of columns to display (from 1 to 12),         "group": "applicant", // If the field is part of a group (Optional)         "groupTitle": "Applicant details" // Title of the group (Optional)     } }`
                
            

* * *

Validations
-----------

Examples about how to implement some commonly used validations from [Yup](https://www.npmjs.com/package/yup) in the JSON schema. These validations must be implemented in the schema using a combination of String `validationType` and Array<any> `validations` properties.

### String

Examples about **string** `validationType` from [Yup](https://www.npmjs.com/package/yup)

Validation

Implementation

`string.required(message?: string | function): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "required",       "params": [         "This is a required field"       ]     }   ] }`
                
              

`string.nullable(message?: string | function): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "nullable",       "params": [       ]     }   ] }`
                
              

`string.length(limit: number | Ref, message?: string | function): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "length",       "params": [         15,         "The string should be exactly ${length} characters"       ]     }   ] }`                            
                
              

`string.min(limit: number | Ref, message?: string | function): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "min",       "params": [         10,         "The string should contain minimum ${min} characters"       ]     }   ] }`                                                       
                
              

`string.max(limit: number | Ref, message?: string | function): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "max",       "params": [         20,         "The string should contain maximum ${max} characters"       ]     }   ] }`                                                                             
                
              

`string.matches(regex: RegExp, message?: string | function): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "matches",       "params": [         "^[a-zA-Z0-9]*$", // Regex pattern         "The string should match the required pattern"       ]     }   ] }`    
                
              

`string.matches(regex: RegExp, options: { message: string, excludeEmptyString: bool }): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "matches",       "params": [         "^[a-zA-Z0-9]*$", // Regex pattern         {           "message": "The string should match the required pattern",           "excludeEmptyString": true         }       ]     }   ] }`
                
              

`string.email(message?: string | function): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "email",       "params": [         "The string should be a valid email address"       ]     }   ] }` 
                
              

`string.url(message?: string | function): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "url",       "params": [         "The string should be a valid URL"       ]     }   ] }`
                
              

`string.uuid(message?: string | function): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "uuid",       "params": [         "The string should be a valid UUID"       ]     }   ] }`  
                
              

`string.datetime(options?: {message?: string | function, allowOffset?: boolean, precision?: number})`

                `{   "validationType": "string",   "validations": [     {       "name": "datetime",       "params": [         {           "message": "The string should be a valid datetime",           "allowOffset": true,           "precision": 3         }       ]     }   ] }`
                
              

`string.datetime(message?: string | function)`

                `{   "validationType": "string",   "validations": [     {       "name": "datetime",       "params": [         "The string should be a valid datetime"       ]     }   ] }`
                
              

`string.ensure(): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "ensure",       "params": []     }   ] }`
                
              

`string.trim(message?: string | function): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "trim",       "params": [         "The string should not have leading or trailing whitespace"       ]     }   ] }`
                
              

`string.lowercase(message?: string | function): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "lowercase",       "params": [         "The string should be in lowercase"       ]     }   ] }`
                
              

`string.uppercase(message?: string | function): Schema`

                `{   "validationType": "string",   "validations": [     {       "name": "uppercase",       "params": [         "The string should be in uppercase"       ]     }   ] }`
                
              

### Number

Examples about **number** `validationType` from [Yup](https://www.npmjs.com/package/yup)

Validation

Implementation

`number.min(limit: number | Ref, message?: string | function): Schema`

                `{   "validationType": "number",   "validations": [     {       "name": "min",       "params": [         5,         "The number should be at least ${min}"       ]     }   ] }`
                
              

`number.max(limit: number | Ref, message?: string | function): Schema`

                `{   "validationType": "number",   "validations": [     {       "name": "max",       "params": [         100,         "The number should be at most ${max}"       ]     }   ] }`
                
              

`number.lessThan(max: number | Ref, message?: string | function): Schema`

                `{   "validationType": "number",   "validations": [     {       "name": "lessThan",       "params": [         50,         "The number should be less than ${less}"       ]     }   ] }`
                
              

`number.moreThan(min: number | Ref, message?: string | function): Schema`

                `{   "validationType": "number",   "validations": [     {       "name": "moreThan",       "params": [         10,         "The number should be more than ${more}"       ]     }   ] }`
                
              

`number.nullable(message?: string | function): Schema`

                `{   "validationType": "number",   "validations": [     {       "name": "nullable",       "params": []     }   ] }`
                
              

`number.positive(message?: string | function): Schema`

                `{   "validationType": "number",   "validations": [     {       "name": "positive",       "params": [         "The number should be positive"       ]     }   ] }`
                
              

`number.negative(message?: string | function): Schema`

                `{   "validationType": "number",   "validations": [     {       "name": "negative",       "params": [         "The number should be negative"       ]     }   ] }`
                
              

`number.integer(message?: string | function): Schema`

                `{   "validationType": "number",   "validations": [     {       "name": "integer",       "params": [         "The number should be an integer"       ]     }   ] }`
                
              

`number.truncate(): Schema`

                `{   "validationType": "number",   "validations": [     {       "name": "truncate",       "params": []     }   ] }`
                
              

`number.round(type: 'floor' | 'ceil' | 'trunc' | 'round' = 'round'): Schema`

                `{   "validationType": "number",   "validations": [     {       "name": "round",       "params": [         "round"       ]     }   ] }`
                
              

### Date

Examples about **date** `validationType` from [Yup](https://www.npmjs.com/package/yup)

Validation

Implementation

`date.min(limit: Date | string | Ref, message?: string | function): Schema`

                `{   "validationType": "date",   "validations": [     {       "name": "min",       "params": [         "2023-01-01", // Date limit         "The date should be later than ${min}"       ]     }   ] }`
                
              

`date.max(limit: Date | string | Ref, message?: string | function): Schema`

                `{   "validationType": "date",   "validations": [     {       "name": "max",       "params": [         "2024-01-01", // Date limit         "The date should be earlier than ${max}"       ]     }   ] }`
                
              

### Array

Examples about **array** `validationType` from [Yup](https://www.npmjs.com/package/yup)

Validation

Implementation

`array.json(): this`

                `{   "validationType": "array",   "validations": [     {       "name": "json",       "params": []     }   ] }`
                
              

`array.length(length: number | Ref, message?: string | function): this`

                `{   "validationType": "array",   "validations": [     {       "name": "length",       "params": [         5,         "The array should contain exactly ${length} items"       ]     }   ] }`
                
              

`array.min(limit: number | Ref, message?: string | function): this`

                `{   "validationType": "array",   "validations": [     {       "name": "min",       "params": [         2,         "The array should contain at least ${min} items"       ]     }   ] }`
                
              

`array.max(limit: number | Ref, message?: string | function): this`

                `{   "validationType": "array",   "validations": [     {       "name": "max",       "params": [         10,         "The array should contain at most ${max} items"       ]     }   ] }`
                
              

`array.ensure(): this`

                `{   "validationType": "array",   "validations": [     {       "name": "ensure",       "params": []     }   ] }`
                
              

`array.compact(rejector: (value) => boolean): Schema`

                `{   "validationType": "array",   "validations": [     {       "name": "compact",       "params": [         "function(value) { return value === null; }"       ]     }   ] }`
                
              

### Mixed

Examples about **mixed** `validationType` from [Yup](https://www.npmjs.com/package/yup)

Validation

Implementation

`mixed.required(message?: string | function): Schema`

                `{   "validationType": "mixed",   "validations": [     {       "name": "required",       "params": [         "This field is required"       ]     }   ] }`
                
              

`mixed.oneOf(arrayOfValues: Array, message?: string | function): Schema`

                `{   "validationType": "mixed",   "validations": [     {       "name": "oneOf",       "params": [         [1, 2, 3], // Example array of valid values         "The value must be one of ${values}"       ]     }   ] }`
                
              

`mixed.notOneOf(arrayOfValues: Array, message?: string | function): Schema`

                `{   "validationType": "mixed",   "validations": [     {       "name": "notOneOf",       "params": [         [1, 2, 3], // Example array of invalid values         "The value must not be one of ${values}"       ]     }   ] }`
                
              

`mixed.equals(arrayOfValues: Array, message?: string | function): Schema`

                `{   "validationType": "mixed",   "validations": [     {       "name": "equals",       "params": [         [1, 2, 3], // Example array of equal values         "The value must be equal to one of ${values}"       ]     }   ] }`
                
              

`mixed.notEquals(arrayOfValues: Array, message?: string | function): Schema`

                `{   "validationType": "mixed",   "validations": [     {       "name": "notEquals",       "params": [         [1, 2, 3], // Example array of not equal values         "The value must not be equal to one of ${values}"       ]     }   ] }`
                
              

`mixed.default(value: any): Schema`

                `{   "validationType": "mixed",   "validations": [     {       "name": "default",       "params": [         "default value"       ]     }   ] }`
                
              

`mixed.nullable(isNullable?: boolean): Schema`

                `{   "validationType": "mixed",   "validations": [     {       "name": "nullable",       "params": [         true // Allows the value to be null       ]     }   ] }`
                
              

Schema fields
-------------

Form schema allows following components to be generated:

*   [Input](#formgenerator_input)
*   [Checkbox group](#formgenerator_checkbox_group)
*   [Country select](#formgenerator_country_select)
*   [File drag and drop](#formgenerator_file_input)
*   [Multiselect](#formgenerator_multiselect)
*   [Radio group](#formgenerator_radio)
*   [Select](#formgenerator_select)
*   [Textarea](#formgenerator_textarea)
*   [Toggle](#formgenerator_toggle)

Input
-----

Input field allow following `inputType` values in the form schema:

*   [checkbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox)
*   [color](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color)
*   [date](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date)
*   [datetime-local](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/datetime-local)
*   [email](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email)
*   [month](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/month)
*   [number](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number)
*   [password](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/password)
*   [range](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range)
*   [tel](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/tel)
*   [text](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/text)
*   [time](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/time)
*   [url](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/url)
*   [week](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/week)

If you want to specify any attirbutte that given input type supports natively you can do it in the schema using `attributtes` property. For example, if you want an `inputType` week to have the attibutes `min` and `max`, you can do it as follow:

    
    {
      // Other field properties
      "inputType": "week",
      "attributes": {
        "min": "2024-W1",
        "max": "2024-W10"
      }
    }
        

* * *

### Checkbox

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "checkbox-field",
        "inputType": "checkbox",
        "inputName": "checkbox-name",
        "visible": "true",
        "label": "Checkbox field",
        "model": "checkboxField"
      }]'>
    </re-form-generator>
    

* * *

### Color

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "color-field",
        "inputType": "color",
        "inputName": "color-name",
        "visible": "true",
        "label": "Color field",
        "model": "colorField"
        "defaultValue": "#FFC0CB"
      }]'>
    </re-form-generator>
    

* * *

### Date

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "date-field",
        "inputType": "date",
        "inputName": "date-name",
        "visible": "true",
        "label": "Date field",
        "model": "dateField"
      }]'>
    </re-form-generator>
    

* * *

### Datetime-local

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "datetime-local-field",
        "inputType": "datetime-local",
        "inputName": "datetime-local-name",
        "visible": "true",
        "label": "Datetime-local field",
        "model": "datetime-localField"
      }]'>
    </re-form-generator>
    

* * *

### Email

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "email-field",
        "inputType": "email",
        "inputName": "email-name",
        "visible": "true",
        "label": "Email field",
        "model": "emailField",
        "placeholder": "example@example.com"
      }]'>
    </re-form-generator>
    

* * *

### Month

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "month-field",
        "inputType": "month",
        "inputName": "month-name",
        "visible": "true",
        "label": "Month field",
        "model": "monthField"
      }]'>
    </re-form-generator>
    

* * *

### Number

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "number-field",
        "inputType": "number",
        "inputName": "number-name",
        "visible": "true",
        "label": "<h1>I also support HTML</h1>",
        "model": "numberField",
        "defaultValue": 69
      }]'>
    </re-form-generator>
    

* * *

### Password

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "password-field",
        "inputType": "password",
        "inputName": "password-name",
        "visible": "true",
        "label": "Password field",
        "model": "passwordField"
      }]'>
    </re-form-generator>
    

* * *

### range

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "range-field",
        "inputType": "range",
        "inputName": "range-name",
        "visible": "true",
        "label": "Range field",
        "model": "rangeField",
        "attributes": {
          "min": 0,
          "max": 100,
          "step": 10
        },
        "defaultValue": 50
      }]'>
    </re-form-generator>
    

* * *

### Tel

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "phone-field",
        "inputType": "tel",
        "inputName": "phone-name",
        "visible": "true",
        "label": "Phone field",
        "model": "phoneField",
        "attributes": {
          "pattern":"[0-9]{3}-[0-9]{3}-[0-9]{4}"
        }
      }]'>
    </re-form-generator>
    

* * *

### text

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "text-field",
        "inputType": "text",
        "inputName": "text-name",
        "visible": "true",
        "label": "Text field",
        "model": "textField",
        "defaultValue": "This is a disabled and readonly field",
        "readonly": true,
        "disabled": true
      }]'>
    </re-form-generator>
    

* * *

### Time

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "time-field",
        "inputType": "time",
        "inputName": "time-name",
        "visible": "true",
        "label": "Time field",
        "model": "timeField"
      }]'>
    </re-form-generator>
    

* * *

### Url

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "url-field",
        "inputType": "url",
        "inputName": "url-name",
        "visible": "true",
        "label": "Url field",
        "model": "urlField"
      }]'>
    </re-form-generator>
    

* * *

### Week

    
    <re-form-generator
      schema='[{
        "type": "input",
        "id": "week-field",
        "inputType": "week",
        "inputName": "week-name",
        "visible": "true",
        "label": "Week field",
        "model": "weekField"
      }]'>
    </re-form-generator>
    

* * *

Checkbox group
--------------

Checkbox group is an input field that allows multiple items selection from pre-defined selection options.

Available radio buttons can be defined in the `items` property.

When it comes to the default values, they can defined with the `checked` property in the `attributes` array. For instance:

    
    {
      // Other field properties
      "items": [
        {
          "label": "Checkbox option 1",
          "value": "check-option-1",
          "attributes": {
            "checked": true
          }
        },
        {
          "label": "Checkbox option 2",
          "value": "check-option-2",
          "attributes": {
            "checked": true
          }
        },
        {
          "label": "Checkbox option 3",
          "value": "check-option-3"
        }
      ]
    }
                          

### Checkbox group

    
    <re-form-generator
      schema='[{
        "type": "checkboxGroup",
        "inputType": "object",
        "id": "checkbox-group",
        "inputName": "checkbox-group",
        "visible": true,
        "label": "Checkbox Group",
        "model": "checkboxOptions",
        "items": [
          {
            "label": "Checkbox option 1",
            "value": "check-option-1",
            "attributes": {
              "checked": true
            }
          },
          {
            "label": "Checkbox option 2",
            "value": "check-option-2",
            "attributes": {
              "checked": true
            }
          },
          {
            "label": "Checkbox option 3",
            "value": "check-option-3"
          }
        ]
      }]'>
    </re-form-generator>
              

* * *

Country select
--------------

Country select field allow selecting country or dial code. Countries are searchable by their names and dial codes. The `modelValueKey` property defines which value is selected: `name`, `dialCode` or `code`. The `inputDisplayKey` property is resposible for the value that is displayed after country selection. To specify `defaultValue` use lowercase country ISO code, for example, `"defaultValue": "dk"`.

### Country select

    
    <re-form-generator
      schema='[{
        "type": "countrySelect",
        "id": "country",
        "inputName": "country",
        "visible": true,
        "label": "Country",
        "model": "country",
        "modelValueKey": "code",
        "placeholder": "Select country",
        "layout": {
            "row": "row1",
            "cols": 6
        }
      }]'>
    </re-form-generator>
          

* * *

### Dial code

    
    <re-form-generator
      schema='[{
        "type": "countrySelect",
        "id": "dial_code",
        "inputName": "dial_code",
        "visible": true,
        "label": "Dial code",
        "model": "dial_code",
        "defaultValue": "dk",
        "modelValueKey": "dialCode",
        "inputDisplayKey": "dialCode",
        "showDialCode": true,
        "placeholder": "Select dial code",
        "layout": {
            "row": "row1",
            "cols": 4
        }
      }]'>
    </re-form-generator>
          

* * *

File drag and drop
------------------

File drag and dropdown input field let the user choose one or more files from their device storage. On default single file selection is allowed. To enable multiple file selection or to control allowed file types, specify the `attributes` property. For instance:

    
    {
      // Other field properties
      "attributes": {
        "multiple": true,
        "accept": "image/*,.pdf"
      }
    }
            

Text displayed in the dropdown zone can be changed by defining `textTitle`, `subTitle` and `placeholder` properties.

    
    {
      {
        // Other field properties
        "textTitle":  "Custom title",
        "subTitle": "Custom subtitle",
        "placeholder": "Placeholder"
      }
    }
                          

### File input

    
    <re-form-generator
      schema='[{
        "type": "file",
        "inputType": "file",
        "label": "Documents",
        "id": "documents",
        "inputName": "documents",
        "visible": "true",
        "model": "documents"
      }]'>
    </re-form-generator>
          

* * *

### File input - custom attributes

    
    <re-form-generator
      schema='[{
        "type": "file",
        "inputType": "file",
        "label": "Documents",
        "id": "documents",
        "inputName": "documents",
        "visible": "true",
        "model": "documents",
        "textTitle":  "Custom title",
        "subTitle": "Custom subtitle",
        "placeholder": "Placeholder",
        "attributes": {
            "multiple": true,
            "accept": "image/*,.pdf"
        }
      }]'>
    </re-form-generator>
          

* * *

Multiselect
-----------

Multiselect is an input field that allows multiple items to be selected. Available selection options should be defined in the `values` property. For instance:

    
    {
      // Other field properties
      "values": [
        {
          "value": 1,
          "display": "Option 1",
          "group": "options"
        },
        {
          "value": 2,
          "display": "Option 2",
          "group": "options"
        },
        {
          "value": 3,
          "display": "Option 3",
          "group": "options"
        }
      ]
    }
          

When it comes to the default values, they are controlled through `defaultOptions`, specifing indices of values that should be pre-selected. For example:

    
    {
      // Other field properties
      "defaultOptions": [0, 1]
    }
                      

### Multiselect

    
    <re-form-generator
      schema='[{
      "type": "multiSelect",
      "id": "multiselect",
      "inputName": "options",
      "inputType": "number",
      "visible": true,
      "label": "Multiselect",
      "model": "options",
      "placeholder": "Select options",
      "values": [
          {
            "value": 1,
            "display": "Option 1",
            "group": "options"
          },
          {
            "value": 2,
            "display": "Option 2",
            "group": "options"
          },
          {
            "value": 3,
            "display": "Option 3",
            "group": "options"
          }
      ]
      }]'>
    </re-form-generator>
          

* * *

Radio group
-----------

Radio group is an input field that allows single value selection from pre-defined radio buttons. Selecting any radio button automatically deselects any other currently-selected radio button.

Available radio buttons can be defined in the `items` property.

When it comes to the default value, it is defined with the `checked` property in the `attributes` array. For instance:

    
    {
      // Other field properties
      "items": [
        {
          "label": "Radio 1",
          "value": "radio-1"
        },
        {
          "label": "Radio 2",
          "value": "radio-2",
          "attributes": {
            "checked": true
          }
        },
        {
          "label": "Radio 3",
          "value": "radio-3"
        }
      ]
    }
                      

### Radio group

    
    <re-form-generator
      schema='[{
        "type": "radioGroup",
        "inputType": "radio",
        "id": "radio-group",
        "inputName": "radio-group",
        "visible": true,
        "label": "Radio Group",
        "model": "radioOption",
        "items": [
          {
            "label": "Radio 1",
            "value": "radio-1"
          },
          {
            "label": "Radio 2",
            "value": "radio-2",
            "attributes": {
              "checked": true
            }
          },
          {
            "label": "Radio 3",
            "value": "radio-3"
          }
        ]
      }]'>
    </re-form-generator>
          

* * *

Select
------

Select is an input field that allows an item to be selected out of pre-defined options. Available selection options should be defined in the `values` property. Each `value` object should be described by following attributes: `value`, `display` and `group`. For instance:

    
    {
      // Other field properties
      "values": [
        {
          "value": "one",
          "display": "Option 1",
          "group": "options"
        },
        {
          "value": "two",
          "display": "Option 2",
          "group": "options"
        },
        {
          "value": "three",
          "display": "Option 3",
          "group": "options"
        }
      ]
    }
          

When it comes to the default value, it is controlled through `defaultValue`, specifing of `value` property of the option that should be pre-selected. For example:

    
    {
      // Other field properties
      "defaultValue": "one"
    }
                      

### Select

    
    <re-form-generator
      schema='[{
        "type": "select",
        "id": "select",
        "inputName": "options",
        "visible": true,
        "label": "Select",
        "model": "selectOption",
        "readonly": false,
        "disabled": false,
        "placeholder": "Please select an option...",
        "defaultValue": "two",
        "values": [
          {
            "value": "one",
            "display": "Option 1",
            "group": "Options"
          },
          {
            "value": "two",
            "display": "Option 2",
            "group": "Options"
          },
          {
            "value": "three",
            "display": "Option 3",
            "group": "Options"
          }
        ]
      }]'>
    </re-form-generator>
          

* * *

Textarea
--------

Textarea is an input field that allows for multi-line text.

Textarea attributes like `maxlength` or `rows` can be deffined in the `attributes` property in a following way:

      `{   // Other field properties   "attributes": {     "maxlength": 20,     "rows": 2   } }`
      
    

### Textarea

    
    <re-form-generator
      schema='[{
        "type": "textarea",
        "id": "long-text",
        "inputName": "long-text",
        "visible": true,
        "label": "Textarea",
        "model": "longText",
        "readonly": false,
        "disabled": false,
        "placeholder": "Please feed me with some text...",
        "attributes": {
          "maxlength": 20,
          "rows": 2
        }
      }]'>
    </re-form-generator>
          

* * *

Toggle
------

The toggle input is used to choose one of two values.

The `inputType` and `validationType` should be defined as `boolean`.

    
    {
      // Other field properties
      "inputType": "boolean",
      "validationType": "boolean"
    }
          

### Toggle

    
    <re-form-generator
      schema='[{
        "type": "toggle",
        "id": "toggle-input",
        "inputType": "boolean",
        "inputName": "is-on",
        "visible": true,
        "label": "Do you want subscribe?",
        "model": "isOn",
        "validationType": "boolean",
        "defaultValue": true,
        "attributes": {
          "value": true
        }
      }]'>
    </re-form-generator>
          

* * *

Events
------

Name

Description

Code Example

`submitted`

Event emitted when the form is submitted. When form action is not defined, event will emit all form values, otherwise, if action is defined, the response of the request will be passed as an argument of the callback.

    
    <script>
      const formGenerator = document.querySelector('re-form-generator');
      formGenerator.addEventListener('submitted', event => { 
        console.log(event.detail);
      });
    </script>
        

`validationError`

In the submit process when there are errors this event is emitted.

    
    <script>
      const formGenerator = document.querySelector('re-form-generator');
      formGenerator.addEventListener('validationError', event => { 
        console.log(event.detail);
      });
    </script>
        

`valueChanged`

Event is emitted every time when form input data changes.

    
    <script>
      const formGenerator = document.querySelector('re-form-generator');
      formGenerator.addEventListener('valueChanged', event => { 
        console.log(event.detail);
      });
    </script>
        

* * *

Methods
-------

Name

Description

Code Example

`updateValue`

Updates the value of the model.

    
    <script>
      const formGenerator = document.querySelector('re-form-generator');
      formGenerator.addEventListener('valueChanged', event => { 
        const field = event.detail;
        const { birthday } = field;
        if (birthday) {
          const parts = birthday.split('-');
          const [year, month, date] = parts;
          formGenerator.updateValue('year', year);
          formGenerator.updateValue('month', month);
          formGenerator.updateValue('date', date);
        }
      });
    </script>
              

`submit`

It will submit the form with its values and will trigger the `submitted` event.

    
    <script>
      const formGenerator = document.querySelector('re-form-generator');
      formGenerator.submit();
    </script>
              

`validate`

Validates the form. In case of errors, the `validationError` event will be emitted.

    
    <script>
      const formGenerator = document.querySelector('re-form-generator');
      formGenerator.validate();
    </script>
              

* * *

Styles
------

You can overwrite default input fields style. For example:

            `.input__label {   font-size: 20px !important;   color: blue;   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }  .submit-container__button {   background-color: blue !important; }`      
            
          

### Default styling

#### Form generator

    
    .input__description {
      color: #6c757d;
      font-size: 13px;
      margin: 0;
    }
    .re-form-generator {
      width: calc(100% - 40px);
      border: 1px solid #000 3b;
      padding: 20px;
      border-radius: 20px;
      background: #fff;
      /* Rounded sliders */
    }
    .re-form-generator .select-input {
      position: relative;
      appearance: none;
      -webkit-appearance: none;
      width: 100%;
      font-size: 14px;
      height: 44px;
      padding: 0.675em 6em 0.675em 1em;
      background-color: #fff;
      border: 1px solid #caced1;
      border-radius: 0.25rem;
      color: #000;
      cursor: pointer;
    }
    .re-form-generator .select-input::after, .re-form-generator .select-input::before {
      content: "";
      position: absolute;
      right: 1rem;
      pointer-events: none;
    }
    .re-form-generator .select-input::before {
      border-left: 0.3rem solid transparent;
      border-right: 0.3rem solid transparent;
      border-bottom: 0.3rem solid black;
      top: 40%;
    }
    .re-form-generator .select-input::after {
      border-left: 0.3rem solid transparent;
      border-right: 0.3rem solid transparent;
      border-top: 0.3rem solid black;
      top: 55%;
    }
    .re-form-generator .group-title {
      font-size: 24px;
      padding-bottom: 6px;
      margin-bottom: 20px;
      border-bottom: 1px solid #cbd5e1;
    }
    .re-form-generator textarea {
      resize: none;
      height: 90px;
      font-size: 14px;
      line-height: 17px;
      color: #252733;
      background: #fafafa;
      padding: 12px;
      border: 1px solid #e3e8eb;
      border-radius: 5px;
      width: 100%;
      font-size: 14px;
      color: #252733;
      box-sizing: border-box;
      font-family: inherit;
    }
    .re-form-generator .input-text, .re-form-generator .input-email, .re-form-generator .input-date, .re-form-generator .input-number, .re-form-generator .select-input {
      background: #fafafa;
      padding: 12px;
      border: 1px solid #e3e8eb;
      border-radius: 5px;
      width: 100%;
      font-size: 14px;
      color: #252733;
      box-sizing: border-box;
      font-family: inherit;
      height: 43px;
    }
    .re-form-generator .input-text.input-checkbox, .re-form-generator .input-email.input-checkbox, .re-form-generator .input-date.input-checkbox, .re-form-generator .input-number.input-checkbox, .re-form-generator .select-input.input-checkbox {
      height: 18px;
      width: 18px;
      background-color: #eee;
      margin: 0;
    }
    .re-form-generator .row-container {
      display: flex;
      gap: 10px;
      flex-grow: 12;
    }
    @media (max-width: 768px) {
      .re-form-generator .row-container {
        display: block;
      }
    }
    .re-form-generator .row-container .col-1 {
      width: calc((100% / 12) * 1);
    }
    .re-form-generator .row-container .col-2 {
      width: calc((100% / 12) * 2);
    }
    .re-form-generator .row-container .col-3 {
      width: calc((100% / 12) * 3);
    }
    .re-form-generator .row-container .col-4 {
      width: calc((100% / 12) * 4);
    }
    .re-form-generator .row-container .col-5 {
      width: calc((100% / 12) * 5);
    }
    .re-form-generator .row-container .col-6 {
      width: calc((100% / 12) * 6);
    }
    .re-form-generator .row-container .col-7 {
      width: calc((100% / 12) * 7);
    }
    .re-form-generator .row-container .col-8 {
      width: calc((100% / 12) * 8);
    }
    .re-form-generator .row-container .col-9 {
      width: calc((100% / 12) * 9);
    }
    .re-form-generator .row-container .col-10 {
      width: calc((100% / 12) * 10);
    }
    .re-form-generator .row-container .col-11 {
      width: calc((100% / 12) * 11);
    }
    .re-form-generator .row-container .col-12 {
      width: calc((100% / 12) * 12);
    }
    @media (max-width: 768px) {
      .re-form-generator .row-container .col-1 {
        width: 100%;
      }
      .re-form-generator .row-container .col-2 {
        width: 100%;
      }
      .re-form-generator .row-container .col-3 {
        width: 100%;
      }
      .re-form-generator .row-container .col-4 {
        width: 100%;
      }
      .re-form-generator .row-container .col-5 {
        width: 100%;
      }
      .re-form-generator .row-container .col-6 {
        width: 100%;
      }
      .re-form-generator .row-container .col-7 {
        width: 100%;
      }
      .re-form-generator .row-container .col-8 {
        width: 100%;
      }
      .re-form-generator .row-container .col-9 {
        width: 100%;
      }
      .re-form-generator .row-container .col-10 {
        width: 100%;
      }
      .re-form-generator .row-container .col-11 {
        width: 100%;
      }
      .re-form-generator .row-container .col-12 {
        width: 100%;
      }
    }
    .re-form-generator .input__label {
      font-weight: 700;
      font-size: 14px;
      line-height: 20px;
      margin-bottom: 12px;
      display: inline-block;
    }
    .re-form-generator .error-message {
      font-size: 12px;
      color: #ff6868;
    }
    .re-form-generator .switch {
      position: relative;
      display: inline-block;
      width: 45px;
      height: 25px;
    }
    .re-form-generator .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .re-form-generator .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #83888f;
      transition: 0.4s;
      transition: 0.4s;
    }
    .re-form-generator .slider:before {
      position: absolute;
      content: "";
      height: 21px;
      width: 21px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: 0.4s;
      transition: 0.4s;
    }
    .re-form-generator input:checked + .slider {
      background-color: #2196f3;
    }
    .re-form-generator input:checked + .slider:before {
      transform: translateX(20px);
    }
    .re-form-generator input:focus + .slider {
      box-shadow: 0 0 1px #2196f3;
    }
    .re-form-generator .slider.round {
      border-radius: 34px;
    }
    .re-form-generator .slider.round:before {
      border-radius: 50%;
    }
    .re-form-generator .input-group {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 0 0 16px 0;
      font-weight: 700;
      font-size: 14px;
      line-height: 20px;
    }
    .re-form-generator .input-group.hasErrors input, .re-form-generator .input-group.hasErrors .multi-select, .re-form-generator .input-group.hasErrors .select-input {
      border: 1.5px solid #ff6868;
      border-radius: 5px;
    }
    .re-form-generator .input-group.hasErrors .file-field-container {
      border: 1.5px solid #ff6868;
      border-radius: 5px;
    }
    .re-form-generator .input-group.input-checkbox-container {
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
      justify-content: start;
      gap: 0.5rem;
    }
    .re-form-generator .input-group.input-checkbox-container .input__label {
      margin-bottom: 0px;
      margin-left: 6px;
      font-weight: normal;
    }
    .re-form-generator .input-group.input-checkbox-container .error-message {
      flex-basis: 100%;
      position: absolute;
      bottom: 0px;
    }
    .re-form-generator .input-group.input-checkbox-container.hasErrors {
      margin-bottom: 16px;
    }
    .re-form-generator .input-group.input-checkboxGroup-container .checkboxGroup .label {
      margin-bottom: 0px;
      margin-left: 6px;
      font-weight: normal;
    }
    .re-form-generator .input-group.two-columns {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }
    .re-form-generator .submit-container {
      display: flex;
      margin-top: 16px;
    }
    .re-form-generator .submit-container__button {
      padding: 10px 20px;
      font-size: 16px;
      border: none;
      border-radius: 5px;
      background-color: #2196f3;
      color: #fff;
      cursor: pointer;
      transition: background-color 0.3s ease;
      width: 100%;
    }
    .re-form-generator .submit-container__button:hover {
      background-color: #1565c0;
    }
    .re-form-generator .radioGroup {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .re-form-generator .radioGroup-element {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      align-items: center;
    }
    .re-form-generator .radioGroup-element .label {
      font-weight: normal;
    }
    .re-form-generator .radioGroup .input-radio {
      padding: 2px;
      margin: 0;
    }
    .re-form-generator .hidden {
      display: none;
    }
    .re-form-generator .form-error-message {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .re-form-generator .form-error-message__message {
      color: #ff6868;
      font-size: 12px;
      font-weight: 700;
    }
          

#### File input

        `re-file-input-field .file-field-container {   width: 100%;   display: flex; } re-file-input-field .file-field-container .file-dropzone {   width: 100%;   height: 16rem;   border: 1px dashed #e3e8eb;   border-radius: 5px;   background-color: #fafafa;   cursor: pointer;   display: flex;   flex-direction: column;   align-items: center;   justify-content: center;   transition: background-color 0.3s, border-color 0.3s; } re-file-input-field .file-field-container .file-dropzone.hover {   background-color: #e5e7eb;   border-color: #9ca3af; } re-file-input-field .file-field-container .file-dropzone.hover .dropzone-icon, re-file-input-field .file-field-container .file-dropzone.hover .dropzone-text, re-file-input-field .file-field-container .file-dropzone.hover .dropzone-subtext {   color: #252733; } re-file-input-field .file-field-container .file-dropzone:hover {   background-color: #f9fafb; } re-file-input-field .file-field-container .file-dropzone:hover .dropzone-icon {   color: #9ca3af; } re-file-input-field .file-field-container .file-dropzone:hover .dropzone-text, re-file-input-field .file-field-container .file-dropzone:hover .dropzone-subtext {   color: #6b7280; } re-file-input-field .file-field-container .file-dropzone.dark {   background-color: #374151;   border-color: #4b5563; } re-file-input-field .file-field-container .file-dropzone.dark:hover {   background-color: #4b5563;   border-color: #6b7280; } re-file-input-field .file-field-container .file-dropzone.dark .dropzone-icon, re-file-input-field .file-field-container .file-dropzone.dark .dropzone-text, re-file-input-field .file-field-container .file-dropzone.dark .dropzone-subtext {   color: #9ca3af; } re-file-input-field .file-field-container .file-dropzone .dropzone-content {   display: flex;   flex-direction: column;   align-items: center;   justify-content: center;   padding-top: 1.25rem;   padding-bottom: 1.5rem;   font-weight: normal; } re-file-input-field .file-field-container .file-dropzone .dropzone-icon {   width: 2rem;   height: 2rem;   margin-bottom: 1rem;   color: #6b7280;   transition: color 0.3s; } re-file-input-field .file-field-container .file-dropzone .dropzone-text {   margin-bottom: 0.5rem;   color: #6b7280;   transition: color 0.3s;   display: flex;   gap: 8px;   flex-direction: column;   align-items: center;   justify-content: center; } re-file-input-field .file-field-container .file-dropzone .dropzone-text .file-element {   display: flex;   gap: 8px;   color: #252733; } re-file-input-field .file-field-container .file-dropzone .font-bold {   font-weight: bold; } re-file-input-field .file-field-container .file-dropzone .dropzone-subtext {   font-size: 0.8rem;   color: #6b7280;   transition: color 0.3s; } re-file-input-field .file-field-container .file-dropzone .remove-file {   width: 20px;   height: 20px;   border-radius: 50%;   background-color: #ff6868;   color: white;   text-align: center;   line-height: 20px;   font-size: 14px;   font-weight: bold; } re-file-input-field .file-field-container .file-dropzone .file-name {   font-weight: bold;   max-width: 250px;   text-overflow: ellipsis;   overflow: hidden;   white-space: nowrap; }`
        
      

#### Multiselect

    
    re-multi-select .multi-select {
      position: relative;
      width: 100%;
      background: #fafafa;
      font-weight: normal;
    }
    re-multi-select .multi-select__header {
      padding: 10px;
      border: 1px solid #e3e8eb;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      border-radius: 5px;
    }
    re-multi-select .multi-select__header.disabled {
      pointer-events: none;
      background-color: #ddd;
    }
    re-multi-select .multi-select__header .selected_options {
      display: flex;
      justify-content: row;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    re-multi-select .multi-select__header .selected_options__option {
      background-color: #2196f3;
      border-radius: 5px;
      color: #fff;
      padding: 0rem 0.5rem;
      font-size: 11px;
      font-weight: 400;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }
    re-multi-select .multi-select__header .selected_options__option-close {
      padding: 0 0.25rem;
    }
    re-multi-select .multi-select__options {
      position: absolute;
      width: calc(100% - 2px);
      border: 1px solid #e3e8eb;
      border-top: none;
      max-height: 150px;
      overflow-y: auto;
      background: #fff;
      z-index: 1;
      margin: 0;
      padding: 0;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
    }
    re-multi-select .multi-select__option {
      padding: 10px;
      cursor: pointer;
    }
    re-multi-select .multi-select__option.selected {
      background-color: #f0f0f0;
    }
    re-multi-select .multi-select__option:not(.selected):hover {
      background-color: #2196f3;
      color: #fff;
    }
    re-multi-select .multi-select__option:last-of-type {
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
    }
    re-multi-select .multi-select .arrow-up::before {
      content: '▲';
    }
    re-multi-select .multi-select .arrow-down::before {
      content: '▼';
    }
    re-multi-select .multi-select .arrow {
      font-size: 0.63rem;
      padding: 0 0.25rem;
    }     
          

#### Country select

        `re-form-generator re-country-select .country-select-input-wrapper {   position: relative;   width: 100%;   height: 43px; } re-form-generator re-country-select .country-select-input-wrapper .dropdown-container {   position: absolute;   width: 100%;   max-height: 300px;   background: #fff; } re-form-generator re-country-select .country-select-input-wrapper .dropdown-container::-webkit-scrollbar {   display: none; } re-form-generator re-country-select .country-select-input-wrapper .dropdown-container .selected-country-wrapper {   position: relative;   font-size: 14px;   font-weight: normal;   width: 100%;   height: 100%;   pointer-events: none;   display: block; } re-form-generator re-country-select .country-select-input-wrapper .dropdown-container .selected-country-wrapper .selected-flag {   transform: translateY(-50%) scale(0.8);   width: 24px;   position: absolute;   left: 10px;   top: 20px;   display: block; } re-form-generator re-country-select .country-select-input-wrapper .dropdown-container .selected-country-wrapper .selected-country-value {   position: absolute;   top: 11px;   left: 40px;   overflow: hidden;   text-overflow: ellipsis;   width: -webkit-fill-available;   text-wrap: nowrap;   margin-right: 5px;   display: block; } re-form-generator re-country-select .country-select-input-wrapper .dropdown-container .selected-country-wrapper.hidden {   display: none; } re-form-generator re-country-select .country-select-input-wrapper .country-search {   width: 100%;   box-sizing: border-box;   border: 1px solid #e3e8eb;   padding: 10px;   text-indent: 26px;   border-radius: 5px;   height: 43px;   font-family: unset;   text-indent: 26px;   background: #fafafa; } re-form-generator re-country-select .country-select-input-wrapper .country-search input::placeholder {   font-family: unset; } re-form-generator re-country-select .country-select-input-wrapper .country-search.no-indent {   text-indent: 0px; } re-form-generator re-country-select .country-select-input-wrapper input::placeholder {   font-family: 'Times-Roman'; } re-form-generator re-country-select .country-select-input-wrapper .dropdown {   position: absolute;   top: 40px;   width: 100%;   border: 1px solid #e3e8eb;   background-color: white;   overflow-y: auto;   display: none; } re-form-generator re-country-select .country-select-input-wrapper .dropdown-item {   padding: 10px;   cursor: pointer;   border: 0.5px solid #e3e8eb;   border-top: 0px;   background: #fff;   font-weight: normal; } re-form-generator re-country-select .country-select-input-wrapper .dropdown-item:last-of-type {   border-bottom: 0px; } re-form-generator re-country-select .country-select-input-wrapper .dropdown-item:hover {   background: #f0f0f0; } re-form-generator re-country-select .country-select-input-wrapper .flag {   width: 20px;   height: 15px;   margin-right: 10px; } re-form-generator re-country-select .country-select-input-wrapper .country-select-dropdown-wrapper {   overflow-y: scroll;   max-height: 200px;   border-bottom: 1px solid #e3e8eb;   border-bottom-left-radius: 5px;   border-bottom-right-radius: 5px; } re-form-generator re-country-select .country-select-input-wrapper .country-select-dropdown-wrapper::-webkit-scrollbar {   display: none; }`
        
      

* * *

Changelog
---------

See what's new added, changed, fixed, improved or updated in the latest versions.

### Version 0.0.14 (4 July, 2024)

*   AddedInitial version

*   [](https://twitter.com/harnishdesign/)
*   [](http://www.facebook.com/harnishdesign/)
*   [](http://www.dribbble.com/harnishdesign/)
*   [](http://www.github.com/)

Copyright © 2020 [iDocs](http://www.harnishdesign.net/idocs-one-page-documentation-html-template/). All Rights Reserved.

Design & Develop by [HarnishDesign](http://www.harnishdesign.net/).

[](javascript:void(0) "Back to Top")