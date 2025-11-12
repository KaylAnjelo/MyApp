const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { supabase } = require("./supabaseClient.js");
const authRoutes = require("./routes/authRoutes"); // import your auth routes
const storeRoutes = require("./routes/storeRoutes"); // import your new store routes
const productRoutes = require("./routes/productRoutes"); // import product routes
const userRoutes = require("./routes/userRoutes"); // import user/profile routes
const transactionRoutes = require("./routes/transactionRoutes"); // import transaction routes

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (req, res) => {
  res.send("Welcome! API is running. Try /health or /api/auth/register");
});

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Use routes
app.use("/api", authRoutes);  // for /api/auth/*
app.use("/api", storeRoutes); // for /api/stores
app.use("/api", productRoutes); // for /api/products
app.use("/api", userRoutes); // for /api/user/profile
app.use("/api/transactions", transactionRoutes); // for /api/transactions

// Optional: print local network IP for testing from other devices
const os = require("os");
const networkInterfaces = os.networkInterfaces();
const localIp = Object.values(networkInterfaces)
  .flat()
  .find((i) => i.family === "IPv4" && !i.internal)?.address;

app.listen(PORT, () => {
  console.log(`Server is running at:`);
  console.log(`- Local:   http://localhost:${PORT}`);
  if (localIp) console.log(`- Network: http://${localIp}:${PORT}`);
});

module.exports = app;
