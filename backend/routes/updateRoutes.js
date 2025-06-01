const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const { updateCode } = require('../controllers/updateControllers');

// Protected route: User must be authenticated with Firebase token
router.post('/', authenticateToken, updateCode);

module.exports = router;
