require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const scanRoutes = require("./routes/scan");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Startup key validation ──────────────────────────────────────────────────
const missing = [];
if (!process.env.GROQ_API_KEY) missing.push("GROQ_API_KEY");
if (!process.env.GITHUB_TOKEN) missing.push("GITHUB_TOKEN");
if (missing.length) {
  console.warn(`⚠️  Missing env vars: ${missing.join(", ")} — add them to .env`);
} else {
  console.log("✅ API keys loaded: GROQ_API_KEY, GITHUB_TOKEN");
}

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Serve index.html directly from project root
app.use(express.static(path.join(__dirname)));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api", scanRoutes);

// Enhanced health endpoint — frontend uses this to check key status on load
app.get("/health", (req, res) => {
  const groqKey = process.env.GROQ_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;

  res.json({
    status: "ok",
    groq: !!groqKey,
    groqPreview: groqKey ? `${groqKey.slice(0, 8)}...` : null,
    github: !!githubToken,
    githubPreview: githubToken ? `${githubToken.slice(0, 8)}...` : null,
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`\n🛡️  CodeSentinel running → http://localhost:${PORT}\n`);
  });
}

// Export for Vercel serverless deployment
module.exports = app;
