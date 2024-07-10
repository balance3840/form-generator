import * as yup from 'yup';

export function createYupSchema(fields, recaptchaValidation = false) {
    const fieldsRules = {};

    // Recaptcha validator

    if (recaptchaValidation) {
      const recatpchaValidator = yup.string().required();
      fieldsRules['g-recaptcha-response'] = recatpchaValidator;
    }

    fields.map(field => {
      const { model, validationType = 'string', validations = []} = field;
      let validator: any = yup[validationType]();
      if (validationType === 'string') {
        validator = yup[validationType]().transform(value => value === '' ? null : value);
      }
      fieldsRules[model] = validator;
      validations.map(({ name: rule, params = [] }) => {
        validator = validator[rule](...params);
      });
      fieldsRules[model] = validator;
    });
    
    return fieldsRules;
}

export function getValidationErrors(err) {
  const validationErrors = {};

  err.inner.forEach(error => {
    if (error.path) {
      if (validationErrors[error.path]) {
        validationErrors[error.path].push(error.message);
      } else {
        validationErrors[error.path] = [error.message];
      }
    }
  });

  return validationErrors;
}