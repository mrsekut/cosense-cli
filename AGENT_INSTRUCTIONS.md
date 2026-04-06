# AGENT_INSTRUCTIONS.md

Instructions for AI agents operating cosense-cli programmatically.

## Overview

cosense-cli is a CLI tool for interacting with [Cosense](https://scrapbox.io/) (formerly Scrapbox) projects. It provides structured JSON output suitable for machine consumption.

**Binary:** `cosense` (or `bun run index.ts` in development)

## Prerequisites

A human must configure at least one profile before the CLI can be used:

```sh
cosense profile set <name> --sid <session-id> --project <project-name>
```

The `sid` (session ID) is a browser cookie obtained from an authenticated Cosense session. Agents cannot perform this step autonomously.

`profile set` supports interactive mode — when arguments are omitted, the user is prompted for input. API connectivity is validated before saving.

## Output Contract

All commands produce JSON output.

### Success

```json
{
  "ok": true,
  "data": { ... }
}
```

### Error

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0    | Success |
| 1    | Error (any kind) |

### Error Codes

| Code | Cause |
|------|-------|
| `UNKNOWN_COMMAND` | Unrecognized command name |
| `UNKNOWN_SUBCOMMAND` | Unrecognized subcommand for profile/page |
| `MISSING_ARGUMENT` | Required positional argument not provided |
| `ERROR` | Runtime/API error (check `message` for details) |

## Global Options

These options apply to all commands that access the Cosense API:

```
--profile <name>      Profile to use (default: "default")
--project <name>      Project name (overrides profile default)
--help                Show help
```

## Command Reference

### profile set

Create or update an authentication profile.

```sh
cosense profile set <name> --sid <sid> --project <project>
```

| Argument/Option | Required | Description |
|----------------|----------|-------------|
| `<name>` | yes | Profile name |
| `--sid` | yes | Cosense session ID |
| `--project` | yes | Default project name |

All arguments can be omitted for interactive prompting (TTY only).

**Response data:** `{ "profile": string, "project": string }`

### profile list

```sh
cosense profile list
```

**Response data:**
```json
{
  "profiles": [
    { "name": "default", "defaultProject": "my-project", "hasSid": true }
  ]
}
```

### profile remove

```sh
cosense profile remove <name>
```

**Response data:** `{ "removed": string }`

### page get

Fetch a single page with content and link metadata.

```sh
cosense page get <title> [--profile <name>] [--project <name>]
```

**Response data:**
```json
{
  "title": "Page Title",
  "lines": ["line1", "line2"],
  "descriptions": ["..."],
  "links": ["LinkedPage1", "LinkedPage2"],
  "relatedPages": {
    "links1hop": [{ "title": "related-page" }],
    "links2hop": [{ "title": "distant-page" }]
  }
}
```

### page list

List pages in a project with pagination.

```sh
cosense page list [--sort <field>] [--limit <n>] [--skip <n>] [--profile <name>] [--project <name>]
```

| Option | Default | Values |
|--------|---------|--------|
| `--sort` | `updated` | `updated`, `created`, `title` |
| `--limit` | `100` | integer |
| `--skip` | `0` | integer |

**Response data:**
```json
{
  "count": 42,
  "pages": [
    { "title": "Page1", "descriptions": ["..."], "updated": 1700000000, "views": 10, "linked": 5 }
  ]
}
```

### page search

Full-text search across pages.

```sh
cosense page search <query> [--profile <name>] [--project <name>]
```

**Response data:**
```json
{
  "query": "search term",
  "count": 5,
  "pages": [
    { "title": "Page Title", "words": 100, "lines": 5 }
  ]
}
```

### page create

Create a new page. Body can be provided via `--body` or piped via `--body-stdin`.

```sh
cosense page create <title> --body <text> [--input-format <md|sb>] [--profile <name>] [--project <name>]
cosense page create <title> --body-stdin [--input-format <md|sb>] [--profile <name>] [--project <name>]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--body` | `""` | Page content as string |
| `--body-stdin` | false | Read content from stdin |
| `--input-format` | `md` | `md` (Markdown, auto-converted) or `sb` (Scrapbox native) |

**Response data:** `{ "title": string, "commitId": string }`

### page append

Append content to an existing page.

```sh
cosense page append <title> --body <text> [--after <text>] [--input-format <md|sb>] [--profile <name>] [--project <name>]
cosense page append <title> --body-stdin [--after <text>] [--input-format <md|sb>] [--profile <name>] [--project <name>]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--body` | `""` | Content to append |
| `--body-stdin` | false | Read content from stdin |
| `--input-format` | `md` | `md` or `sb` |
| `--after` | (end) | Substring match; insert after the first matching line. Falls back to end of page if not found. |

**Response data:** `{ "title": string, "commitId": string }`

### export

Export page content with related pages. Use for bulk retrieval.

```sh
cosense export <title> [--depth <1|2>] [--profile <name>] [--project <name>]
cosense export --all [--depth <1|2>] [--profile <name>] [--project <name>]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--depth` | `1` | `1` = root + 1-hop links, `2` = root + 1-hop + 2-hop links |
| `--all` | false | Export all pages in the project (ignores title) |

**Response data:**
```json
{
  "pages": [
    { "title": "Root", "lines": ["..."] },
    { "title": "Related", "lines": ["..."] }
  ]
}
```

## Error Recovery

| Symptom | Error code | Resolution |
|---------|-----------|------------|
| `No project specified` | `ERROR` | Pass `--project` or ensure profile has a default project |
| `Unknown command: X` | `UNKNOWN_COMMAND` | Check spelling; valid commands: `profile`, `page`, `export` |
| `MISSING_ARGUMENT` | `MISSING_ARGUMENT` | Check required positional arguments |
| API/network failure | `ERROR` | Retry; if persistent, the `sid` may have expired (human must re-authenticate) |
| Empty response | - | Page may not exist; verify title with `page search` first |

## Recipes

### Information gathering

```sh
# Search for pages about a topic
cosense page search "authentication" --project my-project

# Get full page content
cosense page get "authentication" --project my-project

# Export a page and all related context
cosense export "authentication" --depth 2 --project my-project
```

### Writing content

```sh
# Create a new page with Markdown
cosense page create "Meeting Notes 2025-01-15" --body "## Agenda\n- Item 1\n- Item 2"

# Create with stdin (useful for long content)
echo "## Summary\nKey decisions made." | cosense page create "Meeting Summary" --body-stdin

# Append to existing page
cosense page append "Daily Log" --body "- Completed task X"

# Insert after a specific section header
cosense page append "Project Plan" --body "- New subtask" --after "## Tasks"

# Write in Scrapbox native format (skip Markdown conversion)
cosense page create "New Page" --body "[link] some [bold text]" --input-format sb
```

### Bulk operations

```sh
# Export entire project
cosense export --all --project my-project

# Paginated page listing
cosense page list --limit 50 --skip 0 --sort updated
cosense page list --limit 50 --skip 50 --sort updated
```

## Configuration

Config file location: `~/.config/cosense-cli/config.json`

Agents should treat this file as read-only. Use `profile` subcommands to modify it.
