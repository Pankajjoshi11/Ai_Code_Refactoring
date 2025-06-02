import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { parseJavaScriptCode } from '../utils/codeParser';
import { parsePythonCode } from '../utils/pythonParser';
import { getAISuggestions } from '../utils/aiSuggestor';
import { getDocumentation } from '../utils/docsLookup';

export default function AnalysisResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyzeFiles = async () => {
      if (!state?.files) {
        navigate('/upload');
        return;
      }

      const analysisResults = [];
      for (const file of state.files) {
        const fileResult = { file: file.name };
        const code = await file.text();

        let deprecatedPatterns = [];
        let language = '';

        if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
          language = 'JavaScript';
          const { deprecatedPatterns: patterns, error } = await parseJavaScriptCode(file);
          if (error) {
            analysisResults.push({ ...fileResult, error });
            continue;
          }
          deprecatedPatterns = patterns;
        } else if (file.name.endsWith('.py')) {
          language = 'Python';
          const { deprecated: patterns, error } = await parsePythonCode(code);
          if (error) {
            analysisResults.push({ ...fileResult, error });
            continue;
          }
          deprecatedPatterns = patterns;
        } else {
          analysisResults.push({ ...fileResult, error: 'Unsupported file type.' });
          continue;
        }

        const suggestions = await getAISuggestions(deprecatedPatterns, code, language);
        const enrichedSuggestions = suggestions.map((suggestion) => ({
          ...suggestion,
          documentation: getDocumentation(suggestion.type),
        }));

        analysisResults.push({ ...fileResult, suggestions: enrichedSuggestions });
      }

      setResults(analysisResults);
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Analysis Results</h1>
      {results.map((result, index) => (
        <div key={index} className="mb-8 p-4 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-semibold mb-4">File: {result.file}</h2>
          {result.error ? (
            <p className="text-red-500">{result.error}</p>
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
      >
        Upload More Files
      </button>
    </div>
  );
}
