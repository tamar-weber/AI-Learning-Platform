export const requiredRule = (message) => (value) =>
    !String(value || '').trim() ? message : null;

export const minLengthRule = (min, message) => (value) =>
    String(value || '').length < min ? message : null;

export const patternRule = (validator, message) => (value) =>
    value && !validator(value) ? message : null;

export const customRule = (validator) => (value, data) =>
    validator(value, data);

export function validateWithSchema(schema, data) {
    const errors = {};

    Object.entries(schema).forEach(([field, rules]) => {
        for (const rule of rules) {
            const error = rule(data[field], data);

            if (error) {
                errors[field] = error;
                break;
            }
        }
    });

    return errors;
}