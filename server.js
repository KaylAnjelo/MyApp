const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { supabase } = require("./supabaseClient.js");
const authRoutes = require("./routes/authRoutes"); // import your auth routes
const notificationRoutes = require('./routes/notificationRoutes');
const storeRoutes = require("./routes/storeRoutes"); // import your new store routes
const productRoutes = require("./routes/productRoutes"); // import product routes
const userRoutes = require("./routes/userRoutes"); // import user/profile routes
const transactionRoutes = require("./routes/transactionRoutes"); // import transaction routes
const rewardRoutes = require("./routes/rewardRoutes"); // import reward routes

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
app.use('/api/notifications', notificationRoutes);
app.use("/api", storeRoutes); // for /api/stores
app.use("/api", productRoutes); // for /api/products
app.use("/api", userRoutes); // for /api/user/profile
app.use("/api/transactions", transactionRoutes); // for /api/transactions
app.use("/api/rewards", rewardRoutes); // for /api/rewards

// Optional: print local network IP for testing from other devices
const os = require("os");
const networkInterfaces = os.networkInterfaces();
const localIp = Object.values(networkInterfaces)
  .flat()
  .find((i) => i.family === "IPv4" && !i.internal)?.address;

// Quick environment sanity checks (do not print secrets in full)
const supabaseUrlPresent = !!process.env.SUPABASE_URL;
const supabaseAnonPresent = !!process.env.SUPABASE_ANON_KEY;
const anonPreview = supabaseAnonPresent ? `${process.env.SUPABASE_ANON_KEY.substring(0, 8)}...` : 'not-set';

app.listen(PORT, () => {
  console.log(`Server is running at:`);
  console.log(`- Local:   http://localhost:${PORT}`);
  if (localIp) console.log(`- Network: http://${localIp}:${PORT}`);
  console.log(`- Node version: ${process.version}`);
  console.log(`- SUPABASE_URL present: ${supabaseUrlPresent}`);
  console.log(`- SUPABASE_ANON_KEY present: ${supabaseAnonPresent} (${anonPreview})`);
});

module.exports = app;
