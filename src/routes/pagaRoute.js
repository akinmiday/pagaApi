const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const pagaService = require("../controllers/pagaService"); // Import the Paga service
const admin = require("firebase-admin");

// Route to get mobile operators
router.get("/mobile-operators", async (req, res) => {
  try {
    const referenceNumber = uuidv4(); // Generate a unique reference number
    const locale = "en"; // or your preferred locale

    const response = await pagaService.getMobileOperators(
      referenceNumber,
      locale
    );
    res.json(response); // Send the response back to the client
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch mobile operators" });
  }
});

// Route to get banks
router.get("/banks", async (req, res) => {
  try {
    const referenceNumber = uuidv4(); // Generate a unique reference number
    const locale = "en"; // or your preferred locale

    const response = await pagaService.getBanks(referenceNumber, locale);
    res.json(response); // Send the response back to the client
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

// Route to get merchants
router.get("/merchants", async (req, res) => {
  try {
    const referenceNumber = uuidv4();
    const locale = "en";

    const response = await pagaService.getMerchants(referenceNumber, locale);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch merchants" });
  }
});

// Route to handle airtime purchase
router.post("/airtime-purchase", async (req, res) => {
  try {
    const referenceNumber = uuidv4(); // Generate a unique reference number
    const {
      mobileOperatorPublicId,
      amount,
      destinationNumber,
      userId,
      accessToken,
      isDataBundle,
      mobileOperatorServiceId,
    } = req.body;
    if (
      !accessToken ||
      !userId ||
      !amount ||
      !mobileOperatorPublicId ||
      !destinationNumber
    ) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    console.log(mobileOperatorServiceId);
    // Verify the accessToken using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(accessToken);

    // Check if the userID from the token matches the userID in the request
    if (decodedToken.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Token does not match userId." });
    }

    // Proceed with the airtime purchase via Paga API
    const response = await pagaService.airtimePurchase(
      referenceNumber,
      amount,
      destinationNumber,
      mobileOperatorPublicId,
      userId,
      isDataBundle,
      mobileOperatorServiceId
    );
    console.log(response);
    // Return the response from Paga API
    res.json(response);
  } catch (error) {
    console.error("Error in airtime purchase:", error);
    res.status(500).json({ error: "Failed to purchase airtime" });
  }
});

// Route to get mobile data bundle
router.post("/getdatabundle", async (req, res) => {
  try {
    const referenceNumber = uuidv4();
    const { operatorPublicId } = req.body; // Use body for GET request

    const response = await pagaService.getMobileDataBundle(
      referenceNumber,
      operatorPublicId
    );
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data bundle" });
  }
});

// Route to get merchant services
router.post("/merchant-services", async (req, res) => {
  try {
    const referenceNumber = uuidv4();
    const { merchantPublicId } = req.body;

    const response = await pagaService.getMerchantServices(
      referenceNumber,
      merchantPublicId
    );
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch merchant services",
      details: error.message,
    });
  }
});

// Route to make a merchant payment
router.post("/merchantPayment", async (req, res) => {
  try {
    const referenceNumber = uuidv4(); // Generate a unique reference number
    const {
      merchantReferenceNumber,
      amount,
      merchantAccount,
      currency,
      merchantService,
      locale,
      accessToken,
      userId,
      billType,
    } = req.body;

    // Validate mandatory parameters
    if (
      !merchantReferenceNumber ||
      !amount ||
      !merchantAccount ||
      !referenceNumber ||
      !accessToken ||
      !userId
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: merchantReferenceNumber, amount, merchantAccount, referenceNumber, accessToken, userId",
      });
    }

    // Verify the accessToken using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(accessToken);

    // Check if the userID from the token matches the userID in the request
    if (decodedToken.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized: Token does not match userId." });
    }

    // Proceed with the merchant payment via Paga API
    const response = await pagaService.merchantPayment(
      referenceNumber,
      amount,
      merchantAccount,
      merchantReferenceNumber,
      currency,
      merchantService,
      locale,
      userId,
      billType
    );
    console.log(response);
    // Return the response from Paga API
    res.json(response);
  } catch (error) {
    console.error("Error processing merchant payment:", error.message);
    res.status(500).json({
      error: "Failed to process merchant payment",
      message: error.message,
    });
  }
});

// Route to get merchant account details
router.post("/merchantAccountDetails", async (req, res) => {
  try {
    const referenceNumber = uuidv4();
    const {
      merchantAccount,
      merchantReferenceNumber,
      merchantServiceProductCode,
    } = req.body;

    // Validate mandatory parameters
    if (!referenceNumber || !merchantAccount || !merchantReferenceNumber) {
      return res.status(400).json({
        error:
          "Missing required fields: referenceNumber, merchantAccount, merchantReferenceNumber",
      });
    }

    // Call the Paga service to get merchant account details
    const response = await pagaService.getMerchantAccountDetails(
      referenceNumber,
      merchantAccount,
      merchantReferenceNumber,
      merchantServiceProductCode
    );
    console.log(response);
    // Return the successful response from Paga service
    res.json(response);
  } catch (error) {
    // Log and return the error in case of failure
    console.error("Error fetching merchant account details:", error.message);
    res.status(500).json({
      error: "Failed to fetch merchant account details",
      message: error.message,
    });
  }
});

// Route to check transaction status
router.post("/transactionStatus", async (req, res) => {
  try {
    const { referenceNumber, locale } = req.body;

    // Validate mandatory parameters
    if (!referenceNumber) {
      return res
        .status(400)
        .json({ error: "Missing required field: referenceNumber" });
    }

    // Call the Paga service to check transaction status
    const response = await pagaService.transactionStatus(
      referenceNumber,
      locale
    );

    // Return the successful response from Paga service
    res.json(response);
  } catch (error) {
    // Log and return the error in case of failure
    console.error("Error checking transaction status:", error.message);
    res.status(500).json({
      error: "Failed to check transaction status",
      message: error.message,
    });
  }
});

module.exports = router;
