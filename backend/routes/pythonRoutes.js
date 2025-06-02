const express = require('express');
const router = express.Router();
const { parsePythonCode } = require('../controllers/pythonParser');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/parse', authMiddleware, parsePythonCode);

module.exports = router;