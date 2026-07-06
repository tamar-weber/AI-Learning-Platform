import React from 'react';

function PaginationControls({
    wrapperClassName,
    buttonClassName,
    currentPage,
    totalPages,
    onPrevious,
    onNext,
    statusText,
    isPreviousDisabled,
    isNextDisabled,
    previousLabel = 'הקודם',
    nextLabel = 'הבא'
}) {
    return (
        <div className={wrapperClassName}>
            <button
                type="button"
                className={buttonClassName}
                onClick={onPrevious}
                disabled={isPreviousDisabled}
            >
                {previousLabel}
            </button>
            <span>{statusText || `${currentPage} / ${totalPages}`}</span>
            <button
                type="button"
                className={buttonClassName}
                onClick={onNext}
                disabled={isNextDisabled}
            >
                {nextLabel}
            </button>
        </div>
    );
}

export default PaginationControls;
