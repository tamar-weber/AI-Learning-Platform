import { useEffect, useState } from 'react';

function useDebouncedValue(value, delay = 400) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timeoutId);
    }, [value, delay]);

    return debouncedValue;
}

export default useDebouncedValue;
