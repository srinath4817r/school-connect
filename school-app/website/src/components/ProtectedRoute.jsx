import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import PortalLoader from './PortalLoader';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return <PortalLoader />;
  }

  // If there's no token or no user, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified and user's role is not included
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard
    if (user.role === 'super_admin') return <Navigate to="/dashboard/super-admin" replace />;
    if (user.role === 'school_admin') return <Navigate to="/dashboard/school-admin" replace />;
    if (user.role === 'principal') return <Navigate to="/dashboard/principal" replace />;
    if (user.role === 'teacher') return <Navigate to="/dashboard/teacher" replace />;
    if (user.role === 'parent') return <Navigate to="/dashboard/parent" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
