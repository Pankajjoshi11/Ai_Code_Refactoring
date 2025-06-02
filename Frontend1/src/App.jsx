import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Home from './components/Home';
import FileUpload from './components/FileUpload';
import AnalysisResult from './components/AnalysisResult';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/home" element={<Home />} />
        <Route path="/upload" element={<FileUpload />} />
        <Route path="/analyze" element={<AnalysisResult />} />
      </Routes>
    </Router>
  );
}

export default App;