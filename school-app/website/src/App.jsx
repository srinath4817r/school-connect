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

const RootRoute = () => {
  const isNativeApp = /SchoolConnectApp/i.test(navigator.userAgent);
  return isNativeApp ? <DownloadPage /> : <Landing />;
};

const AppContent = () => {
  const { isSchoolDeactivated } = useContext(AuthContext);

  return (
    <>
      {isSchoolDeactivated && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 10, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          color: 'white',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '24px',
            padding: '40px 30px',
            maxWidth: '450px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#f87171', fontFamily: 'system-ui, sans-serif' }}>School Access Blocked</h2>
            <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
              Your school has been deactivated. Please contact the school administration for more information.
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '12px', 
              color: '#94a3b8',
              marginTop: '10px'
            }}>
              <span className="live-pulse" style={{ background: '#60a5fa', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }}></span>
              <span>Reconnecting to verify status...</span>
            </div>
          </div>
        </div>
      )}
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route path="/download" element={<PublicRoute><DownloadPage /></PublicRoute>} />

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
          <Route path="/" element={<PublicRoute><RootRoute /></PublicRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </>
  );
};

function App() {
  useEffect(() => {
    document.title = 'School Connect';
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
