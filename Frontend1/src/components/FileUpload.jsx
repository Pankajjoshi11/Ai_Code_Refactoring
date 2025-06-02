import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FileUpload() {
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFiles(uploadedFiles);
  };

  const handleAnalyze = () => {
    if (files.length === 0) {
      alert('Please upload at least one file.');
      return;
    }
    navigate('/analyze', { state: { files } });
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-6 bg-white shadow-md rounded-lg text-center">
      <h2 className="text-2xl font-bold mb-6">Upload Code Files</h2>
      <input
        type="file"
        accept=".js,.jsx,.py"
        multiple
        onChange={handleFileChange}
        className="mb-4 p-3 border border-gray-300 rounded-md w-full"
      />
      <button
        onClick={handleAnalyze}
        className="p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors w-full"
      >
        Analyze Code
      </button>
    </div>
  );
}
