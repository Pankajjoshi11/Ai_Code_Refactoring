require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const updateRoute = require('./routes/updateRoutes');
const pythonRoute = require('./routes/pythonRoutes');
const jsRoute = require('./routes/jsRoutes');
const githubRoutes = require('./routes/newGithubRoutes');

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, sameSite: 'lax' },
}));

// Rate limiting for /api/update to prevent abuse
const updateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests for AI suggestions. Please try again later.',
});
app.use('/api/update', updateLimiter);

// JSON parsing
app.use(express.json());

// Routes
app.use('/api/update', updateRoute);
app.use('/api/python', pythonRoute);
app.use('/api/js', jsRoute);
app.use('/', githubRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error. Please try again later.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});