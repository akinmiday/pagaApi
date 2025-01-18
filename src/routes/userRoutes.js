const express = require("express");
const {
  createUser,
  loginUser,
} = require("../controllers/createUserController");

const router = express.Router();

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Public
 */
router.post("/create-users", createUser);

/**
 * @route   POST /api/auth/login
 * @desc    Log in a user and return access token and user ID
 * @access  Public
 */
router.post("/auth/login", loginUser);

module.exports = router;
