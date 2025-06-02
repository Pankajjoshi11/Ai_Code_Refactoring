import axios from 'axios';

export const parsePythonCode = async (code) => {
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

    return response.data;
  } catch (error) {
    console.error('Python parsing error:', error);
    return { deprecated: [], error: error.message };
  }
};