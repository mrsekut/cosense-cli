# cosense-cli

CLI tool for [Cosense](https://scrapbox.io/) (formerly Scrapbox). Designed for AI agent integration with structured JSON output.

## Usage

```bash
bunx cosense
```

## Setup

```bash
# 1. Create a profile with your Cosense session ID
cosense profile set personal --sid <connect.sid>

# 2. Register projects to the profile
cosense project add my-project --profile personal
```

## Commands

```bash
# Search pages
cosense page search "keyword" --project my-project

# Get a page
cosense page get "Page Title" --project my-project

# List pages
cosense page list --project my-project --sort updated --limit 50

# Create a page
cosense page create "New Page" --project my-project --body "# Hello"

# Append to a page
cosense page append "Existing Page" --project my-project --body "Additional content"

# Export with related pages
cosense export "Page Title" --project my-project --depth 2

# Export all pages
cosense export --all --project my-project
```

## Claude Code Skill

To install as a Claude Code skill:

```bash
npx skills add mrsekut/cosense-cli
```

## Documentation

- [SKILL.md](./skills/cosense/SKILL.md) — AI agent reference
- [AGENT_INSTRUCTIONS.md](./AGENT_INSTRUCTIONS.md) — Detailed agent integration spec
