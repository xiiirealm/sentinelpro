const axios = require("axios");

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are a senior cybersecurity expert reviewing source code for vulnerabilities.

Analyze the provided code and return ONLY a valid JSON array of vulnerabilities found.

Each vulnerability must follow this exact format:
{
  "type": "Vulnerability name (e.g. SQL Injection, XSS, Hardcoded API Key)",
  "severity": "Critical" | "High" | "Medium" | "Low",
  "file": "filename",
  "line": line_number_as_integer_or_null,
  "explanation": "Plain English explanation of why this is dangerous and what a hacker could do",
  "fixReason": "Clear reason explaining how the solution works and why the new code makes it secure",
  "fixedCode": "The corrected code snippet that fixes the issue"
}

Return ONLY a valid JSON array — no markdown, no backticks, no explanation outside the array.
If there are no vulnerabilities, return an empty array: []

Check for these vulnerability types:
- SQL Injection
- Cross-Site Scripting (XSS)
- Hardcoded API Keys, Passwords, or Secrets
- Weak or Broken Password Hashing (MD5, SHA1)
- Missing Input Validation / Sanitization
- Insecure Direct Object References
- Command Injection
- Path Traversal
- Insecure Dependencies
- CORS misconfiguration
- Sensitive data in logs
- Missing authentication checks
- Prototype Pollution
- ReDoS (Regular Expression DoS)
- Open Redirect`;

/**
 * Analyze a single file for security vulnerabilities using Groq LLM.
 * Reads GROQ_API_KEY dynamically from process.env on every call.
 * Includes retry with exponential backoff for rate-limit (429) errors.
 */
async function analyzeFile(filePath, fileContent) {
  const apiKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : null;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set. Add it to your .env file.");
  }

  const prompt = `File: ${filePath}\n\nCode:\n\`\`\`\n${fileContent.slice(0, 6000)}\n\`\`\``;

  const body = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ],
    temperature: 0.1,
    max_tokens: 2048,
  };

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(GROQ_URL, body, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        timeout: 30000,
      });

      const raw = response.data?.choices?.[0]?.message?.content || "[]";
      // Strip any accidental markdown fences
      const cleaned = raw.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        // Try to extract JSON array from the response
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          console.warn(`Could not parse JSON from ${filePath}:`, cleaned.slice(0, 200));
          return [];
        }
      }

      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      const status = e.response?.status;
      const errMsg = e.response?.data?.error?.message || e.message;

      if (status === 401) {
        throw new Error(
          "GROQ API key is invalid or expired (401). Please check your GROQ_API_KEY in .env"
        );
      }

      if (status === 429 && attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
        console.warn(
          `⚠️  Groq rate limit hit for ${filePath}. Retrying in ${delay / 1000}s (attempt ${attempt}/${MAX_RETRIES})...`
        );
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (status === 429) {
        console.warn(`⚠️  Groq rate limit hit for ${filePath}. All retries exhausted.`);
        return [];
      }

      console.warn(`Skipping ${filePath}: [${status}] ${errMsg}`);
      return [];
    }
  }

  return [];
}

module.exports = { analyzeFile };
