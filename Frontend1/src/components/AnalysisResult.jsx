import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { getAISuggestions } from '../utils/aiSuggestor';
import { lookupDocumentation as getDocumentation } from '../utils/docsLookup';

export default function AnalysisResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasAnalyzed = useRef(false); // Prevent multiple analyses

  useEffect(() => {
    const analyzeFiles = async () => {
      if (!state?.files || hasAnalyzed.current) {
        if (!state?.files) navigate('/upload');
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
                  // Treat syntax errors as a pattern
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
                // Treat syntax errors as a pattern
                deprecatedPatterns = [{
                  type: 'SyntaxError',
                  line: error.match(/line (\d+)/)?.[1] || 0,
                  message: error,
                }];
              } else {
                deprecatedPatterns = deprecated;
              }
            } else {
              return { ...fileResult, error: 'Unsupported file type.' };
            }

            // Skip AI suggestions if no patterns or errors were detected
            if (deprecatedPatterns.length === 0) {
              return { ...fileResult, suggestions: [], message: 'No issues detected.' };
            }

            let suggestions = [];
            try {
              suggestions = await Promise.race([
                getAISuggestions(deprecatedPatterns, code, language),
                new Promise((_, reject) => setTimeout(() => reject(new Error('AI suggestion timeout')), 10000)), // 10s timeout
              ]);
            } catch (err) {
              return { ...fileResult, error: `Failed to get AI suggestions: ${err.message}` };
            }

            // Combine suggestions for the same line and suggestion code
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
                    getDocumentation(suggestion.type.split(', ')[0]), // Use the first type for documentation
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Docs lookup timeout')), 5000)), // 5s timeout
                  ]);
                  return { ...suggestion, documentation };
                } catch (err) {
                  return { ...suggestion, documentation: { url: '#', description: 'Documentation unavailable' } };
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
  }, [state, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-lg">Analyzing files...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Analysis Results</h1>
      {results.map((result, index) => (
        <div key={index} className="mb-8 p-4 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-semibold mb-4">File: {result.file}</h2>
          {result.error ? (
            <p className="text-red-500">{result.error}</p>
          ) : result.message ? (
            <p className="text-green-500">{result.message}</p>
          ) : (
            <ul className="space-y-4">
              {result.suggestions.map((suggestion, idx) => (
                <li key={idx} className="border-b pb-4">
                  <p><strong>Type:</strong> {suggestion.type}</p>
                  <p><strong>Line:</strong> {suggestion.line}</p>
                  <p><strong>Issue:</strong> {suggestion.message}</p>
                  <p><strong>Suggestion:</strong> <pre>{suggestion.suggestion}</pre></p>
                  <p>
                    <strong>Documentation:</strong>{' '}
                    <a
                      href={suggestion.documentation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
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
      <button
        onClick={() => navigate('/upload')}
        className="mt-6 p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        aria-label="Upload more files"
      >
        Upload More Files
      </button>
    </div>
  );
}