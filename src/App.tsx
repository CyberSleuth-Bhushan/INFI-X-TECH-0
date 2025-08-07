import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { motion } from 'framer-motion';

// Import admin setup utility for console access
import './utils/adminSetup';

// Import pages (will be created in subsequent tasks)
import Home from './pages/public/Home';
import Events from './pages/public/Events';
import TeamShowcase from './pages/public/TeamShowcase';
import Updates from './pages/public/Updates';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ParticipantDashboard from './pages/dashboard/ParticipantDashboard';
import MemberDashboard from './pages/dashboard/MemberDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ManagerDashboard from './pages/dashboard/ManagerDashboard';

import TermsAndConditions from './pages/public/TermsAndConditions';

// Import components
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicLayout from './components/layout/PublicLayout';

// Auth redirect component
const AuthRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      // Get the intended destination from location state
      const from = (location.state as any)?.from?.pathname || getDashboardPath(user.role);
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const getDashboardPath = (role: string) => {
    switch (role) {
      case 'admin':
        return '/admin-dashboard';
      case 'member':
        return '/member-dashboard';
      case 'participant':
        return '/participant-dashboard';
      case 'manager':
        return '/manager-dashboard';
      default:
        return '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return user ? <Navigate to={getDashboardPath(user.role)} replace /> : <Navigate to="/login" replace />;
};

function AppContent() {
  return (
    <motion.div 
      className="App min-h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:eventId" element={<Events />} />
          <Route path="team" element={<TeamShowcase />} />
          <Route path="updates" element={<Updates />} />
          <Route path="terms-and-conditions" element={<TermsAndConditions />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/participant-dashboard/*" element={
          <ProtectedRoute allowedRoles={['participant']}>
            <ParticipantDashboard />
          </ProtectedRoute>
        } />
        <Route path="/member-dashboard/*" element={
          <ProtectedRoute allowedRoles={['member']}>
            <MemberDashboard />
          </ProtectedRoute>
        } />
        <Route path="/manager-dashboard/*" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Auth redirect route */}
        <Route path="/auth-redirect" element={<AuthRedirect />} />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </motion.div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
