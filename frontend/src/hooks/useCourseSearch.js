import { useEffect, useState } from 'react';
import useDebouncedValue from './useDebouncedValue';

function useCourseSearch({ initialSearchBy = 'courseName', debounceMs = 400 } = {}) {
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchBy, setSearchBy] = useState(initialSearchBy);
    const [page, setPage] = useState(1);
    const debouncedSearchInput = useDebouncedValue(searchInput, debounceMs);

    useEffect(() => {
        setSearchTerm(debouncedSearchInput);
        setPage(1);
    }, [debouncedSearchInput]);

    const handleSearchInputChange = (event) => {
        setSearchInput(event.target.value);
    };

    const handleSearchByChange = (event) => {
        setSearchBy(event.target.value);
        setSearchInput('');
        setSearchTerm('');
        setPage(1);
    };

    return {
        searchInput,
        searchTerm,
        searchBy,
        page,
        setPage,
        handleSearchInputChange,
        handleSearchByChange
    };
}

export default useCourseSearch;
