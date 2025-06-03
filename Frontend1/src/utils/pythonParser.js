import axios from 'axios';

export const parsePythonCode = async (code) => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    return { deprecated: [], error: 'Authentication token missing.' };
  }

  try {
    const response = await Promise.race([
      axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/python/parse`,
        { code },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Python parsing timeout')), 10000)), // 10s timeout
    ]);

    const { deprecated } = response.data;
    if (!Array.isArray(deprecated)) {
      return { deprecated: [], error: 'Invalid response from server.' };
    }

    return { deprecated };
  } catch (error) {
    console.error('Python parsing error:', error);
    return { deprecated: [], error: error.message };
  }
};