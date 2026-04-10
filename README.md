# cosense-cli

CLI tool for [Cosense](https://scrapbox.io/) (formerly Scrapbox). AI agent integration with structured JSON output.

Human setup is only the initial authentication — after that, just load the skill and let the AI handle the rest.

## Features

- Search pages with full-text content fetching
- Fetch pages with related pages traversal (1-hop, 2-hop links)
- Create and append pages with Markdown → Scrapbox auto-conversion
- Read-only project support for safe reference access
- All output is structured JSON

## Usage (Agent Skill)

```bash
npx skills add mrsekut/cosense-cli
```

This installs a [skill](./skills/cosense-cli/SKILL.md) that teaches Claude Code how to search, read, create, and append Cosense pages. You don't need to learn the CLI commands yourself.

## Setup

One-time setup by a human:

```bash
# Create a profile with your Cosense session ID
bunx cosense profile set
```

Public projects work without any setup. For private projects you participate in, the AI agent will auto-detect and register the project using your profile.
