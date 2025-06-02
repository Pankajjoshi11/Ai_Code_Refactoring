const { PythonShell } = require('python-shell');

async function parsePythonCode(req, res) {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Missing code' });
  }

  const options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: './scripts',
    args: [code],
  };

  try {
    const result = await PythonShell.run('parse.py', options);
    const parsedResult = JSON.parse(result[0]);
    res.json(parsedResult);
  } catch (error) {
    console.error('Python parsing error:', error);
    res.status(500).json({ message: 'Failed to parse Python code' });
  }
}

module.exports = { parsePythonCode };