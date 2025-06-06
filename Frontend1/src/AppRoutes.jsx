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

// PrivateRoute wrapper
function PrivateRoute({ children }) {
  const token = localStorage.getItem('authToken');
  const location = useLocation();

  if (!token) {
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
    });
    return () => unsubscribe();
  }, []);

  // Conditionally render Navbar and background (exclude on /auth route)
  const showNavbarAndBackground = location.pathname !== '/auth';

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

      {/* Navbar (exclude on /auth route) */}
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
          path="/home"
          element={
            <PrivateRoute>
              <Home user={user} redirectPath={redirectPath('/upload')} />
            </PrivateRoute>
          }
        />
        <Route
          path="/:userId"
          element={
            <PrivateRoute>
              <Home user={user} redirectPath={redirectPath('/upload')} />
            </PrivateRoute>
          }
        />
        <Route
          path="/:userId/upload"
          element={
            <PrivateRoute>
              <FileUpload user={user} redirectPath={redirectPath('/upload')} />
            </PrivateRoute>
          }
        />
        <Route
          path="/:userId/analyze"
          element={
            <PrivateRoute>
              <AnalysisResult user={user} redirectPath={redirectPath('/analyze')} />
            </PrivateRoute>
          }
        />
        <Route
          path="/playground"
          element={
            <PrivateRoute>
              <Playground />
            </PrivateRoute>
          }
        />
        <Route
          path="/:userId/playground"
          element={
            <PrivateRoute>
              <Playground user={user} />
            </PrivateRoute>
          }
        />

        {/* Optional 404 fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}