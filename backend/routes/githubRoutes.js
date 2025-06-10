const express = require('express');
const router = express.Router();
const {
  githubLogin,
  githubCallback,
  getRepositories,
  getBranches,
  saveProjectContext
} = require('../controllers/githubControllers');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/auth/github', authMiddleware, githubLogin);
router.get('/auth/github/callback', authMiddleware, githubCallback);
router.get('/github/repos/:user_id', authMiddleware, getRepositories);
router.get('/github/branches/:user_id/:repo_owner/:repo_name', authMiddleware, getBranches);
router.post('/github/save-context/:user_id/:project_id/:workspace_id', authMiddleware, saveProjectContext);

module.exports = router;