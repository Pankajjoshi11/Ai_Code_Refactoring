const { spawn } = require('child_process');
const path = require('path');

async function parsePythonCode(req, res) {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Missing code' });
  }

  if (code.length > 5 * 1024 * 1024) { // 5MB limit
    return res.status(400).json({ message: 'Code is too large (max 5MB)' });
  }

  try {
    const pythonScriptPath = path.join(__dirname, '../scripts/parse.py');
    const pythonProcess = spawn('python', [pythonScriptPath]);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      console.log('Python script stdout:', data.toString());
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.log('Python script stderr:', data.toString());
    });

    // Set a longer timeout for the Python process
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      throw new Error('Operation timed out after 10 seconds');
    }, 10000); // Increased to 10 seconds

    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);

      console.log(`Python script exited with code ${code}`);

      if (code !== 0) {
        console.error('Python script error:', stderrData);
        return res.status(500).json({ error: 'Invalid Python syntax. Please check the code.', details: stderrData });
      }

      try {
        const result = JSON.parse(stdoutData);
        res.json(result);
      } catch (parseError) {
        console.error('Error parsing Python script output:', parseError, 'Output:', stdoutData);
        res.status(500).json({ error: 'Failed to parse Python script output.', details: parseError.message });
      }
    });

    // Send the code to the Python script via stdin
    console.log('Sending code to Python script, length:', code.length);
    pythonProcess.stdin.write(code);
    pythonProcess.stdin.end();
  } catch (error) {
    console.error('Python parsing error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
}

module.exports = { parsePythonCode };