import { useState } from 'react';

function useAuthForm(initialValues, { validate, formatters = {}, clearGeneralErrorOnChange = false } = {}) {
    const [formData, setFormData] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        const format = formatters[name];
        const nextValue = format ? format(value) : value;

        setFormData((prev) => ({
            ...prev,
            [name]: nextValue
        }));

        if (errors[name] || (clearGeneralErrorOnChange && errors.general)) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
                ...(clearGeneralErrorOnChange ? { general: '' } : {})
            }));
        }
    };

    const runValidation = () => {
        const newErrors = validate ? validate(formData) : {};
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return {
        formData,
        setFormData,
        errors,
        setErrors,
        isLoading,
        setIsLoading,
        handleChange,
        runValidation
    };
}

export default useAuthForm;