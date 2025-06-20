const express = require('express');
const router = express.Router();
const { updateCode } = require('../controllers/updateControllers');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, updateCode);

module.exports = router;