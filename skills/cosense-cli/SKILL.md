---
name: cosense-cli
description: >
  CLI tool for Cosense (formerly Scrapbox) page operations.
  Search, fetch, create, and append pages via structured JSON output.
  Use when the user mentions "Cosense", "Scrapbox", or asks to read/write/search wiki pages.
  Also trigger when a scrapbox.io URL is pasted (e.g. https://scrapbox.io/project/page).
---

> Reference for AI agents (especially Claude Code) to operate cosense-cli.

## Purpose

CLI tool for searching, fetching, creating, and appending pages in [Cosense](https://scrapbox.io/) (formerly Scrapbox) projects. Outputs JSON by default, designed for pipeline and agent integration.

## Authentication

- Cosense authenticates via **connect.sid (SID)**
- SID is stored per profile in `~/.config/cosense-cli/config.json`
- Projects are registered and linked to a profile (account)
- **Run `bunx cosense profile set` and `bunx cosense project add` before use**
- Public projects can be accessed without SID

```bash
# 1. Create a profile (human only, one-time setup)
bunx cosense profile set personal --sid <connect.sid>

# 2. Register a project (human or AI)
bunx cosense project add my-project --profile personal

# 2b. Register a read-only project (writes are blocked)
bunx cosense project add ref-project --profile personal --readonly
```

## Global Options

| Option             | Description                                      | Default |
| ------------------ | ------------------------------------------------ | ------- |
| `--project <name>` | Project name (required for page/search commands) | —       |
| `--help`           | Show help                                        | —       |

## Commands

### profile — Manage authentication profiles (account-level)

```bash
# Create/update a profile (SID only)
bunx cosense profile set <name> --sid <sid>

# List all profiles
bunx cosense profile list

# Remove a profile
bunx cosense profile remove <name>
```

`profile set` supports interactive mode — omit arguments to be prompted.

### project — Manage projects

```bash
# Register a project and link it to a profile
bunx cosense project add <name> --profile <profile> [--readonly]

# Update project settings
bunx cosense project update <name> [--readonly | --no-readonly]

# List all registered projects
bunx cosense project list

# Remove a project
bunx cosense project remove <name>
```

Connection is validated on `project add` — typos in project names are caught immediately.

### search — Search pages and fetch their content

```bash
bunx cosense search <query> --project <name> [--limit <n>] [--depth <0|1|2>]
```

| Option    | Default | Description                                                  |
| --------- | ------- | ------------------------------------------------------------ |
| `--limit` | `5`     | Max number of matched pages to fetch content for             |
| `--depth` | `0`     | `0` = matched pages only, `1` = + 1-hop links, `2` = + 2-hop |

**Output:** query, array of pages (title + full lines content)

### page get — Fetch a page

```bash
bunx cosense page get <title> --project <name> [--depth <0|1|2>]
```

| Option    | Default | Description                                                 |
| --------- | ------- | ----------------------------------------------------------- |
| `--depth` | `0`     | `0` = single page, `1` = + 1-hop links, `2` = + 2-hop links |

**Output (depth 0):** title, lines, links, descriptions, relatedPages
**Output (depth >= 1):** pages array (title + lines), deduplicated

### page list — List pages

```bash
bunx cosense page list --project <name> [--sort updated] [--limit 100] [--skip 0]
```

**Output:** count, array of pages (title, descriptions, updated, views, linked)

### page create — Create a page

```bash
bunx cosense page create <title> --project <name> --body "# Markdown content"
bunx cosense page create <title> --project <name> --body-stdin --input-format md
echo "content" | bunx cosense page create <title> --project <name> --body-stdin
```

- `--input-format md` (default): auto-converts Markdown to Scrapbox notation
- `--input-format sb`: sends Scrapbox notation as-is
- **Blocked on read-only projects**
- **Output:** title, url, commitId

### page append — Append to a page

```bash
bunx cosense page append <title> --project <name> --body "appended content"
bunx cosense page append <title> --project <name> --body "inserted" --after "insert after this line"
```

- `--after`: inserts after the first line containing the given text. Falls back to end of page if not found.
- input-format works the same as create
- **Blocked on read-only projects**
- **Output:** title, url, commitId

## Output Schema

All commands return a unified response format:

```jsonc
// Success
{ "ok": true, "data": { /* command-specific */ } }

// Error
{ "ok": false, "error": { "code": "ERROR_CODE", "message": "description" } }
```

Exit code: success = 0, error = 1

## Typical Workflows

### Search → Read related context

```bash
# Search and fetch top 5 pages with 1-hop links
bunx cosense search "authentication" --project my-project --limit 5 --depth 1
```

### Fetch a specific page with context

```bash
# Get a page and all its linked pages
bunx cosense page get "Project Overview" --project my-project --depth 2
```

### Write content

```bash
# Create a new page with Markdown
cosense page create "Meeting Notes 2025-01-15" --project my-project --body "## Agenda\n- Item 1"

# Append to existing page
cosense page append "Daily Log" --project my-project --body "- Completed task X"
```

## Do NOT

- **Access private projects without SID** — results in auth error. Set up with `profile set` first.
- **Use vague `--after` strings** — partial match hits the first matching line. Use a unique string.
- **Append to nonexistent pages** — results in error. Check with `page get` first or use `page create`.
- **Specify unregistered projects** — register with `cosense project add` first.
- **Write to read-only projects** — create/append are blocked. Use `project update --no-readonly` to change.
