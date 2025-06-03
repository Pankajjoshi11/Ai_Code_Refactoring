const axios = require('axios');

// Utility function to retry a promise with exponential backoff
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error; // Last retry failed
      console.log(`Retry ${i + 1}/${retries} failed: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

async function updateCode(req, res) {
  const { legacyCode, language, patterns } = req.body;

  if (!legacyCode || !language) {
    return res.status(400).json({ message: 'Missing legacyCode or language' });
  }
  const supportedLanguages = ['JavaScript', 'Python'];
  if (!supportedLanguages.includes(language)) {
    return res.status(400).json({ message: 'Unsupported language' });
  }
  if (!patterns || !Array.isArray(patterns)) {
    return res.status(400).json({ message: 'Missing or invalid patterns' });
  }

  try {
    console.log(`User ${req.user.uid} requested code update for ${language}`);

    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    // Basic sanitization (limit code length and escape backticks)
    const safeLegacyCode = legacyCode.slice(0, 10000).replace(/`/g, '\\`'); // Limit to 10k characters

    // Detect if the original code has an export
    const hasExportDefault = /export\s+default\s+/.test(legacyCode);
    const hasNamedExport = /export\s+(const|let|var|function|class)/.test(legacyCode);
    const exportInfo = hasExportDefault ? 'The code has an export default statement.' :
      hasNamedExport ? 'The code has named exports.' : 'The code has no exports.';

    const prompt = `
You are an AI assistant that updates legacy ${language} codebases.
The following code contains deprecated patterns. Update the code to fix these specific issues, using modern best practices:

### Deprecated Patterns:
${patterns.map(p => `- ${p.type} at line ${p.line}: ${p.message}`).join('\n')}

### Legacy Code:
${safeLegacyCode}

### Export Information:
${exportInfo}

For each deprecated pattern, provide the updated code snippet to fix that specific issue.
- Preserve the original export behavior: if the code has no exports, do not add any; if it has an export default, include one; if it has named exports, maintain them.
- Do not add explanatory text or Markdown formatting.
Return a JSON array of suggestions in the format:
[
  { "type": "pattern type", "updatedCode": "updated code snippet" },
  ...
]
`;

    const response = await retry(() =>
      axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      )
    );

    const updatedSuggestions = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!updatedSuggestions) {
      return res.status(500).json({ message: 'No suggestions returned from Gemini API' });
    }

    let parsedSuggestions;
    try {
      // Robust cleaning of Gemini response
      let cleanedResponse = updatedSuggestions.trim();

      // Log the raw response for debugging
      console.log('Raw Gemini response:', updatedSuggestions);

      // Remove any explanatory text before the JSON
      const jsonStart = cleanedResponse.indexOf('[');
      const jsonEnd = cleanedResponse.lastIndexOf(']') + 1;
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No JSON array found in response');
      }
      cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd);

      // Remove Markdown code block markers and language identifier
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```[a-zA-Z]*\n/, '');
        cleanedResponse = cleanedResponse.replace(/```$/, '');
        cleanedResponse = cleanedResponse.trim();
      }

      // Additional cleanup for stray backticks or newlines
      cleanedResponse = cleanedResponse.replace(/`/g, '');

      // Log the cleaned response for debugging
      console.log('Cleaned Gemini response:', cleanedResponse);

      parsedSuggestions = JSON.parse(cleanedResponse);
      if (!Array.isArray(parsedSuggestions)) throw new Error('Invalid response format: not an array');
    } catch (parseError) {
      console.error('Error parsing Gemini response:', {
        error: parseError.message,
        rawResponse: updatedSuggestions,
        cleanedResponse: cleanedResponse || 'No cleaned response',
      });
      return res.status(500).json({ message: `Invalid response format from Gemini API: ${parseError.message}` });
    }

    res.json({ updatedSuggestions: parsedSuggestions });
  } catch (error) {
    console.error('Error in updateCode:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    });
    res.status(500).json({ message: `Failed to update code: ${error.message}` });
  }
}

module.exports = { updateCode };