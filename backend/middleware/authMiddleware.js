const admin = require('../firebase/firebaseAdmin');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const idToken = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // attach user info to req
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = authenticateToken;
