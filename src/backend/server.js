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
const pointsRoutes = require("./routes/pointsRoutes"); // import points routes
const redemptionController = require('./controllers/redemptionController');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get("/", (req, res) => {
  res.send("Welcome! API is running. Try /health or /api/auth/register");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.use("/api", authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api", storeRoutes);
app.use("/api", productRoutes);
app.use("/api", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/points", pointsRoutes);

app.post('/redemptions/generate-code', (req, res) => redemptionController.generateRedemptionCode(req, res));
app.post('/api/redemptions/generate-code', (req, res) => redemptionController.generateRedemptionCode(req, res));

const os = require("os");
const networkInterfaces = os.networkInterfaces();
const localIp = Object.values(networkInterfaces)
  .flat()
  .find((i) => i.family === "IPv4" && !i.internal)?.address;

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
