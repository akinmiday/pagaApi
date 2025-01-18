# Paga Bill Payment API

This open-source Node.js project integrates with the Paga APIs to facilitate services such as airtime purchase, data bundles, merchant payments, and more. It incorporates Firebase for user and transaction management, making it a robust and scalable solution for digital payments.

---

## Features

- Retrieve available mobile operators, banks, and merchants.
- Purchase airtime or data bundles for any phone number.
- Perform merchant payments and log transactions in Firestore.
- Check transaction statuses.
- Retrieve merchant services and account details.
- Secure Firebase integration for user authentication and transaction management.
- Create and log in users using Firebase Authentication.

---

## Prerequisites

Before you begin, ensure the following:

1. **Firebase Account**:

   - Create a Firebase project via [Firebase Console](https://console.firebase.google.com).
   - Enable Firestore in the Firebase project and set up the necessary collections and rules.
   - Generate a Firebase Admin SDK JSON file under **Project Settings > Service Accounts** and download it.

2. **Node.js**:

   - Install Node.js (version 14 or higher). Download it [here](https://nodejs.org/).

3. **Paga API Credentials**:

   - Obtain credentials by registering for a Paga developer account.

4. **Environment Variables**:
   - Set up API keys, credentials, and Firebase configurations.
     
5. **Create User**:  
   - User must be created in firebase auth with balance before purchase can be made(Create user endpoint in ApiDoc section(10)  of readmi).
   - For all purchase, accessToken and UserID must be passed.

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/akinmiday/paga-service-api.git
cd paga-service-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Configuration

- Place the Firebase Admin SDK JSON file in the `config/` directory.
- Rename the file to `firebase-adminsdk.json`.

### 4. Set Up `.env` File

Create a `.env` file in the root directory and add the following:

```plaintext
PAGA_URL=https://secure.paga.com
PAGA_PRINCIPAL_PUBLIC_KEY=your_principal_public_key
PAGA_CREDENTIAL=your_credential
PAGA_API_KEY_HMAC=your_hmac_key
FIREBASE_API_KEY= firebase_web_api_key
```

### 5. Start the Server

Run the server locally:

```bash
npm run start
```

The server will be available at `http://localhost:3000`.

---

## API Documentation

### 1. Get Mobile Operators

**Endpoint**: `/api/mobile-operators`  
**Method**: GET

**Description**: Retrieve a list of available mobile operators.

**Request Query Parameters**:

- `locale` (optional): Specify the locale (e.g., `"en"`).

**Sample Response**:

```json
[
  {
    "operatorName": "MTN",
    "publicId": "operator-id",
    "services": ["airtime", "data"]
  }
]
```

---

### 2. Get Banks

**Endpoint**: `/api/banks`  
**Method**: GET

**Description**: Fetch a list of supported banks.

**Request Query Parameters**:

- `locale` (optional): Specify the locale (e.g., `"en"`).

**Sample Response**:

```json
[
  {
    "bankName": "Access Bank",
    "bankCode": "044"
  }
]
```

---

### 3. Get Merchants

**Endpoint**: `/api/merchants`  
**Method**: GET

**Description**: Retrieve a list of supported merchants.

**Request Query Parameters**:

- `locale` (optional): Specify the locale (e.g., `"en"`).

**Sample Response**:

```json
[
  {
    "merchantName": "Shoprite",
    "publicId": "merchant-id"
  }
]
```

---

### 4. Airtime Purchase

**Endpoint**: `/api/airtime-purchase`  
**Method**: POST

**Description**: Purchase airtime or data bundles for a user.

**Request Body**:

```json
{
  "amount": "1000",
  "destinationNumber": "08012345678",
  "mobileOperatorPublicId": "operator-id",
  "userId": "firebase-user-id",
  "accessToken": "firebase-access-token",
  "isDataBundle": false
}
```

**Sample Response**:

```json
{
  "status": "success",
  "transactionId": "123456789",
  "details": "Airtime purchased successfully."
}
```

---

### 5. Get Data Bundles

**Endpoint**: `/api/getdatabundle`  
**Method**: POST

**Description**: Retrieve available data bundles for a specific mobile operator.

**Request Body**:

```json
{
  "operatorPublicId": "operator-id"
}
```

**Sample Response**:

```json
[
  {
    "bundleName": "1GB Monthly",
    "price": "1000",
    "validity": "30 days"
  }
]
```

---

### 6. Get Merchant Services

**Endpoint**: `/api/merchant-services`  
**Method**: POST

**Description**: Retrieve services offered by a specific merchant.

**Request Body**:

```json
{
  "merchantPublicId": "merchant-id"
}
```

**Sample Response**:

```json
[
  {
    "serviceName": "Electricity Bill",
    "serviceCode": "electricity"
  }
]
```

---

### 7. Merchant Payment

**Endpoint**: `/api/merchant-payment`  
**Method**: POST

**Description**: Make a payment to a merchant.

**Request Body**:

```json
{
  "amount": "5000",
  "merchantAccount": "merchant-id",
  "merchantReferenceNumber": "ref-id",
  "currency": "NGN",
  "merchantService": "service-type",
  "locale": "en",
  "userId": "firebase-user-id",
  "accessToken": "firebase-access-token",
  "billType": "electricity"
}
```

**Sample Response**:

```json
{
  "status": "success",
  "transactionId": "987654321",
  "details": "Payment processed successfully."
}
```

---

### 8. Get Merchant Account Details

**Endpoint**: `/api/merchantAccountDetails`  
**Method**: POST

**Description**: Retrieve account details for a specific merchant.

**Request Body**:

```json
{
  "merchantAccount": "merchant-id",
  "merchantReferenceNumber": "ref-id",
  "merchantServiceProductCode": "product-code"
}
```

**Sample Response**:

```json
{
  "merchantName": "Shoprite",
  "balance": "50000",
  "currency": "NGN"
}
```

---

### 9. Transaction Status

**Endpoint**: `/api/transaction-status`  
**Method**: POST

**Description**: Check the status of a specific transaction.

**Request Body**:

```json
{
  "referenceNumber": "transaction-ref-id",
  "locale": "en"
}
```

**Sample Response**:

```json
{
  "status": "completed",
  "transactionDetails": {
    "amount": "5000",
    "merchant": "merchant-name",
    "date": "2025-01-01"
  }
}
```

---

### 10. Create User

**Endpoint:** /user/create-users  
**Method:** POST  

**Description:** Create a new user in Firebase Authentication and Firestore.  

**Request Body:**  

json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe",
  "initialBalance": 1000
}


- email (required): The user's email address.  
- password (required): A secure password for the user.  
- displayName (required): The user's display name.  
- initialBalance (optional): The user's initial balance (default is 0).  

**Sample Response:**  

json
{
  "message": "User created successfully",
  "user": {
    "userID": "firebase-user-id",
    "displayName": "John Doe",
    "email": "user@example.com",
    "balance": 1000,
    "createdAt": "2025-01-01T12:00:00Z"
  }
}


### 11. Login User

**Endpoint:** /user/auth/login  
**Method:** POST  

**Description:** Log in a user with their email and password using Firebase Authentication.  

**Request Body:**  

json
{
  "email": "user@example.com",
  "password": "securePassword123"
}


- email (required): The user's email address.  
- password (required): The user's password.  

**Sample Response:**  

json
{
  "message": "Login successful",
  "userID": "firebase-user-id",
  "accessToken": "firebase-access-token",
  "refreshToken": "firebase-refresh-token",
  "expiresIn": "3600"
}


---

## Environment Variables

The following variables are required in the .env file:

- PAGA_URL: Paga API base URL.
- PAGA_PRINCIPAL_PUBLIC_KEY: Paga principal public key.
- PAGA_CREDENTIAL: Paga credential.
- PAGA_API_KEY_HMAC: Paga HMAC key.
- FIREBASE_API_KEY: Firebase web API key for user authentication.
- PORT: Port for the server to listen on.

---

## Firestore Setup

### Required Collections:

- **userInfo**: Stores user details and balances.
- **buyAirtimeNotifications**: Logs airtime purchases.
- **buyDataNotifications**: Logs data bundle purchases.
- **merchantTransactions**: Logs merchant payments.
- **failedTransactions**: Tracks failed transactions for debugging.

### Example Firestore Rules:
plaintext
match /{document=**} {
  allow read, write: if request.auth != null;
}


---

## Testing

1. Use tools like Postman or cURL to send HTTP requests to the endpoints.
2. Verify database updates in Firestore.

---

## Contribution

We welcome contributions! To contribute:

1. Fork the repository.
2. Create a new branch:
   
bash
   git checkout -b feature/your-feature-name

3. Commit your changes and push to your fork.
4. Open a pull request to the main branch.

---

## Support 
*If you encounter any challenges implementing this project, feel free to reach out to me on Twitter/X at https://x.com/akinmiday.*


## License

This project is licensed under the MIT License.

The MIT License is a permissive license that allows you to freely use, modify, and distribute this software. It provides no warranties, and its only requirement is that you include the original license text in any substantial portions of the software you distribute.
