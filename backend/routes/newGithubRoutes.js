const express = require('express');
const router = express.Router();
const githubController = require('../controllers/newGithubController');

router.get('/auth/github', githubController.redirectToGitHub);
router.get('/auth/callback', githubController.handleCallback);
router.get('/repos', githubController.getRepositories);
router.get('/repos/:owner/:repo/branches', githubController.getBranches);
router.get('/repos/:owner/:repo/contents/:path', githubController.getFileContent);
router.post('/refactor', githubController.refactorCode);
router.post('/repos/:owner/:repo/contents/:path', githubController.updateFile);
router.post('/repos/select', githubController.selectRepositories);

module.exports = router;