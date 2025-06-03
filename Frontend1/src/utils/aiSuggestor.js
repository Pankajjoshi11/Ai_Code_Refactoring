import axios from 'axios';

export const getAISuggestions = async (deprecatedPatterns, code, language) => {
  if (!deprecatedPatterns.length) return [];

  const token = localStorage.getItem('authToken');
  if (!token) {
    return deprecatedPatterns.map(pattern => ({
      ...pattern,
      suggestion: 'Failed to generate suggestion: Authentication token missing.',
    }));
  }

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/update`,
      {
        legacyCode: code,
        language,
        patterns: deprecatedPatterns, // Send all patterns at once
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Assuming the backend returns an array of suggestions matching the patterns
    const updatedSuggestions = response.data.updatedSuggestions || [];
    return deprecatedPatterns.map((pattern, index) => ({
      ...pattern,
      suggestion: updatedSuggestions[index]?.updatedCode || 'No suggestion provided by AI.',
    }));
  } catch (error) {
    console.error('AI suggestion error:', error);
    return deprecatedPatterns.map(pattern => ({
      ...pattern,
      suggestion: `Failed to generate suggestion: ${error.message}`,
    }));
  }
};