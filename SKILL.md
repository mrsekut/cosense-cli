# cosense-cli — SKILL.md

> AI agent (特に Claude Code) が cosense-cli を操作するためのリファレンス

## ツールの目的

Cosense (旧 Scrapbox) プロジェクトのページを CLI 経由で検索・取得・作成・追記するための AI agent 向けツール。JSON 出力をデフォルトとし、パイプラインや後続処理との統合を前提に設計されている。

## 認証の前提

- Cosense の認証は **connect.sid (SID)** で行う
- SID は profile に紐づけて `~/.config/cosense-cli/config.json` に保存される
- **事前に `cosense config set-profile` で SID とプロジェクトを設定しておくこと**
- SID なしでも public プロジェクトにはアクセスできる

```bash
# プロファイル設定（初回のみ）
cosense config set-profile default --sid <connect.sid> --project <project-name>
```

## グローバルオプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--profile <name>` | 使用するプロファイル | `"default"` |
| `--project <name>` | プロジェクト名（プロファイルの default を上書き） | — |
| `--format <json\|text>` | 出力フォーマット | `json` |
| `--help` | ヘルプ表示 | — |

## コマンド一覧

### config — プロファイル管理

```bash
# プロファイル作成/更新
cosense config set-profile <name> --sid <sid> --project <project>

# 一覧表示
cosense config list-profiles

# 削除
cosense config remove-profile <name>
```

### page get — ページ取得

```bash
cosense page get <title>
```

**出力:** タイトル、本文行、リンク、関連ページ

### page list — ページ一覧

```bash
cosense page list [--sort updated] [--limit 100] [--skip 0]
```

**出力:** ページ数、ページ配列（タイトル、説明、更新日時、ビュー数、リンク数）

### page search — 全文検索

```bash
cosense page search <query>
```

query は複数語可。**出力:** クエリ、件数、マッチしたページ配列

### page create — ページ作成

```bash
cosense page create <title> --body "# Markdown content"
cosense page create <title> --body-stdin --input-format md
echo "content" | cosense page create <title> --body-stdin
```

- `--input-format md`（デフォルト）: Markdown → Scrapbox 記法に自動変換
- `--input-format raw`: Scrapbox 記法をそのまま送信
- **出力:** タイトル、commitId

### page append — ページ追記

```bash
cosense page append <title> --body "追記内容"
cosense page append <title> --body "挿入内容" --after "この行の後に挿入"
```

- `--after`: 指定テキストを含む行の直後に挿入。見つからない場合は末尾に追記
- input-format は create と同様
- **出力:** タイトル、commitId

### export — ページエクスポート

```bash
# 単一ページ + 関連ページ
cosense export <title> [--depth 1|2]

# 全ページ（最大 1000 件）
cosense export --all [--depth 1|2]
```

- depth 1: 直接リンク先まで / depth 2: 2ホップ先まで（重複排除済み）
- text フォーマットは `=== Title ===` 区切り
- **出力:** ページ配列（タイトル + 本文行）

### links — リンク構造探索

```bash
cosense links <title> [--depth 1|2]
```

**出力:** タイトル、直接リンク、関連ページ、（depth 2 時）2ホップリンク

## 出力スキーマ

すべてのコマンドは統一されたレスポンス形式を返す:

```jsonc
// 成功時
{ "ok": true, "data": { /* コマンド固有 */ } }

// エラー時
{ "ok": false, "error": { "code": "ERROR_CODE", "message": "説明" } }
```

プロセス終了コード: 成功 = 0, エラー = 1

## 典型的なワークフロー

### ページ検索 → 取得 → 追記

```bash
# 1. キーワードで検索
cosense page search "議事録"

# 2. 見つかったページを取得
cosense page get "2024-01-15 定例議事録"

# 3. 内容を追記
cosense page append "2024-01-15 定例議事録" --body "## 追加メモ\n補足事項をここに記載"
```

### プロジェクト全体の把握

```bash
# ページ一覧を取得
cosense page list --sort updated --limit 50

# 特定ページの関連構造を探索
cosense links "プロジェクト概要" --depth 2

# 関連ページごとまとめてエクスポート
cosense export "プロジェクト概要" --depth 2
```

### 新規ページ作成（stdin 経由）

```bash
echo "# 見出し\n本文" | cosense page create "新しいページ" --body-stdin
```

## やってはいけないこと

- **SID なしで private プロジェクトにアクセスしない** — 認証エラーになる。事前に `config set-profile` で SID を設定すること
- **`--all` export を安易に使わない** — 最大 1000 ページ取得するため、大規模プロジェクトではレスポンスが巨大になる
- **`--after` の文字列を曖昧にしない** — 部分一致で最初にヒットした行の後に挿入されるため、一意に特定できる文字列を指定すること
- **存在しないページに append しない** — ページが存在しない場合はエラーになる。先に `page get` で存在確認するか `page create` で作成すること

## SessionStart hook でのコンテキスト注入

Claude Code の `.claude/settings.json` に以下を追加すると、セッション開始時にこの SKILL.md が自動的にコンテキストに注入される:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": "cat /path/to/cosense-cli/SKILL.md"
      }
    ]
  }
}
```
