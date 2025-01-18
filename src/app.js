require("dotenv").config();
const express = require("express");
const app = express();
const routes = require("./routes/pagaRoute");
const errorHandler = require("./middlewares/errorHandler");
const { logger } = require("./middlewares/logEvents");
const userRoutes = require("./routes/userRoutes");

const PORT = process.env.PORT || 3000;

app.use(logger);

// Middleware to parse JSON request bodies
app.use(express.json());

// for URL encoded Data
app.use(express.urlencoded({ extended: false }));

// Set up routes
app.use("/api", routes);
app.use("/user", userRoutes);

app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
