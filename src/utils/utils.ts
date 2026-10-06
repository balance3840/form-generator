import * as yup from 'yup';
import { FormField, RuleSpec, effectiveValidationType, isLayoutType, ruleSpecFor } from './schema';
import { createTranslator } from './i18n';

export type Translate = (key: string, vars?: { [key: string]: any }) => string;
const defaultTranslate: Translate = createTranslator('en');

function stripTags(value: string) {
  return String(value || '').replace(/<[^>]*>/g, '');
}

function defaultMessage(spec: RuleSpec | undefined, label: string, params: any[], labelOf: (model: string) => string, t: Translate): string | undefined {
  if (!spec) return undefined;
  const first = spec.params[0] === 'field' ? labelOf(params[0]) : String(params[0]);
  return t(`validation.${spec.key}`, { label, 0: first });
}

const isIncomplete = (args: any[]) => args.some(a => a === undefined || a === null || a === '' || (typeof a === 'number' && isNaN(a)) || (Array.isArray(a) && !a.length));

/** `accept`-style matching: ".pdf", "image/*" or "application/pdf". */
function fileMatches(file: File, accepted: string[]) {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();
  return accepted.some(raw => {
    const rule = String(raw).trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

const fileList = (value: any): File[] => (value && typeof value.length === 'number' ? Array.from(value as ArrayLike<File>) : []);

function buildFileValidator(field: FormField, label: string, labelOf: (m: string) => string, t: Translate) {
  let validator: any = yup.mixed();
  const typeRule = (field.validations || []).find(r => r.name === 'fileTypes');
  // The `accept` attribute is only a hint for the file picker (drag and drop ignores it), so enforce it too.
  const implicitAccept = !typeRule && field.attributes && typeof field.attributes.accept === 'string' ? field.attributes.accept.split(',') : null;
  if (implicitAccept) {
    validator = validator.test('accept', t('validation.fileTypes'), (value: any) => fileList(value).every(f => fileMatches(f, implicitAccept)));
  }
  (field.validations || []).forEach(({ name, params = [] }) => {
    const spec = ruleSpecFor(name, 'file');
    if (!spec) return;
    const count = spec.params.length;
    if (isIncomplete(params.slice(0, count))) return;
    const message = (typeof params[count] === 'string' && params[count]) || defaultMessage(spec, label, params, labelOf, t) || 'Invalid file';
    switch (name) {
      case 'required':
        validator = validator.test('required', message, (value: any) => fileList(value).length > 0);
        break;
      case 'maxFileSize':
        validator = validator.test('maxFileSize', message, (value: any) => fileList(value).every(f => f.size <= Number(params[0]) * 1024 * 1024));
        break;
      case 'fileTypes':
        validator = validator.test('fileTypes', message, (value: any) => fileList(value).every(f => fileMatches(f, params[0])));
        break;
      case 'minFiles':
        validator = validator.test('minFiles', message, (value: any) => fileList(value).length === 0 || fileList(value).length >= Number(params[0]));
        break;
      case 'maxFiles':
        validator = validator.test('maxFiles', message, (value: any) => fileList(value).length <= Number(params[0]));
        break;
    }
  });
  return validator;
}

/**
 * Builds the Yup shape for `fields`. `allFields` (defaults to `fields`) is only used to resolve
 * labels and to check that rules which point at another field point at one that exists. `t` localizes the default messages.
 */
export function createYupSchema(fields: FormField[], captchaField: string | boolean = false, allFields: FormField[] = fields, t: Translate = defaultTranslate) {
  const fieldsRules: { [key: string]: any } = {};
  const labelOf = (model: string) => {
    const target = allFields.find(f => f.model === model);
    return target ? stripTags(target.label || target.checkboxLabel || '') || model : model;
  };

  if (captchaField) {
    // the captcha token must be there; `true` is the old reCAPTCHA-only behaviour
    fieldsRules[captchaField === true ? 'g-recaptcha-response' : captchaField] = yup.string().required(t('validation.captcha'));
  }

  fields.forEach(field => {
    if (isLayoutType(field.type) || !field.model) return;
    const { model, validations = [] } = field;
    const validationType = effectiveValidationType(field);
    const label = stripTags(field.label || field.checkboxLabel || '') || model;

    if (validationType === 'file') {
      fieldsRules[model] = buildFileValidator(field, label, labelOf, t);
      return;
    }

    let validator: any = (yup as any)[validationType]();

    if (validationType === 'string') {
      validator = validator.transform((value: any) => (value === '' ? null : value)).nullable();
    } else if (validationType === 'number' || validationType === 'date') {
      // Empty inputs arrive as '' - treat them as "no value" instead of a type error.
      validator = validator.transform((current: any, original: any) => (original === '' || original === null || original === undefined ? undefined : current));
    }

    validations.forEach(({ name: rule, params = [] }) => {
      const spec = ruleSpecFor(rule, validationType);
      const args = [...params];
      // The message follows the value parameters. Unknown (custom) rules fall back to the v1 convention.
      const valueCount = spec ? spec.params.length : rule === 'matches' ? 1 : ['required', 'email', 'url', 'integer', 'positive', 'negative'].includes(rule) ? 0 : 1;
      // A rule whose value is not filled in yet (e.g. half-edited in the builder) is simply inactive.
      if (isIncomplete(args.slice(0, valueCount))) return;
      if (typeof args[valueCount] !== 'string' || !args[valueCount].length) {
        const message = defaultMessage(spec, label, args, labelOf, t);
        if (message) args[valueCount] = message;
        else args.length = Math.min(args.length, valueCount);
      }

      // Rules that compare with another field
      if (spec && spec.params[0] === 'field') {
        const target = args[0];
        if (!allFields.some(f => f.model === target && f.model !== model)) return; // the other field is gone
        const ref = yup.ref(target);
        if (rule === 'sameAs') validator = validator.oneOf([ref, null], args[1]);
        else if (rule === 'notSameAs') validator = validator.notOneOf([ref], args[1]);
        else if (rule === 'minField') validator = validator.min(ref, args[1]);
        else if (rule === 'maxField') validator = validator.max(ref, args[1]);
        return;
      }

      if (rule === 'matches' && typeof args[0] === 'string') {
        try {
          args[0] = new RegExp(args[0]);
        } catch (e) {
          return; // ignore an invalid pattern instead of breaking the whole form
        }
      }
      if (rule === 'oneOf' && Array.isArray(args[0])) {
        // empty answers are the job of `required`
        args[0] = [...args[0], null];
      }
      if (rule === 'required' && validationType === 'array') {
        // an empty list counts as unanswered
        validator = validator.required(args[0]).min(1, args[0]);
        return;
      }
      if (rule === 'required' && validationType === 'boolean') {
        // A required checkbox means "must be ticked".
        validator = validator.oneOf([true], args[0]);
        return;
      }
      if (typeof validator[rule] === 'function') {
        validator = validator[rule](...args);
      }
    });
    fieldsRules[model] = validator;
  });

  return fieldsRules;
}

export function getValidationErrors(err: any) {
  const validationErrors: { [key: string]: string[] } = {};

  (err.inner || []).forEach((error: any) => {
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
