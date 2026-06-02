# AOA Security Toolkit Plugin

A VSCode/GitHub Copilot agent plugin that brings security-focused skills, a dedicated security auditor agent, and automatic secret detection hooks to every developer on the team.

## What's Included

| Component | Name | Description |
|-----------|------|-------------|
| Skill | `security-review` | OWASP Top 10 code review with severity-ranked findings |
| Skill | `dependency-audit` | CVE scan across npm, pip, NuGet, Maven, Go modules |
| Agent | `security-auditor` | Read-only security audit agent with structured methodology |
| Hook | PostToolUse | Auto-scans every file you write for hardcoded secrets and dangerous patterns |

## Skills

### `security-review`
Invoke via **Configure Skills → security-review** or type in chat:
> "Review this file for security vulnerabilities"

Covers: injection, broken auth, sensitive data exposure, XSS, access control, misconfiguration, vulnerable dependencies, SSRF, secrets.

### `dependency-audit`
Invoke via **Configure Skills → dependency-audit** or type in chat:
> "Audit my project dependencies for known CVEs"

Supports: npm, yarn, pip, Maven, NuGet, Go modules, Cargo.

## Agent

### `@security-auditor`
A systematic security auditor that:
- Uses only read-only tools (cannot modify your code)
- Follows a 4-phase methodology: Reconnaissance → Threat Modeling → Vulnerability Assessment → Report
- Produces structured reports with CWE references and remediation steps

Usage:
```
@security-auditor Audit the authentication module in src/auth/
```

## Hook — Automatic Security Scan

The `PostToolUse` hook runs `scripts/security-scan.js` (Node.js, cross-platform) every time a file is written or edited. It detects:

| Rule | Severity | Pattern |
|------|----------|---------|
| SECRET-001 | Critical | Hardcoded API keys / tokens |
| SECRET-002 | Critical | Hardcoded passwords |
| SECRET-003 | Critical | Private key material (`-----BEGIN PRIVATE KEY`) |
| SECRET-004 | High | AWS access key IDs |
| SECRET-005 | High | GitHub personal access tokens |
| INJECT-001 | High | `eval()` usage |
| INJECT-002 | High | Direct `innerHTML` assignment |
| INJECT-003 | Medium | Dynamic shell commands with concatenation |
| CRYPTO-001 | Medium | Weak hash algorithms (MD5/SHA1) |
| PROTO-001 | Low | Non-HTTPS URLs |

The hook warns but never blocks — findings appear in the chat panel for review.

## Version History

| Version | Changes |
|---------|---------|
| 1.0.0 | Initial release — security-review, dependency-audit, security-auditor, secret detection hook |
