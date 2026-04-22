# 🛡️ CodeSentinel — AI-Powered Code Security Scanner

> Paste a GitHub repo link → Get a full security audit in 90 seconds.  
> Built for **Cyber Nexus Hackathon 2025** | Domain: Agentic AI + Cyber Security

---

## 🗂️ Project Structure

```
codesentinel/
├── backend/
│   ├── server.js          ← Express server (entry point)
│   ├── routes/scan.js     ← POST /api/scan endpoint
│   ├── utils/github.js    ← Fetches files from any public GitHub repo
│   ├── utils/gemini.js    ← Sends code to Gemini AI, parses vulnerabilities
│   ├── package.json
│   └── .env.example       ← Copy this to .env and add your keys
└── frontend/
    └── index.html         ← Full single-file frontend (no build tools needed)
```

---

## ⚙️ Setup in 3 Steps

### Step 1 — Get your API keys (free, no credit card)

| Key | Where to get it |
|---|---|
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| `GITHUB_TOKEN` | https://github.com/settings/tokens → Generate new token (classic) → No scopes needed |

### Step 2 — Set up the backend

```bash
cd backend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
# Now open .env and paste your keys

# Start the server
npm run dev       # development (auto-restarts on save)
# OR
npm start         # production
```

You should see: `CodeSentinel backend running on http://localhost:3001`

### Step 3 — Open the frontend

Just open `frontend/index.html` in your browser. No build step needed.

> **Note:** If you deploy the backend to Render, update the `BACKEND_URL` variable at the top of `index.html` to your Render URL.

---

## 🚀 Deployment (Free)

### Backend → Render
1. Push your `backend/` folder to a GitHub repo
2. Go to https://render.com → New → Web Service
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variables: `GEMINI_API_KEY` and `GITHUB_TOKEN`
6. Copy your Render URL (e.g. `https://codesentinel-xyz.onrender.com`)

### Frontend → Vercel
1. Push `frontend/index.html` to GitHub
2. Go to https://vercel.com → New Project → Import repo
3. Deploy — Vercel auto-detects the HTML file
4. Update `BACKEND_URL` in `index.html` to your Render URL before deploying

---

## 🔍 What Vulnerabilities Does It Detect?

| Type | Description |
|---|---|
| SQL Injection | User input directly in DB queries |
| XSS | Unsanitized output in HTML |
| Hardcoded Secrets | API keys/passwords in source code |
| Weak Password Hashing | MD5, SHA1, plain text passwords |
| Missing Input Validation | Unvalidated/unsanitized user input |
| Command Injection | User input in shell commands |
| Path Traversal | `../` in file path inputs |
| Insecure CORS | Wildcard or overly permissive CORS |
| Sensitive Data in Logs | Passwords/keys printed to logs |

---

## 🎯 Demo Script (for stage)

**Step 1 (30s):** "This is CodeSentinel — an AI security scanner. No setup. Just a GitHub link."

**Step 2 (15s):** "I'm pasting a real Node.js project right now. It looks like a normal working app. Let's see what's hiding inside."

**Step 3 (60s):** "Under 90 seconds — [X] vulnerabilities found. Let me click the critical one… SQL Injection on line 34. A hacker can type a special character into the login box and access every user account. And here — the fixed code is already written."

**Step 4 (30s):** "A manual audit for these issues takes 2 days and costs lakhs. CodeSentinel found them in 90 seconds. For free."

---

## ❓ Judge Questions

**Q: How is this different from Snyk?**  
A: Snyk outputs CVE codes. We output plain English explanations and AI-written fixes. We're an AI security engineer, not a scanner.

**Q: Is the AI always accurate?**  
A: It's a first-pass guardian — it catches the most common vulnerability types reliably. Think of it as a seatbelt, not a guarantee.

**Q: Why is this Agentic AI?**  
A: The system executes a multi-step pipeline autonomously — it fetches files, decides which to analyze, sends structured prompts, interprets results, and formats the output — all without human input between steps.
