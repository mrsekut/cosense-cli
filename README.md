# cosense-cli

CLI tool for [Cosense](https://scrapbox.io/) (formerly Scrapbox). Designed for AI agent integration with structured JSON output.

## Install

```bash
bun install
```

## Setup

```bash
# Configure a profile with your Cosense session ID
cosense profile set default --sid <connect.sid> --project <project-name>
```

## Usage

```bash
# Search pages
cosense page search "keyword"

# Get a page
cosense page get "Page Title"

# List pages
cosense page list --sort updated --limit 50

# Create a page
cosense page create "New Page" --body "# Hello"

# Append to a page
cosense page append "Existing Page" --body "Additional content"

# Export with related pages
cosense export "Page Title" --depth 2

# Export all pages
cosense export --all
```

## Development

```bash
bun run index.ts
```

## Documentation

- [SKILL.md](./SKILL.md) — AI agent向けリファレンス
- [AGENT_INSTRUCTIONS.md](./AGENT_INSTRUCTIONS.md) — AI agent向け詳細仕様
