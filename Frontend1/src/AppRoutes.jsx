import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from './firebase/firebaseConfig';
import { Toaster, toast } from 'react-hot-toast';

import AuthForm from './components/AuthForm';
import Home from './components/Home';
import FileUpload from './components/FileUpload';
import AnalysisResult from './components/AnalysisResult';
import Navbar from './components/Navbar';
import Playground from './components/Playground';
import Dashboard from './components/Dashboard';
import Workspaces from './components/Workspaces';

// PrivateRoute wrapper
function PrivateRoute({ children, user }) {
  const location = useLocation();

  if (!user) {
    // Show toast if trying to access playground without being logged in
    if (location.pathname.includes('/playground')) {
      toast.error('You need to login to have access to playground');
    }
    return <Navigate to="/auth" />;
  }
  return children;
}

export default function AppRoutes() {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem('authToken', currentUser.uid); // Sync localStorage with Firebase user
      } else {
        localStorage.removeItem('authToken');
      }
    });
    return () => unsubscribe();
  }, []);

  // Conditionally render Navbar and background (exclude on /auth and dashboard routes)
  const isDashboardRoute = location.pathname.includes('/dashboard') || location.pathname.includes('/project');
  const showNavbarAndBackground = location.pathname !== '/auth' && !isDashboardRoute;

  // Redirect authenticated users to user-specific routes
  const redirectPath = (basePath) => {
    if (user && user.uid) {
      return `/${user.uid}${basePath}`;
    }
    return basePath;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Toaster for displaying toast messages */}
      <Toaster position="top-right" />

      {/* Background layers (only shown when Navbar is present) */}
      {showNavbarAndBackground && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center animate-slowZoom"
            style={{ backgroundImage: "url('/background.png')" }}
          ></div>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        </>
      )}

      {/* Navbar (exclude on /auth, dashboard, and project routes) */}
      {showNavbarAndBackground && <Navbar />}

      {/* Page content */}
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={user ? <Navigate to={`/${user.uid}`} /> : <Home redirectPath={redirectPath('/upload')} />}
        />
        <Route path="/auth" element={<AuthForm />} />
        <Route
          path="/upload"
          element={<FileUpload redirectPath={redirectPath('/upload')} />}
        />
        <Route
          path="/analyze"
          element={<AnalysisResult redirectPath={redirectPath('/analyze')} />}
        />

        {/* Protected Routes */}
        <Route
          path="/:userId"
          element={
            <PrivateRoute user={user}>
              <Home user={user} redirectPath={redirectPath('/upload')} />
            </PrivateRoute>
          }
        />
        <Route
          path="/:userId/upload"
          element={
            <PrivateRoute user={user}>
              <FileUpload user={user} redirectPath={redirectPath('/upload')} />
            </PrivateRoute>
          }
        />
        <Route
          path="/:userId/analyze"
          element={
            <PrivateRoute user={user}>
              <AnalysisResult user={user} redirectPath={redirectPath('/analyze')} />
            </PrivateRoute>
          }
        />
        <Route
          path="/:userId/playground"
          element={
            <PrivateRoute user={user}>
              <Playground user={user} />
            </PrivateRoute>
          }
        />
        <Route
          path="/:userId/dashboard"
          element={
            <PrivateRoute user={user}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/:userId/project/:projectId/workspace/:workspaceId"
          element={
            <PrivateRoute user={user}>
              <Workspaces />
            </PrivateRoute>
          }
        />
        {/* Redirect old workspace route to dashboard */}
        <Route
          path="/:userId/workspace/:workspaceId"
          element={<Navigate to="/:userId/dashboard" replace />}
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}