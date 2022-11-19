import * as yup from 'yup';

export function createYupSchema(fields) {
    const fieldsRules = {};

    fields.map(field => {
      const { model, validationType = 'string', validations = []} = field;
      let validator: any = yup[validationType]();
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