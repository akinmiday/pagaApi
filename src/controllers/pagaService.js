const axios = require("axios");
require("dotenv").config(); // Load environment variables from .env file
const crypto = require("crypto");
const admin = require("firebase-admin");
const { db } = require("../config/firebaseConfig");

// Base URLs
const baseUrl = process.env.PAGA_URL;

// Generalized function to generate SHA-512 hash
const generateHash = (valuesArray, hashkey) => {
  // Concatenate the array values in the correct order with the hash key
  const concatenatedString = valuesArray.join("") + hashkey;
  // Generate SHA-512 hash
  return crypto.createHash("sha512").update(concatenatedString).digest("hex");
};

// Common function to make API calls
const apiCall = async (endpoint, method, data, headers) => {
  try {
    const url = `${baseUrl}${endpoint}`;
    const response = await axios({
      url,
      method,
      data,
      headers,
    });
    return response.data;
  } catch (error) {
    console.error(
      `Error calling ${endpoint}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Function to get mobile operators
const getMobileOperators = async (referenceNumber, locale) => {
  const hashkey = process.env.PAGA_API_KEY_HMAC;
  const hash = generateHash([referenceNumber, "", ""], hashkey);

  const headers = {
    principal: process.env.PAGA_PRINCIPAL_PUBLIC_KEY,
    credentials: process.env.PAGA_CREDENTIAL,
    hash,
    "Content-Type": "application/json",
  };

  const data = {
    referenceNumber,
    locale,
  };

  return apiCall(
    "/paga-webservices/business-rest/secured/getMobileOperators",
    "POST",
    data,
    headers
  );
};

// Route to get mobile data bundle
const getMobileDataBundle = async (referenceNumber, operatorPublicId) => {
  try {
    const hashkey = process.env.PAGA_API_KEY_HMAC;
    if (!hashkey)
      throw new Error("PAGA_API_KEY_HMAC is missing in environment variables");

    const hash = generateHash([referenceNumber, operatorPublicId], hashkey);

    const headers = {
      principal: process.env.PAGA_PRINCIPAL_PUBLIC_KEY,
      credentials: process.env.PAGA_CREDENTIAL,
      hash,
      "Content-Type": "application/json",
    };

    const data = {
      referenceNumber,
      operatorPublicId,
    };

    return apiCall(
      "/paga-webservices/business-rest/secured/getDataBundleByOperator",
      "POST",
      data,
      headers
    );
  } catch (error) {
    throw error;
  }
};

// Function to get banks
const getBanks = async (referenceNumber, locale) => {
  const hashkey = process.env.PAGA_API_KEY_HMAC;
  const hash = generateHash([referenceNumber, "", ""], hashkey);

  const headers = {
    principal: process.env.PAGA_PRINCIPAL_PUBLIC_KEY,
    credentials: process.env.PAGA_CREDENTIAL,
    hash,
    "Content-Type": "application/json",
  };

  const data = {
    referenceNumber,
    locale,
  };

  return apiCall(
    "/paga-webservices/business-rest/secured/getBanks",
    "POST",
    data,
    headers
  );
};

// Function to get merchants
const getMerchants = async (referenceNumber, locale) => {
  const hashkey = process.env.PAGA_API_KEY_HMAC;
  const hash = generateHash([referenceNumber, "", ""], hashkey);

  const headers = {
    principal: process.env.PAGA_PRINCIPAL_PUBLIC_KEY,
    credentials: process.env.PAGA_CREDENTIAL,
    hash,
    "Content-Type": "application/json",
  };

  const data = {
    referenceNumber,
    locale,
  };

  return apiCall(
    "/paga-webservices/business-rest/secured/getMerchants",
    "POST",
    data,
    headers
  );
};

const merchantPayment = async (
  referenceNumber,
  amount,
  merchantAccount,
  merchantReferenceNumber,
  currency,
  merchantService,
  locale,
  userId,
  billType
) => {
  try {
    const hashkey = process.env.PAGA_API_KEY_HMAC;
    if (!hashkey)
      throw new Error("PAGA_API_KEY_HMAC is missing in environment variables");

    // Step 1: Check the user's balance from Firestore
    const userRef = db.collection("userInfo");
    const userSnapshot = await userRef.where("userID", "==", userId).get();
    if (userSnapshot.empty) {
      return { success: false, message: `User with ID ${userId} not found.` };
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userBalance = userData.balance || 0;

    // Ensure the user has sufficient balance
    if (parseInt(userBalance) < parseInt(amount)) {
      return {
        success: false,
        message: "Insufficient balance to complete the payment.",
      };
    }

    // Step 2: Generate hash for Paga API request
    const hash = generateHash(
      [referenceNumber, amount, merchantAccount, merchantReferenceNumber],
      hashkey
    );

    // Prepare headers for the API call
    const headers = {
      principal: process.env.PAGA_PRINCIPAL_PUBLIC_KEY,
      credentials: process.env.PAGA_CREDENTIAL,
      hash,
      "Content-Type": "application/json",
    };

    // Prepare data for the API call
    const data = {
      merchantReferenceNumber,
      amount,
      merchantAccount,
      referenceNumber,
      currency,
      merchantService,
      locale,
    };

    // Step 3: Call the Paga merchant payment API using the apiCall function
    const response = await apiCall(
      "/paga-webservices/business-rest/secured/merchantPayment",
      "POST",
      data,
      headers
    );

    // Step 4: If the Paga API call was successful, deduct the balance
    if (response.responseCode === 0) {
      // Assuming 0 is the success response code
      const updatedBalance = userBalance - amount;

      // Update the user's balance in Firestore
      await userRef.doc(userDoc.id).update({ balance: updatedBalance });

      // Determine the Firestore collection based on the billType
      let collectionName;
      switch (billType) {
        case "sportybet":
          collectionName = "sportyBetTransactions";
          break;
        case "electricity":
          collectionName = "buyElectricity";
          break;
        case "cable":
          collectionName = "cableTransactions";
          break;
        default:
          collectionName = "genericTransactions"; // Fallback collection
      }

      // Step 5: Log the transaction in the appropriate Firestore collection
      const notificationsRef = db.collection(collectionName);
      const notificationData = {
        amount: amount.toString(),
        merchantReferenceNumber,
        merchantAccount,
        status: "success",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        transactionId: referenceNumber,
        userId: userId,
        response,
      };

      // Conditionally add merchantService if available
      if (merchantService) {
        notificationData.merchantService = merchantService;
      }

      // Save the notification to Firestore
      await notificationsRef.add(notificationData);

      return {
        success: true,
        message: "Merchant payment successful.",
        updatedBalance,
        transaction: response,
      };
    } else {
      // Log the failed transaction
      const notificationsRef = db.collection("failedTransactions");
      await notificationsRef.add({
        amount: amount.toString(),
        merchantReferenceNumber,
        merchantAccount,
        status: "failed",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        transactionId: referenceNumber,
        userId: userId,
        response,
      });

      return { success: false, message: "Merchant payment failed.", response };
    }
  } catch (error) {
    console.error("Error in merchant payment:", error);
    return {
      success: false,
      message: "Error processing merchant payment",
      error,
    };
  }
};

// Function to get merchant services from Paga API
const getMerchantServices = async (referenceNumber, merchantPublicId) => {
  try {
    const hashkey = process.env.PAGA_API_KEY_HMAC;
    if (!hashkey)
      throw new Error("PAGA_API_KEY_HMAC is missing in environment variables");

    const hash = generateHash([referenceNumber, merchantPublicId], hashkey);

    const headers = {
      principal: process.env.PAGA_PRINCIPAL_PUBLIC_KEY,
      credentials: process.env.PAGA_CREDENTIAL,
      hash,
      "Content-Type": "application/json",
    };

    const data = {
      referenceNumber,
      merchantPublicId,
      locale: "en",
    };

    return apiCall(
      "/paga-webservices/business-rest/secured/getMerchantServices",
      "POST",
      data,
      headers
    );
  } catch (error) {
    throw error;
  }
};

// Function to get merchant account details
const getMerchantAccountDetails = async (
  referenceNumber,
  merchantAccount,
  merchantReferenceNumber,
  merchantServiceProductCode = null
) => {
  try {
    const hashkey = process.env.PAGA_API_KEY_HMAC;
    if (!hashkey)
      throw new Error("PAGA_API_KEY_HMAC is missing in environment variables");

    const hash = generateHash(
      [
        referenceNumber,
        merchantAccount,
        merchantReferenceNumber,
        merchantServiceProductCode || "",
      ],
      hashkey
    );

    const headers = {
      principal: process.env.PAGA_PRINCIPAL_PUBLIC_KEY,
      credentials: process.env.PAGA_CREDENTIAL,
      hash,
      "Content-Type": "application/json",
    };

    const data = {
      referenceNumber,
      merchantAccount,
      merchantReferenceNumber,
      merchantServiceProductCode,
    };

    return apiCall(
      "/paga-webservices/business-rest/secured/getMerchantAccountDetails",
      "POST",
      data,
      headers
    );
  } catch (error) {
    console.error("Error in getMerchantAccountDetails:", error.message);
    throw error;
  }
};

const airtimePurchase = async (
  referenceNumber,
  amount,
  destinationPhoneNumber,
  mobileOperatorPublicId,
  userId,
  isDataBundle,
  mobileOperatorServiceId
) => {
  if (
    !referenceNumber ||
    !amount ||
    !destinationPhoneNumber ||
    !mobileOperatorPublicId ||
    !userId
  ) {
    return {
      success: false,
      message: "Invalid input: All fields are required.",
    };
  }

  try {
    // Step 1: Check the user's balance from Firestore
    const userRef = db.collection("userInfo");
    const userSnapshot = await userRef.where("userID", "==", userId).get();
    if (userSnapshot.empty) {
      return { success: false, message: `User with ID ${userId} not found.` };
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userBalance = userData.balance || 0;

    // Ensure the user has sufficient balance
    if (userBalance < amount) {
      return {
        success: false,
        message: "Insufficient balance to complete the airtime purchase.",
      };
    }

    // Step 2: Generate hash for Paga API request
    const hashkey = process.env.PAGA_API_KEY_HMAC;
    const hash = generateHash(
      [referenceNumber, amount, destinationPhoneNumber],
      hashkey
    );

    // Prepare headers for the API call
    const headers = {
      principal: process.env.PAGA_PRINCIPAL_PUBLIC_KEY,
      credentials: process.env.PAGA_CREDENTIAL,
      hash,
      "Content-Type": "application/json",
    };

    // Prepare data for the API call
    const data = {
      referenceNumber,
      mobileOperatorPublicId,
      amount,
      currency: "NGN",
      destinationPhoneNumber,
      isSuppressRecipientMessages: false,
      isDataBundle,
      mobileOperatorServiceId,
    };

    // Step 3: Call the Paga airtime purchase API using the apiCall function
    const response = await apiCall(
      "/paga-webservices/business-rest/secured/airtimePurchase",
      "POST",
      data,
      headers
    );
    console.log(response);
    // Step 4: If the Paga API call was successful, deduct the balance
    if (response.responseCode === 0) {
      const updatedBalance = userBalance - amount;

      // Update the user's balance in Firestore
      await userRef.doc(userDoc.id).update({ balance: updatedBalance });

      // Determine the collection to save the notification to
      const notificationsRef = db.collection(
        isDataBundle ? "buyDataNotifications" : "buyAirtimeNotifications"
      );

      // Step 5: Log the transaction in the appropriate collection
      await notificationsRef.add({
        amount: amount.toString(),
        phoneNumber: destinationPhoneNumber,
        status: "success",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        transactionId: referenceNumber,
        userId: userId,
      });

      return {
        success: true,
        message: isDataBundle
          ? "Data bundle purchase successful."
          : "Airtime purchase successful.",
        updatedBalance,
        transaction: response,
      };
    } else {
      // Step 5b: Log the failed transaction in the appropriate collection
      const notificationsRef = db.collection(
        isDataBundle ? "buyDataNotifications" : "buyAirtimeNotifications"
      );
      await notificationsRef.add({
        amount: amount.toString(),
        phoneNumber: destinationPhoneNumber,
        status: "failed",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        transactionId: referenceNumber,
        userId: userId,
      });

      return {
        success: false,
        message: isDataBundle
          ? "Data bundle purchase failed."
          : "Airtime purchase failed.",
        response,
      };
    }
  } catch (error) {
    console.error("Error in airtime purchase:", error);
    return {
      success: false,
      message: "Error processing airtime purchase",
      error,
    };
  }
};

// Function to check transaction status
const transactionStatus = async (referenceNumber, locale = "en") => {
  try {
    const hashkey = process.env.PAGA_API_KEY_HMAC;
    if (!hashkey)
      throw new Error("PAGA_API_KEY_HMAC is missing in environment variables");

    const hash = generateHash([referenceNumber], hashkey);

    const headers = {
      principal: process.env.PAGA_PRINCIPAL_PUBLIC_KEY,
      credentials: process.env.PAGA_CREDENTIAL,
      hash,
      "Content-Type": "application/json",
    };

    const data = {
      referenceNumber,
      locale,
    };

    return apiCall(
      "/paga-webservices/business-rest/secured/transactionStatus",
      "POST",
      data,
      headers
    );
  } catch (error) {
    console.error("Error in transactionStatus:", error.message);
    throw error;
  }
};

module.exports = {
  getMobileOperators,
  getBanks,
  getMerchants,
  airtimePurchase,
  getMobileDataBundle,
  getMerchantServices,
  merchantPayment,
  getMerchantAccountDetails,
  transactionStatus,
};
