const express = require('express');
const router = express.Router();
const { parseJavaScriptCode } = require('../controllers/jsParser');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/parse', authMiddleware, parseJavaScriptCode);

module.exports = router;