import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PortalLoader from './components/PortalLoader';

// Views
import Landing from './views/Landing';
import Login from './views/Login';
import Register from './views/Register';
import ForgotPassword from './views/ForgotPassword';
import ResetPassword from './views/ResetPassword';
import DownloadPage from './views/DownloadPage';

// Dashboards
import {
  SuperAdminDashboard,
  SchoolAdminDashboard,
  PrincipalDashboard,
  TeacherDashboard,
  ParentDashboard,
  DriverDashboard
} from './views/DashboardPlaceholder';

import './App.css';

// Public Route wrapper that redirects logged in users to their respective dashboard
const PublicRoute = ({ children }) => {
  const { user, token, loading } = useContext(AuthContext);

  if (loading) {
    return <PortalLoader />;
  }

  if (token && user) {
    const role = user.role;
    if (role === 'super_admin') return <Navigate to="/dashboard/super-admin" replace />;
    if (role === 'school_admin') return <Navigate to="/dashboard/school-admin" replace />;
    if (role === 'principal') return <Navigate to="/dashboard/principal" replace />;
    if (role === 'teacher') return <Navigate to="/dashboard/teacher" replace />;
    if (role === 'parent') return <Navigate to="/dashboard/parent" replace />;
    if (role === 'driver') return <Navigate to="/dashboard/driver" replace />;
  }

  return children;
};

function App() {
  useEffect(() => {
    document.title = 'School Connect';
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route path="/download" element={<Navigate to="/" replace />} />

          {/* Protected Dashboard Routes */}
          <Route 
            path="/dashboard/super-admin" 
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/school-admin" 
            element={
              <ProtectedRoute allowedRoles={['school_admin']}>
                <SchoolAdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/principal" 
            element={
              <ProtectedRoute allowedRoles={['principal']}>
                <PrincipalDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/teacher" 
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/parent" 
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/driver" 
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <DriverDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Redirects */}
          <Route path="/" element={<PublicRoute><DownloadPage /></PublicRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
