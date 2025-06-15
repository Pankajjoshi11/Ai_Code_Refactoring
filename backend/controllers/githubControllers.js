const axios = require('axios');
const jwt = require('jsonwebtoken');
const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI, FRONTEND_BASE_URL } = require('../config/githubConfig');
const admin = require('../firebase/firebaseAdmin');

const STATE_SECRET = process.env.STATE_SECRET;
if (!STATE_SECRET) {
  throw new Error('STATE_SECRET is not defined in environment variables');
}

const initGithubAuth = (req, res) => {
  try {
    const { state } = req.query;
    if (!state) {
      return res.status(400).json({ error: 'State parameter is required' });
    }

    const stateObj = JSON.parse(state);
    if (!stateObj.token) {
      return res.status(400).json({ error: 'Firebase token is required in state' });
    }

    const signedState = jwt.sign(stateObj, STATE_SECRET, { expiresIn: '5m' });
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&scope=repo user&state=${encodeURIComponent(signedState)}`;
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error in initGithubAuth:', error);
    res.status(500).json({ error: 'Failed to initialize GitHub auth' });
  }
};

const githubCallback = async (req, res) => {
  const { code, state } = req.query;

  try {
    // Verify state structure
    if (!state || !code) {
      throw new Error('Missing required parameters: code and state');
    }

    // Verify and decode state
    let decodedState;
    try {
      decodedState = jwt.verify(state, STATE_SECRET);
    } catch (error) {
      throw new Error(`Invalid state parameter: ${error.message}`);
    }

    // Validate token in state
    const { projectId, workspaceId, token } = decodedState;
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid Firebase token in state');
    }

    // Verify Firebase token with 5 minute tolerance
    const decodedToken = await admin.auth().verifyIdToken(token, {
      expiresIn: '5m'
    });
    const userId = decodedToken.uid;

    // Exchange code for GitHub access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI
      },
      {
        headers: { Accept: 'application/json' },
        timeout: 10000
      }
    );

    if (!tokenResponse.data.access_token) {
      throw new Error('GitHub returned no access token');
    }

    const accessToken = tokenResponse.data.access_token;

    // Store access token in Firestore
    await admin.firestore().collection('users').doc(userId).set(
      { 
        github_token: accessToken,
        github_token_updated: new Date() 
      },
      { merge: true }
    );

    // Build redirect URL
    const baseUrl = FRONTEND_BASE_URL || 'http://localhost:3000';
    const redirectPath = projectId && workspaceId 
      ? `/${userId}/project/${projectId}/workspace/${workspaceId}/integrations`
      : `/${userId}/dashboard`;
    
    res.redirect(`${baseUrl}${redirectPath}?github_auth=success`);
  } catch (error) {
    console.error('GitHub callback error:', error.message);
    const baseUrl = FRONTEND_BASE_URL || 'http://localhost:3000';
    res.redirect(`${baseUrl}/?github_error=${encodeURIComponent(error.message)}`);
  }
};

const getRepositories = async (req, res) => {
  const { user_id } = req.params;

  try {
    const userDoc = await admin.firestore().collection('users').doc(user_id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const accessToken = userDoc.data().github_token;
    if (!accessToken) {
      return res.status(401).json({ error: 'GitHub not connected' });
    }

    const response = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching repositories:', error.message);
    res.status(500).json({ error: 'Failed to fetch repositories', details: error.message });
  }
};

const getBranches = async (req, res) => {
  const { user_id, repo_owner, repo_name } = req.params;

  try {
    const userDoc = await admin.firestore().collection('users').doc(user_id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const accessToken = userDoc.data().github_token;
    if (!accessToken) {
      return res.status(401).json({ error: 'GitHub not connected' });
    }

    const response = await axios.get(
      `https://api.github.com/repos/${repo_owner}/${repo_name}/branches`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching branches:', error.message);
    res.status(500).json({ error: 'Failed to fetch branches', details: error.message });
  }
};

const saveProjectContext = async (req, res) => {
  const { user_id, project_id, workspace_id } = req.params;
  const { repo, branch } = req.body;

  try {
    await admin.firestore().collection('projects').doc(project_id).set(
      {
        workspaces: {
          [workspace_id]: {
            github_repo: repo,
            github_branch: branch
          }
        }
      },
      { merge: true }
    );
    res.status(200).json({ message: 'Context saved' });
  } catch (error) {
    console.error('Error saving GitHub context:', error.message);
    res.status(500).json({ error: 'Failed to save context', details: error.message });
  }
};

module.exports = {
  initGithubAuth,
  githubLogin: (req, res) => res.status(400).json({ error: 'Use /init-github-auth endpoint' }),
  githubCallback,
  getRepositories,
  getBranches,
  saveProjectContext
};