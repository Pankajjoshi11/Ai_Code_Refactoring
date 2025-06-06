import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function FileUpload({ redirectPath }) {
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Please select at least one file.');
      return;
    }
    // Use redirectPath to determine the correct /analyze route
    const analyzePath = redirectPath.replace('/upload', '/analyze');
    navigate(analyzePath, { state: { files } });
  };

  return (
    <motion.div
      className="relative z-10 flex items-center justify-center min-h-screen px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="bg-[#1c1c1e] text-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Upload Your Code Files</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input
            type="file"
            multiple
            accept=".js,.jsx,.py"
            onChange={handleFileChange}
            className="w-full p-3 bg-[#2c2c2e] text-white rounded-md border border-[#3a3a3c] focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-md hover:scale-105 hover:shadow-lg transform transition-all duration-300 ease-in-out"
          >
            Analyze Files
          </button>
        </form>
      </div>
    </motion.div>
  );
}