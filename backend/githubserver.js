const express = require('express');
const session = require('express-session');
const cors = require('cors');
const githubRoutes = require('./routes/newGithubRoutes');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend origin
  credentials: true, // Allow cookies/session
}));

// Middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, sameSite: 'lax' },
}));

// Routes
app.use('/', githubRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = 9000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));