#!/usr/bin/env node
/**
 * AOA Security Scan — PostToolUse Hook
 *
 * Reads the tool event from stdin (JSON), extracts the file path(s) written,
 * and scans content for common security anti-patterns:
 *   - Hardcoded secrets / API keys / passwords
 *   - Dangerous function calls (eval, exec, innerHTML)
 *   - SQL injection patterns (string concatenation in queries)
 *   - Insecure protocol usage (http:// for sensitive endpoints)
 *
 * Output format follows the Copilot hook protocol:
 *   - Exit 0  → allow (no blocking issues)
 *   - Exit 2  → block with message (critical security issue detected)
 *
 * Stdin: JSON hook event payload
 * Stdout: JSON response { decision, reason } or empty for allow
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ─── Secret / anti-pattern rules ────────────────────────────────────────────

const RULES = [
  {
    id: "SECRET-001",
    severity: "critical",
    pattern:
      /(?:api[_-]?key|apikey|secret[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key)\s*[:=]\s*["'][A-Za-z0-9+/=_\-]{16,}["']/gi,
    message: "Possible hardcoded API key or secret token detected.",
  },
  {
    id: "SECRET-002",
    severity: "critical",
    pattern:
      /(?:password|passwd|pwd)\s*[:=]\s*["'][^"']{4,}["']/gi,
    message: "Possible hardcoded password detected.",
  },
  {
    id: "SECRET-003",
    severity: "critical",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    message: "Private key material found in source file.",
  },
  {
    id: "SECRET-004",
    severity: "high",
    pattern: /(?:AKIA|ABIA|ACCA|AGPA|AIDA|AIPA|ANPA|ANVA|AROA|ASCA|ASIA)[A-Z0-9]{16}/g,
    message: "AWS access key ID pattern detected.",
  },
  {
    id: "SECRET-005",
    severity: "high",
    pattern: /ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82}/g,
    message: "GitHub personal access token detected.",
  },
  {
    id: "INJECT-001",
    severity: "high",
    pattern: /\beval\s*\(/g,
    message: "Use of eval() detected — potential code injection risk.",
  },
  {
    id: "INJECT-002",
    severity: "high",
    pattern: /\.innerHTML\s*=/g,
    message: "Direct innerHTML assignment detected — potential XSS risk. Use textContent or a sanitizer.",
  },
  {
    id: "INJECT-003",
    severity: "medium",
    pattern: /(?:exec|execSync|spawn|spawnSync)\s*\([^)]*\+/g,
    message: "Dynamic shell command with string concatenation — potential command injection.",
  },
  {
    id: "CRYPTO-001",
    severity: "medium",
    pattern: /createHash\s*\(\s*["'](?:md5|sha1)["']\s*\)/gi,
    message: "Weak hash algorithm (MD5/SHA1) detected. Use SHA-256 or bcrypt for passwords.",
  },
  {
    id: "PROTO-001",
    severity: "low",
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/gi,
    message: "Non-HTTPS URL detected for external resource. Use HTTPS.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    if (process.stdin.isTTY) {
      resolve("");
      return;
    }
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    // Timeout so the hook never hangs
    setTimeout(() => resolve(data), 5000);
  });
}

function scanContent(content, filePath) {
  const findings = [];
  const ext = path.extname(filePath).toLowerCase();

  // Skip binary / lock files / generated files
  const skipExts = [
    ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
    ".woff", ".woff2", ".ttf", ".eot",
    ".zip", ".tar", ".gz", ".lock",
    ".min.js", ".min.css",
  ];
  if (skipExts.some((e) => filePath.endsWith(e))) return findings;

  for (const rule of RULES) {
    let match;
    rule.pattern.lastIndex = 0;
    while ((match = rule.pattern.exec(content)) !== null) {
      // Calculate line number
      const lineNum = content.substring(0, match.index).split("\n").length;
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        message: rule.message,
        file: filePath,
        line: lineNum,
        snippet: match[0].substring(0, 60) + (match[0].length > 60 ? "…" : ""),
      });
    }
  }
  return findings;
}

function formatFindings(findings) {
  if (findings.length === 0) return null;

  const bySeverity = { critical: [], high: [], medium: [], low: [] };
  for (const f of findings) {
    (bySeverity[f.severity] || bySeverity.low).push(f);
  }

  const lines = ["⚠️  AOA Security Scan detected potential issues:\n"];

  for (const [sev, items] of Object.entries(bySeverity)) {
    if (items.length === 0) continue;
    const icon = sev === "critical" ? "🔴" : sev === "high" ? "🟠" : sev === "medium" ? "🟡" : "🔵";
    lines.push(`${icon} ${sev.toUpperCase()} (${items.length})`);
    for (const item of items) {
      lines.push(`  [${item.ruleId}] ${item.file}:${item.line} — ${item.message}`);
      if (item.snippet) lines.push(`    Pattern: ${item.snippet}`);
    }
    lines.push("");
  }

  lines.push("Review these findings before committing. Use 'security-review' skill for a full audit.");
  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const raw = await readStdin();

  let event = {};
  try {
    event = raw ? JSON.parse(raw) : {};
  } catch {
    // If we can't parse, just allow
    process.exit(0);
  }

  // Extract file path from the hook event
  // Hook payload shape varies; try common paths
  const filePath =
    event?.tool_input?.path ||
    event?.tool_input?.file_path ||
    event?.tool_input?.new_path ||
    event?.file_path ||
    null;

  const content =
    event?.tool_input?.content ||
    event?.tool_input?.new_content ||
    event?.content ||
    null;

  if (!filePath && !content) {
    process.exit(0);
  }

  let scanContent_ = content;

  // If no inline content, try to read the file
  if (!scanContent_ && filePath && fs.existsSync(filePath)) {
    try {
      scanContent_ = fs.readFileSync(filePath, "utf8");
    } catch {
      process.exit(0);
    }
  }

  if (!scanContent_) {
    process.exit(0);
  }

  const findings = scanContent(scanContent_, filePath || "<unknown>");
  const criticalOrHigh = findings.filter(
    (f) => f.severity === "critical" || f.severity === "high"
  );

  if (findings.length > 0) {
    const message = formatFindings(findings);
    const response = {
      // Use "warn" decision for high/critical so the agent sees but can override
      // Use exit code 0 (allow) — we warn but don't block, to avoid disrupting workflow
      decision: criticalOrHigh.length > 0 ? "warn" : "allow",
      reason: message,
    };
    process.stdout.write(JSON.stringify(response) + "\n");
  }

  // Always exit 0 (allow) — this hook warns but never blocks automatically
  process.exit(0);
}

main().catch(() => process.exit(0));
