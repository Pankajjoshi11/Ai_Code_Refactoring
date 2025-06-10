const axios = require('axios');
const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_REDIRECT_URI } = require('../config/githubConfig');
const admin = require('../firebase/firebaseAdmin');

const githubLogin = (req, res) => {
  const { state } = req.query; // Capture the state parameter
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_REDIRECT_URI}&scope=repo user&state=${state || ''}`;
  res.redirect(githubAuthUrl);
};

const githubCallback = async (req, res) => {
  const { code, state } = req.query;

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_REDIRECT_URI
      },
      {
        headers: { Accept: 'application/json' }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error('Failed to obtain access token from GitHub');
    }

    // Get GitHub user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userId = req.user.uid; // Use Firebase UID from authMiddleware

    // Store access token in Firebase
    await admin.firestore().collection('users').doc(userId).set(
      { github_token: accessToken },
      { merge: true }
    );

    // Parse the state parameter to get projectId and workspaceId
    let redirectUrl = `http://localhost:3000/${userId}/dashboard`; // Fallback URL
    if (state) {
      try {
        const { projectId, workspaceId } = JSON.parse(state);
        if (projectId && workspaceId) {
          redirectUrl = `http://localhost:3000/${userId}/project/${projectId}/workspace/${workspaceId}/integrations`;
        }
      } catch (error) {
        console.error('Error parsing state parameter:', error);
      }
    }

    // Redirect to the frontend
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in GitHub callback:', error.message);
    res.status(500).json({ error: 'Failed to authenticate with GitHub', details: error.message });
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
  githubLogin,
  githubCallback,
  getRepositories,
  getBranches,
  saveProjectContext
};