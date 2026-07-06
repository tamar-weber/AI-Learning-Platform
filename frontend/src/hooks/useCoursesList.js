import { useState } from 'react';
import api from '../api/api';
import { COURSES_PAGE_LIMIT, DEFAULT_PAGINATION } from '../utils/courseConstants';

function useCoursesList({ onlyActive = false, limit = COURSES_PAGE_LIMIT } = {}) {
    const [courses, setCourses] = useState([]);
    const [pagination, setPagination] = useState({
        ...DEFAULT_PAGINATION,
        limit
    });
    const [isLoading, setIsLoading] = useState(true);

    const loadCourses = async ({ page = 1, search = '', searchBy = 'courseName', onError } = {}) => {
        try {
            const response = await api.get('/courses', {
                params: {
                    page,
                    limit,
                    search,
                    searchBy,
                    ...(onlyActive ? { onlyActive: true } : {})
                }
            });

            setCourses(response.data.items || []);
            setPagination(response.data.pagination || {
                ...DEFAULT_PAGINATION,
                page,
                limit
            });
        } catch (error) {
            if (onError) {
                onError(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
        courses,
        setCourses,
        pagination,
        setPagination,
        isLoading,
        setIsLoading,
        loadCourses
    };
}

export default useCoursesList;
