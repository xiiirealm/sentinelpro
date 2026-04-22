const express = require("express");
const router = express.Router();
const { parseGitHubUrl, fetchRepoFiles } = require("../utils/github");
const { analyzeFile } = require("../utils/gemini");

router.post("/scan", async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl) {
    return res.status(400).json({ error: "repoUrl is required" });
  }

  // ── Pre-check: make sure API keys are available before starting ──
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: "GROQ_API_KEY is not configured on the server. Add it to .env and restart.",
    });
  }
  if (!process.env.GITHUB_TOKEN) {
    console.warn("⚠️  GITHUB_TOKEN not set — GitHub rate limits will apply");
  }

  try {
    const { owner, repo } = parseGitHubUrl(repoUrl);

    console.log(`Fetching files from ${owner}/${repo}...`);
    const files = await fetchRepoFiles(owner, repo);

    if (files.length === 0) {
      return res.status(200).json({
        repo: `${owner}/${repo}`,
        filesScanned: 0,
        vulnerabilities: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0 },
      });
    }

    console.log(`Analyzing ${files.length} files with Groq...`);

    // Run 5 files in parallel at a time - Groq is fast enough for this
    const allVulns = [];
    const errors = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      console.log(`Batch ${Math.floor(i/BATCH_SIZE)+1}: scanning ${batch.map(f => f.path).join(", ")}`);

      const results = await Promise.allSettled(
        batch.map((f) => analyzeFile(f.path, f.content))
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          allVulns.push(...result.value);
        } else {
          errors.push(result.reason?.message || "Unknown error");
        }
      }

      // If we got an auth error, stop early — no point scanning more files
      const authError = errors.find(
        (e) => e.includes("401") || e.includes("invalid") || e.includes("expired")
      );
      if (authError) {
        return res.status(401).json({ error: authError });
      }
    }

    const summary = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const v of allVulns) {
      const key = v.severity?.toLowerCase();
      if (key in summary) summary[key]++;
    }

    const response = {
      repo: `${owner}/${repo}`,
      filesScanned: files.length,
      vulnerabilities: allVulns,
      summary,
    };

    // Attach non-fatal warnings if some files failed
    if (errors.length > 0 && allVulns.length > 0) {
      response.warnings = errors;
    }

    res.json(response);
  } catch (err) {
    console.error("Scan error:", err.message);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

module.exports = router;
