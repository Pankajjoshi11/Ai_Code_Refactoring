import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { auth } from './firebase/firebaseConfig';
import AppRoutes from './AppRoutes';

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;