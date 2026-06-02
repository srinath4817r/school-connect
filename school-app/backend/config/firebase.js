const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let firebaseApp = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully from Environment Variable JSON.');
  } else {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './config/firebase-service-account.json';
    const absolutePath = path.resolve(serviceAccountPath);
    
    if (fs.existsSync(absolutePath)) {
      const serviceAccount = require(absolutePath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully from file.');
    } else {
      console.warn(`Warning: Firebase service account credentials not found in env (FIREBASE_SERVICE_ACCOUNT_JSON) or file (${absolutePath}). Push notifications will not be functional.`);
    }
  }
} catch (error) {
  console.error(`Error initializing Firebase Admin: ${error.message}`);
}

module.exports = {
  admin,
  messaging: firebaseApp ? admin.messaging() : null
};
// If messaging is null, we will mock sendNotification or return a warning in the FCM util.
