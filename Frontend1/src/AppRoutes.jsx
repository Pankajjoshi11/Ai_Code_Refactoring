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

function PrivateRoute({ children, user }) {
  const location = useLocation();

  if (!user) {
    if (location.pathname.includes('/playground')) {
      toast.error('You need to login to have access to playground');
    }
    return <Navigate to="/auth" />;
  }
  return children;
}

export default function AppRoutes({
  selectedFeature,
  handleFeatureSelect,
  handleLogout,
  toggleDropdown,
  showDropdown,
  dropdownRef,
}) {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        localStorage.setItem('authToken', currentUser.uid);
      } else {
        localStorage.removeItem('authToken');
      }
    });
    return () => unsubscribe();
  }, []);

  const isDashboardRoute = location.pathname.includes('/dashboard') || location.pathname.includes('/project');
  const showNavbarAndBackground = location.pathname !== '/auth' && !isDashboardRoute;

  const redirectPath = (basePath) => {
    if (user && user.uid) {
      return `/${user.uid}${basePath}`;
    }
    return basePath;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Toaster position="top-right" />
      {showNavbarAndBackground && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center animate-slowZoom"
            style={{ backgroundImage: "url('/background.png')" }}
          ></div>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        </>
      )}
      {showNavbarAndBackground && <Navbar />}
      <Routes>
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
              <Dashboard
                selectedFeature={selectedFeature}
                handleFeatureSelect={handleFeatureSelect}
                user={user}
                handleLogout={handleLogout}
                toggleDropdown={toggleDropdown}
                showDropdown={showDropdown}
                dropdownRef={dropdownRef}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/:userId/project/:projectId/workspace/:workspaceId/*"
          element={
            <PrivateRoute user={user}>
              <Workspaces />
            </PrivateRoute>
          }
        />
        <Route
          path="/:userId/workspace/:workspaceId"
          element={<Navigate to="/:userId/dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}