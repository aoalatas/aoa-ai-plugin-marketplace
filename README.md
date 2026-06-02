# AOA AI Plugin Marketplace

Team-wide VSCode / GitHub Copilot agent plugin marketplace for AOA developers. Install once — get automatic updates forever.

## 🚀 Quick Setup

### Option 1: Global VSCode Settings (recommended for all developers)

Add to your `settings.json` (`Ctrl+Shift+P` → *Open User Settings JSON*):

```json
{
  "chat.plugins.enabled": true,
  "chat.plugins.marketplaces": ["aoalatas/aoa-ai-plugin-marketplace"]
}
```

Then in VSCode Extensions view, search `@agentPlugins` and install any plugin.

### Option 2: Per-Project (team projects)

Add `.github/copilot/settings.json` to your project repo:

```json
{
  "extraKnownMarketplaces": {
    "aoa-ai-plugins": {
      "source": {
        "source": "github",
        "repo": "aoalatas/aoa-ai-plugin-marketplace"
      }
    }
  },
  "enabledPlugins": {
    "aoa-ai-security@aoa-ai-plugins": true
  }
}
```

VSCode will prompt team members to install recommended plugins the first time they open the project.

### Option 3: Install Directly from Source

1. `Ctrl+Shift+P` → *Chat: Install Plugin From Source*
2. Enter plugin repo URL (example): `https://github.com/aoalatas/aoa-ai-security`

---

## 📦 Available Plugins

### `aoa-ai-security` — Security Toolkit

Security review, dependency auditing, and automatic secret detection for every file you write.

| Component | Description |
|-----------|-------------|
| 🔍 Skill: `security-review` | OWASP Top 10 code review |
| 🔍 Skill: `dependency-audit` | CVE scan across all package managers |
| 🤖 Agent: `@security-auditor` | Read-only systematic security audit agent |
| 🪝 Hook: PostToolUse | Auto-scans files for hardcoded secrets & dangerous patterns |

[→ Plugin README](https://github.com/aoalatas/aoa-ai-security)

---

## 🔄 Auto-Updates

VSCode checks for plugin updates every 24 hours (or run **Extensions: Check for Extension Updates**).

**To publish a plugin update:**
1. Publish changes in the plugin repository (for example `aoalatas/aoa-ai-security`)
2. Bump plugin `version` in that plugin repo's manifest(s)
3. Update `version` for that plugin in `.github/plugin/marketplace.json`
4. Push to `main` — VS Code will discover updates during plugin refresh

---

## 🏗️ Adding a New Plugin
In `.github/plugin/marketplace.json`, add an entry under `plugins`:
      hook-script.js       # Hook scripts (Node.js = cross-platform)

Then add it to `.github/plugin/marketplace.json`:
  "name": "your-new-plugin",
  "description": "...",
  "version": "1.0.0",
  "source": {
    "source": "github",
    "repo": "your-org/your-plugin-repo"
  }
  "displayName": "Your Plugin Name",
  "description": "...",
  "version": "1.0.0"
}
```

---

## 📋 Prerequisites

- VSCode with GitHub Copilot extension
- `chat.plugins.enabled` must be `true` (contact your org admin if needed)
- Node.js (for hook scripts)

## 🔗 Resources

- [VSCode Agent Plugins Docs](https://code.visualstudio.com/docs/agent-customization/agent-plugins)
- [GitHub Copilot CLI Plugin Reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
- [Claude Code Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces)