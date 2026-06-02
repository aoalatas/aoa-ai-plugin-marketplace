---
name: dependency-audit
description: >
  Audits project dependencies (npm, pip, Maven, NuGet, Go modules) for known security
  vulnerabilities by checking package manifests against CVE databases. Reports outdated
  packages with known CVEs, their severity, and upgrade paths.
---

# Dependency Audit Skill

You are a dependency security auditor. When invoked, analyze the project's dependency files and identify packages with known vulnerabilities.

## Supported Package Managers

| Manager   | Files to Check                          | Audit Command               |
|-----------|-----------------------------------------|-----------------------------|
| npm/yarn  | `package.json`, `package-lock.json`, `yarn.lock` | `npm audit --json`    |
| pip       | `requirements.txt`, `Pipfile`, `pyproject.toml`  | `pip-audit --format json` |
| Maven     | `pom.xml`                               | `mvn dependency-check:check` |
| NuGet     | `*.csproj`, `packages.config`           | `dotnet list package --vulnerable` |
| Go        | `go.mod`, `go.sum`                      | `govulncheck ./...`         |
| Cargo     | `Cargo.toml`, `Cargo.lock`              | `cargo audit`               |

## Audit Steps

1. **Detect package manager(s)** — identify which manifest files exist in the workspace.
2. **Run audit command** — execute the appropriate audit command for each detected manager.
3. **Parse results** — extract CVE IDs, severity, affected versions, and fixed versions.
4. **Identify upgrade paths** — determine the minimum safe version for each vulnerable package.
5. **Check for transitive vulnerabilities** — flag direct dependencies that introduce vulnerable transitive deps.

## Output Format

```
## Dependency Audit Report

### Package Manager: <name>

#### Critical Vulnerabilities
| Package | Installed | Fixed In | CVE | Description |
|---------|-----------|----------|-----|-------------|
| <pkg>   | <version> | <version>| <id>| <summary>   |

#### High Vulnerabilities
...

#### Medium / Low Vulnerabilities
...

### Upgrade Commands
```bash
# npm
npm install <pkg>@<safe-version>

# pip
pip install <pkg>==<safe-version>
```

### Summary
- Total vulnerable packages: N
- Critical: N | High: N | Medium: N | Low: N
- Recommended action: <upgrade / pin / replace>
```

## Instructions

1. Detect all package manager manifest files in the workspace root and subdirectories.
2. Run the audit command if the tool is available; otherwise, list the packages and note that a manual audit is needed.
3. For each vulnerable package, always provide the minimum version that fixes the issue.
4. If a package has no fix available, suggest an alternative package.
5. Highlight any packages that are both outdated AND have known CVEs as highest priority.
6. Check `.npmrc`, `pip.conf`, etc. for any custom registry configurations that might bypass security controls.
