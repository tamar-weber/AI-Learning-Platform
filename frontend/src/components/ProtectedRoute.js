import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, isAllowed, redirectTo = '/login' }) {
    if (!isAllowed) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
}

export default ProtectedRoute;
