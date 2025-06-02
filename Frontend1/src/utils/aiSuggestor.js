import axios from 'axios';

export const getAISuggestions = async (deprecatedPatterns, code, language) => {
  const suggestions = [];
  for (const pattern of deprecatedPatterns) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/update`,
        {
          legacyCode: code,
          language,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const updatedCode = response.data.updatedCode;
      suggestions.push({
        ...pattern,
        suggestion: updatedCode,
      });
    } catch (error) {
      console.error('AI suggestion error:', error);
      suggestions.push({
        ...pattern,
        suggestion: 'Failed to generate suggestion.',
      });
    }
  }

  return suggestions;
};