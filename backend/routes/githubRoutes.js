const express = require('express');
const router = express.Router();
const {
  initGithubAuth,
  githubLogin,
  githubCallback,
  getRepositories,
  getBranches,
  saveProjectContext
} = require('../controllers/githubControllers');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/init-github-auth', authMiddleware, initGithubAuth);
router.get('/auth/github', githubLogin);
router.get('/auth/github/callback', githubCallback); // Removed authMiddleware
router.get('/github/repos/:user_id', authMiddleware, getRepositories);
router.get('/github/branches/:user_id/:repo_owner/:repo_name', authMiddleware, getBranches);
router.post('/github/save-context/:user_id/:project_id/:workspace_id', authMiddleware, saveProjectContext);

module.exports = router;