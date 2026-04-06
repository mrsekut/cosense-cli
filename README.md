# cosense-cli

CLI tool for [Cosense](https://scrapbox.io/) (formerly Scrapbox). Designed for AI agent integration with structured JSON output.

## Install

```bash
git clone https://github.com/mrsekut/cosense-cli.git
cd cosense-cli
bun install
bun link   # makes `cosense` command available globally
```

## Setup

```bash
# 1. Create a profile with your Cosense session ID
cosense profile set personal --sid <connect.sid>

# 2. Register projects to the profile
cosense project add my-project --profile personal
```

## Usage

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

Claude Code にスキルとしてインストールするには、`~/.claude/skills/` にシンボリックリンクを作成する:

```bash
ln -s /path/to/cosense-cli/SKILL.md ~/.claude/skills/cosense-cli.md
```

## Development

```bash
bun run index.ts
```

## Documentation

- [SKILL.md](./SKILL.md) — AI agent向けリファレンス
- [AGENT_INSTRUCTIONS.md](./AGENT_INSTRUCTIONS.md) — AI agent向け詳細仕様
