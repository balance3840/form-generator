---
title: "Settings & action"
sidebar_position: 18
---

`settings`: `autofill` (`false` stops the browser from suggesting saved addresses and the like; a single field can do the same with `attributes.autocomplete: "off"`) `submitButtonText successMessage errorMessage formErrorMessage showTitle showProgress hideSubmitButton allowResubmit redirectUrl`, `afterSubmit` (`message`, `page`: the thank-you page, or `redirect`) and `redirectTarget` (`top`, default: an embedded form moves the whole page, with a Continue button when the browser refuses; `self`: only the frame), and for steps `stepsLayout stepsSide progressStyle showStepCount progressPosition stepHeader stepTransition stepNavigation firstStepTitle firstStepDescription firstStepImage firstStepImageAlt nextButtonText backButtonText saveDraft draftKey exitText exitUrl`, and for the step list `stepProgress sidebarHeader sidebarActions` (see [App-like flows](/document-reference/app-like-flows)).

`action` (optional): `endpoint httpMethod bearerToken headers formData webhookEndpoint recaptchaSiteKey mapping`. Without an endpoint the form just emits `submitted`.
