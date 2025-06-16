const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

console.log('Loaded GITHUB_REDIRECT_URI:', process.env.GITHUB_REDIRECT_URI);

const redirectToGitHub = (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  req.session.state = state;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GITHUB_REDIRECT_URI)}&scope=repo&state=${state}`;
  console.log('Redirecting to GitHub with authUrl:', authUrl);
  res.redirect(authUrl);
};

const handleCallback = async (req, res) => {
  const { code, state } = req.query;
  console.log('Callback received:', { code, state, sessionState: req.session.state, redirectUri: process.env.GITHUB_REDIRECT_URI });
  if (!code || !state || state !== req.session.state) {
    console.error('Invalid callback:', { code, state, sessionState: req.session.state });
    return res.status(400).json({ error: 'Invalid callback parameters or state mismatch' });
  }

  try {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI, // Fixed from REDIRECT_URL
    }, {
      headers: { Accept: 'application/json' },
    });

    console.log('Token exchange response:', response.data);

    if (response.data.error) {
      console.error('GitHub token exchange error:', response.data);
      return res.status(400).json({ error: response.data.error_description });
    }

    req.session.accessToken = response.data.access_token;
    req.session.save(err => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      console.log('Access token saved in session:', req.session.accessToken);
      res.redirect(process.env.FRONTEND_URL);
    });
  } catch (error) {
    console.error('Error exchanging code:', error.message, error.response?.data);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

const getRepositories = async (req, res) => {
  console.log('Session accessToken:', req.session.accessToken);
  if (!req.session.accessToken) {
    console.error('No access token in session');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { Octokit } = await import('@octokit/core');
  const octokit = new Octokit({ auth: req.session.accessToken });
  try {
    const response = await octokit.request('GET /user/repos');
    const allowedRepos = req.session.selectedRepos
      ? response.data.filter(repo => req.session.selectedRepos.includes(repo.id))
      : response.data;
    console.log('Fetched repositories:', allowedRepos.length);
    res.json(allowedRepos);
  } catch (error) {
    console.error('Error fetching repos:', error.message, error.response?.data);
    res.status(500).json({ error: 'Error fetching repositories' });
  }
};

const getBranches = async (req, res) => {
  if (!req.session.accessToken) {
    console.error('No access token in session');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { owner, repo } = req.params;
  const { Octokit } = await import('@octokit/core');
  const octokit = new Octokit({ auth: req.session.accessToken });
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/branches', { owner, repo });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching branches:', error.message, error.response?.data);
    res.status(500).json({ error: 'Error fetching branches' });
  }
};

const getFileContent = async (req, res) => {
  if (!req.session.accessToken) {
    console.error('No access token in session');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { owner, repo, path } = req.params;
  const branch = req.query.branch || 'main';
  const { Octokit } = await import('@octokit/core');
  const octokit = new Octokit({ auth: req.session.accessToken });
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      ref: branch,
    });
    const content = Buffer.from(response.data.content, 'base64').toString('utf8');
    res.json({ content });
  } catch (error) {
    console.error('Error fetching file:', error.message, error.response?.data);
    res.status(500).json({ error: 'Error fetching file' });
  }
};

const refactorCode = async (req, res) => {
  const { code } = req.body;
  try {
    const refactoredCode = code.replace(/function/g, 'const'); // Placeholder
    res.json({ refactoredCode });
  } catch (error) {
    console.error('Error refactoring code:', error.message);
    res.status(500).json({ error: 'Error refactoring code' });
  }
};

const updateFile = async (req, res) => {
  if (!req.session.accessToken) {
    console.error('No access token in session');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { owner, repo, path } = req.params;
  const { content, branch, message } = req.body;
  const { Octokit } = await import('@octokit/core');
  const octokit = new Octokit({ auth: req.session.accessToken });
  try {
    const currentFile = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      ref: branch,
    });
    const sha = currentFile.data.sha;
    const response = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path,
      message: message || 'Refactored code by AI',
      content: Buffer.from(content).toString('base64'),
      sha,
      branch,
    });
    res.json({ success: true, commit: response.data.commit });
  } catch (error) {
    console.error('Error pushing file:', error.message, error.response?.data);
    res.status(500).json({ error: 'Error patching file' });
  }
};

const selectRepositories = async (req, res) => {
  if (!req.session.accessToken) {
    console.error('No access token in session');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { selectedRepos } = req.body;
  try {
    req.session.selectedRepos = selectedRepos;
    console.log('Selected repos saved:', selectedRepos);
    res.json({ success: true });
  } catch (error) {
    console.error('Error selecting repos:', error.message);
    res.status(500).json({ error: 'Error selecting repositories' });
  }
};

module.exports = {
  redirectToGitHub,
  handleCallback,
  getRepositories,
  getBranches,
  getFileContent,
  refactorCode,
  updateFile,
  selectRepositories,
};