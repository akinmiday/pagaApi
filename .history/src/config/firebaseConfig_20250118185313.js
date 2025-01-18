const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin SDK
const serviceAccount = require("../config/firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "firebaselink.appspot.com",
  ignoreUndefinedProperties: true,
});

// Initialize Firestore and Firebase Storage
const db = getFirestore();
const bucket = admin.storage().bucket();

module.exports = { db, bucket };
