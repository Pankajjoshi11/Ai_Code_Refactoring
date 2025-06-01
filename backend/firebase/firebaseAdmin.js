const admin = require('firebase-admin');
const serviceAccount = require('../ai-powered-legacy-codebase-firebase-adminsdk-fbsvc-be2b16dc25.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
