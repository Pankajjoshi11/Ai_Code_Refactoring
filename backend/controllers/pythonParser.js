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
    const result = await new Promise((resolve, reject) => {
      PythonShell.run('parse.py', options, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    }).timeout(10000); // 10s timeout

    if (!result || !result[0]) {
      return res.status(500).json({ message: 'No output from Python parser' });
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(result[0]);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return res.status(500).json({ message: 'Invalid output from Python parser' });
    }

    res.json(parsedResult);
  } catch (error) {
    console.error('Python parsing error:', error);
    res.status(500).json({ message: 'Failed to parse Python code' });
  }
}

// Add timeout method to Promise (polyfill)
Promise.prototype.timeout = function (ms) {
  return Promise.race([
    this,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms)),
  ]);
};

module.exports = { parsePythonCode };