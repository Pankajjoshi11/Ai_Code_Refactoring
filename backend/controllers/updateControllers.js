const axios = require('axios');

async function updateCode(req, res) {
  const { legacyCode, language } = req.body;

  if (!legacyCode || !language) {
    return res.status(400).json({ message: 'Missing legacyCode or language' });
  }
  const supportedLanguages = ['JavaScript', 'Python', 'Java', 'C++'];
  if (!supportedLanguages.includes(language)) {
    return res.status(400).json({ message: 'Unsupported language' });
  }

  try {
    console.log(`User ${req.user.uid} requested code update for ${language}`);

    const safeLegacyCode = legacyCode.replace(/`/g, '\\`');

    const prompt = `
You are an AI assistant that updates legacy ${language} codebases.
Improve this code with best practices and modern syntax:

${safeLegacyCode}

Provide only the updated code.
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const updatedCode = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!updatedCode) {
      return res.status(500).json({ message: 'No updated code returned from Gemini API' });
    }

    res.json({ updatedCode });
  } catch (error) {
    console.error('Error calling Gemini API:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to update code' });
  }
}

module.exports = { updateCode };