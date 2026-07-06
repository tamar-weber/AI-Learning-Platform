import React from 'react';
import { COURSE_SEARCH_OPTIONS, getCourseSearchPlaceholder } from '../utils/courseSearch';

function CourseSearchControls({
    wrapperClassName,
    inputClassName,
    selectClassName,
    searchInput,
    searchBy,
    onSearchInputChange,
    onSearchByChange
}) {
    const content = (
        <>
            <input
                type="search"
                className={inputClassName}
                value={searchInput}
                onChange={onSearchInputChange}
                placeholder={getCourseSearchPlaceholder(searchBy)}
            />
            <select className={selectClassName} value={searchBy} onChange={onSearchByChange}>
                {COURSE_SEARCH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </>
    );

    if (!wrapperClassName) {
        return content;
    }

    return <div className={wrapperClassName}>{content}</div>;
}

export default CourseSearchControls;
