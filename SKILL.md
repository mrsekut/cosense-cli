# cosense — SKILL.md

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
```

## Global Options

| Option             | Description                                      | Default |
| ------------------ | ------------------------------------------------ | ------- |
| `--project <name>` | Project name (required for page/export commands) | —       |
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
bunx cosense project add <name> --profile <profile>

# List all registered projects
bunx cosense project list

# Remove a project
bunx cosense project remove <name>
```

### page get — Fetch a page

```bash
bunx cosense page get <title> --project <name>
```

**Output:** title, lines, links, related pages

### page list — List pages

```bash
bunx cosense page list --project <name> [--sort updated] [--limit 100] [--skip 0]
```

**Output:** count, array of pages (title, descriptions, updated, views, linked)

### page search — Full-text search

```bash
bunx cosense page search <query> --project <name>
```

Multiple words allowed. **Output:** query, count, matched pages

### page create — Create a page

```bash
bunx cosense page create <title> --project <name> --body "# Markdown content"
bunx cosense page create <title> --project <name> --body-stdin --input-format md
echo "content" | bunx cosense page create <title> --project <name> --body-stdin
```

- `--input-format md` (default): auto-converts Markdown to Scrapbox notation
- `--input-format sb`: sends Scrapbox notation as-is
- **Output:** title, url, commitId

### page append — Append to a page

```bash
bunx cosense page append <title> --project <name> --body "appended content"
bunx cosense page append <title> --project <name> --body "inserted" --after "insert after this line"
```

- `--after`: inserts after the first line containing the given text. Falls back to end of page if not found.
- input-format works the same as create
- **Output:** title, url, commitId

### export — Export pages

```bash
# Single page + related pages
bunx cosense export <title> --project <name> [--depth 1|2]

# All pages
bunx cosense export --all --project <name> [--depth 1|2]
```

- depth 1: direct links / depth 2: 2-hop links (deduplicated)
- **Output:** array of pages (title + lines)

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

### Search → Fetch → Append

```bash
# 1. Search by keyword
bunx cosense page search "meeting notes" --project my-project

# 2. Fetch the found page
bunx cosense page get "2024-01-15 Weekly Meeting" --project my-project

# 3. Append content
bunx cosense page append "2024-01-15 Weekly Meeting" --project my-project --body "## Additional Notes\nSupplementary info here"
```

### Explore an entire project

```bash
# List recent pages
bunx cosense page list --project my-project --sort updated --limit 50

# Export a page with all related context
bunx cosense export "Project Overview" --project my-project --depth 2
```

### Create a page via stdin

```bash
echo "# Heading\nBody text" | bunx cosense page create "New Page" --project my-project --body-stdin
```

## Do NOT

- **Access private projects without SID** — results in auth error. Set up with `profile set` first.
- **Use `--all` export carelessly** — fetches all pages; response can be very large for big projects.
- **Use vague `--after` strings** — partial match hits the first matching line. Use a unique string.
- **Append to nonexistent pages** — results in error. Check with `page get` first or use `page create`.
- **Specify unregistered projects** — register with `cosense project add` first.
