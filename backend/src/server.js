const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const conversationRoutes = require('./routes/conversations');
const vocabularyRoutes = require('./routes/vocabulary');

const app = express();
const PORT = process.env.PORT || 8000;

/* =========================
   MIDDLEWARE
========================= */

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   ROUTES API
========================= */

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/vocabulary', vocabularyRoutes);

/* =========================
   HEALTH CHECK
========================= */

app.get('/', (req, res) => {
  res.json({
    status: "OK",
    service: "LinguaAI API",
    time: new Date().toISOString()
  });
});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.message);
  res.status(500).json({
    error: "Internal Server Error"
  });
});

/* =========================
   START SERVER
========================= */

const startServer = async () => {
  try {
    console.log("⏳ Connecting to database...");

    await testConnection();

    app.listen(PORT, () => {
      console.log("==================================");
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV}`);
      console.log("==================================");
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();