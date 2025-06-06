import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { getAISuggestions } from '../utils/aiSuggestor';
import { lookupDocumentation as getDocumentation } from '../utils/docsLookup';
import { motion } from 'framer-motion';

export default function AnalysisResult({ redirectPath }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasAnalyzed = useRef(false);

  useEffect(() => {
    const analyzeFiles = async () => {
      if (!state?.files || hasAnalyzed.current) {
        if (!state?.files) {
          // Use redirectPath to determine the correct /upload route
          const uploadPath = redirectPath.replace('/analyze', '/upload');
          navigate(uploadPath);
        }
        return;
      }

      hasAnalyzed.current = true;

      try {
        const analysisResults = await Promise.all(
          state.files.map(async (file) => {
            const fileResult = { file: file.name };
            const code = await file.text();

            let deprecatedPatterns = [];
            let language = '';

            if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
              language = 'JavaScript';
              try {
                const token = localStorage.getItem('authToken');
                const response = await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL}/api/js/parse`,
                  { code },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                const { deprecated, error } = response.data;
                if (error) {
                  deprecatedPatterns = [{
                    type: 'SyntaxError',
                    line: error.match(/line (\d+)/)?.[1] || 0,
                    message: error,
                  }];
                } else {
                  deprecatedPatterns = deprecated;
                }
              } catch (err) {
                return { ...fileResult, error: `Failed to parse JavaScript: ${err.message}` };
              }
            } else if (file.name.endsWith('.py')) {
              language = 'Python';
              try {
                const token = localStorage.getItem('authToken');
                const response = await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL}/api/python/parse`,
                  { code },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                  }
                );
                const { deprecated, error } = response.data;
                if (error) {
                  deprecatedPatterns = [{
                    type: 'SyntaxError',
                    line: error.match(/line (\d+)/)?.[1] || 0,
                    message: error,
                  }];
                } else {
                  deprecatedPatterns = deprecated;
                }
              } catch (err) {
                return { ...fileResult, error: `Failed to parse Python: ${err.message}` };
              }
            } else {
              return { ...fileResult, error: 'Unsupported file type.' };
            }

            if (deprecatedPatterns.length === 0) {
              return { ...fileResult, suggestions: [], message: 'No issues detected.' };
            }

            let suggestions = [];
            try {
              suggestions = await Promise.race([
                getAISuggestions(deprecatedPatterns, code, language),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI suggestion timeout')), 10000)),
              ]);
            } catch (err) {
              return { ...fileResult, error: `Failed to get AI suggestions: ${err.message}` };
            }

            const combinedSuggestions = [];
            const seen = new Set();
            for (const suggestion of suggestions) {
              const key = `${suggestion.line}-${suggestion.suggestion}`;
              if (!seen.has(key)) {
                seen.add(key);
                const relatedSuggestions = suggestions.filter(
                  (s) => s.line === suggestion.line && s.suggestion === suggestion.suggestion
                );
                const combinedTypes = relatedSuggestions.map(s => s.type).join(', ');
                const combinedMessages = relatedSuggestions.map(s => s.message).join('; ');
                combinedSuggestions.push({
                  ...suggestion,
                  type: combinedTypes,
                  message: combinedMessages,
                });
              }
            }

            const enrichedSuggestions = await Promise.all(
              combinedSuggestions.map(async (suggestion) => {
                try {
                  const documentation = await Promise.race([
                    getDocumentation(suggestion.type.split(', ')[0]),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Docs lookup timeout')), 5000)),
                  ]);
                  return { ...suggestion, documentation };
                } catch (err) {
                  return {
                    ...suggestion,
                    documentation: { url: '#', description: 'Documentation unavailable' }
                  };
                }
              })
            );

            return { ...fileResult, suggestions: enrichedSuggestions };
          })
        );

        setResults(analysisResults);
      } catch (err) {
        setError('An unexpected error occurred during analysis.');
      } finally {
        setLoading(false);
      }
    };

    analyzeFiles();
  }, [state, navigate, redirectPath]);

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <p className="text-xl animate-pulse">Analyzing files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-red-400 flex items-center justify-center">
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Progress bar */}
      {loading && (
        <div className="fixed top-0 left-0 w-full z-50">
          <div className="h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-pulse" />
        </div>
      )}

      {/* Analysis Results */}
      <motion.div
        className="relative z-10 px-4 py-10 md:px-20 max-w-4xl mx-auto text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
          Analysis Results
        </h1>

        {error && (
          <p className="text-red-400 text-center mb-4">{error}</p>
        )}

        {results.map((result, index) => (
          <div
            key={index}
            className="mb-10 bg-[#1c1c1e] border border-gray-700 p-6 rounded-xl shadow-lg"
          >
            <h2 className="text-xl font-semibold mb-4 text-purple-400">File: {result.file}</h2>
            {result.error ? (
              <p className="text-red-400">{result.error}</p>
            ) : result.message ? (
              <p className="text-green-400">{result.message}</p>
            ) : (
              <ul className="space-y-6">
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="bg-[#2c2c2e] p-4 rounded-md border border-gray-600">
                    <p><strong>🔍 Type:</strong> {suggestion.type}</p>
                    <p><strong>📍 Line:</strong> {suggestion.line}</p>
                    <p><strong>⚠️ Issue:</strong> {suggestion.message}</p>
                    <p><strong>💡 Suggestion:</strong></p>
                    <pre className="bg-gray-800 text-green-300 p-2 rounded-md overflow-x-auto text-sm">
                      {suggestion.suggestion}
                    </pre>
                    <p>
                      <strong>📚 Documentation:</strong>{' '}
                      <a
                        href={suggestion.documentation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {suggestion.documentation.description}
                      </a>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div className="text-center">
          <button
            onClick={() => navigate(redirectPath.replace('/analyze', '/upload'))}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-md hover:scale-105 transform transition-all duration-300 ease-in-out"
          >
            Upload More Files
          </button>
        </div>
      </motion.div>
    </>
  );
}