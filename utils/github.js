`const axios = require("axios");

function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/\s]+)/);
  if (!match) throw new Error("Invalid GitHub URL. Please use a valid github.com repository link.");
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

async function fetchRepoFiles(owner, repo, path = "", depth = 0) {
  if (depth > 3) return [];

  // Read token dynamically on each call so it picks up the latest .env value
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { Authorization: `token ${ token } ` } : {};

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

let response;
try {
  response = await axios.get(url, { headers, timeout: 15000 });
} catch (e) {
  const status = e.response?.status;
  if (status === 404) {
    throw new Error(
      "Repository not found. Make sure it exists and is public."
    );
  }
  if (status === 403) {
    throw new Error(
      "GitHub API rate limit hit. Make sure GITHUB_TOKEN is set and valid in .env"
    );
  }
  if (status === 401) {
    throw new Error(
      "GitHub token is invalid or expired (401). Check GITHUB_TOKEN in .env"
    );
  }
  throw e;
}

const items = response.data;
const files = [];
const CODE_EXTENSIONS = [
  ".js", ".ts", ".jsx", ".tsx", ".py", ".php", ".java", ".go",
  ".rb", ".cs", ".cpp", ".c", ".env", ".yml", ".yaml",
  ".sh", ".sql", ".vue", ".rs", ".kt", ".swift",
];

for (const item of items) {
  if (files.length >= 15) break; // cap at 15 files for speed

  if (item.type === "file") {
    const ext = item.name.includes(".")
      ? "." + item.name.split(".").pop()
      : "";
    if (CODE_EXTENSIONS.includes(ext) && item.size < 40000) {
      try {
        const fileRes = await axios.get(item.download_url, {
          responseType: "text",
          headers,
          timeout: 10000,
        });
        files.push({ path: item.path, content: fileRes.data });
      } catch (e) {
        console.warn(`Skipping ${item.path}: ${e.message}`);
      }
    }
  } else if (
    item.type === "dir" &&
    !["node_modules", ".git", "dist", "build", "vendor", "__pycache__", "test", "tests"].includes(item.name)
  ) {
    const subFiles = await fetchRepoFiles(owner, repo, item.path, depth + 1);
    files.push(...subFiles);
  }
}

return files;
}

module.exports = { parseGitHubUrl, fetchRepoFiles };
