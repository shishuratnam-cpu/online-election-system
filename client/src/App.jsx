import React, { useState, useEffect, useContext } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import { AuthProvider, AuthContext } from './context/AuthContext';
import ContactHelp from './components/ContactHelp';
// Layout components
import Sidebar from './layouts/Sidebar';
import Navbar from './layouts/Navbar';

// Page components
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Nomination from './pages/Nomination';
import AdminDashboard from './pages/AdminDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import VoterDashboard from './pages/VoterDashboard';
import Profile from './pages/Profile';

// Route Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If authenticated but unauthorized, redirect to their home space
    const fallbackPath = {
      admin: '/admin/dashboard',
      organizer: '/organizer/dashboard',
      voter: '/voter/dashboard'
    }[user.role] || '/';
    
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

// Global Layout Wrapper containing Sidebar + Page contents
const LayoutWrapper = ({ children, theme, toggleTheme }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {isAuthenticated && <Sidebar />}

      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>

          {location.pathname !== "/" && (
    <Navbar theme={theme} toggleTheme={toggleTheme} />
)}

          <main
              className="p-4 flex-grow-1"
              style={{ backgroundColor: "var(--bg-primary)" }}
          >
              {children}
          </main>

          <ContactHelp />

      </div>
    </div>
  );
};


const AppContent = () => {
  const [theme, setTheme] = useState('dark');

  // Load and apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <Router>
      <LayoutWrapper theme={theme} toggleTheme={toggleTheme}>
        <Routes>
          {/* Public Routes */}
          <Route
  path="/"
  element={
    <LandingPage
      theme={theme}
      toggleTheme={toggleTheme}
    />
  }
/>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/nomination" element={<Nomination />} />

          {/* Voter Protected Routes */}
          <Route 
            path="/voter/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['voter']}>
                <VoterDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/voter/elections" 
            element={
              <ProtectedRoute allowedRoles={['voter']}>
                <VoterDashboard selectTab="elections" />
              </ProtectedRoute>
            } 
          />

          {/* Organizer Protected Routes */}
          <Route 
            path="/organizer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizer/candidates" 
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerDashboard selectTab="candidates" />
              </ProtectedRoute>
            } 
          />

          {/* Admin Protected Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/organizers" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard selectTab="organizers" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/nominations" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard selectTab="nominations" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/voters" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard selectTab="voters" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/audit" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard selectTab="audit" />
              </ProtectedRoute>
            } 
          />

          {/* Common Protected Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />

          {/* Fallback Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
