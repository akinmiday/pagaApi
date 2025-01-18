const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin SDK
const serviceAccount = require("../config/swegztradeapp-2e9fc-firebase-adminsdk-cw51g-cd706fdefd.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "swegztradeapp-2e9fc.appspot.com",
  ignoreUndefinedProperties: true, // Enable ignoring undefined properties
});

// Initialize Firestore and Firebase Storage
const db = getFirestore();
const bucket = admin.storage().bucket();

module.exports = { db, bucket };
