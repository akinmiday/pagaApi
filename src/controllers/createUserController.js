const admin = require("firebase-admin");

/**
 * Creates a new user in Firebase Authentication and Firestore.
 * The user is saved in the "userInfo" collection with a unique `userID` field.
 * @param {Object} req - The request object containing user details.
 * @param {Object} res - The response object.
 */
const createUser = async (req, res) => {
  try {
    const { email, password, displayName, initialBalance } = req.body;

    // Validate input
    if (!email || !password || !displayName) {
      return res.status(400).json({
        error: "Missing required fields: email, password, displayName",
      });
    }

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // Define userInfo document
    const userInfo = {
      userID: userRecord.uid, // Ensure `userID` is saved as a field in the document
      displayName,
      email,
      balance: initialBalance || 0, // Default balance to 0 if not provided
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const db = admin.firestore();
    const userRef = db.collection("userInfo");

    // Check if user already exists in Firestore by querying the `userID` field
    const userSnapshot = await userRef
      .where("userID", "==", userRecord.uid)
      .get();
    if (!userSnapshot.empty) {
      return res.status(409).json({
        error: `User with ID ${userRecord.uid} already exists.`,
      });
    }

    // Add the user to Firestore
    await userRef.add(userInfo);

    // Respond with success and user details
    res.status(201).json({
      message: "User created successfully",
      user: userInfo,
    });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({
      error: "Failed to create user",
      details: error.message,
    });
  }
};

const axios = require("axios");

/**
 * Logs in a user with email and password using Firebase Authentication.
 * @param {Object} req - The request object containing email and password.
 * @param {Object} res - The response object.
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Missing required fields: email and password",
      });
    }

    // Firebase REST API URL for sign-in with email and password
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;

    // Make a POST request to Firebase Authentication REST API
    const response = await axios.post(url, {
      email,
      password,
      returnSecureToken: true,
    });

    const { localId, idToken, refreshToken, expiresIn } = response.data;

    // Respond with user details and tokens
    res.status(200).json({
      message: "Login successful",
      userID: localId,
      accessToken: idToken,
      refreshToken,
      expiresIn,
    });
  } catch (error) {
    console.error("Error logging in user:", error.message);

    // Handle Firebase REST API errors
    if (error.response && error.response.data) {
      return res.status(401).json({
        error: error.response.data.error.message || "Invalid login credentials",
      });
    }

    res.status(500).json({
      error: "Failed to log in",
      details: error.message,
    });
  }
};

module.exports = { createUser, loginUser };
