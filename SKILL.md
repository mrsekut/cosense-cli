# cosense-cli — SKILL.md

> AI agent (特に Claude Code) が cosense-cli を操作するためのリファレンス

## ツールの目的

Cosense (旧 Scrapbox) プロジェクトのページを CLI 経由で検索・取得・作成・追記するための AI agent 向けツール。JSON 出力をデフォルトとし、パイプラインや後続処理との統合を前提に設計されている。

## 認証の前提

- Cosense の認証は **connect.sid (SID)** で行う
- SID は profile に紐づけて `~/.config/cosense-cli/config.json` に保存される
- project は profile（アカウント）に紐づけて登録する
- **事前に `cosense profile set` と `cosense project add` を実行しておくこと**
- SID なしでも public プロジェクトにはアクセスできる

```bash
# 1. プロファイル作成（人間が実行、初回のみ）
cosense profile set personal --sid <connect.sid>

# 2. プロジェクト登録（人間 or AI）
cosense project add my-project --profile personal
```

## グローバルオプション

| オプション | 説明 | デフォルト |
|---|---|---|
| `--project <name>` | プロジェクト名（page/export コマンドで必須） | — |
| `--help` | ヘルプ表示 | — |

## コマンド一覧

### profile — プロファイル管理（アカウント単位）

```bash
# プロファイル作成/更新（SIDのみ）
cosense profile set <name> --sid <sid>

# 一覧表示
cosense profile list

# 削除
cosense profile remove <name>
```

`profile set` は対話モードにも対応しており、引数を省略するとプロンプトで入力を求められる。

### project — プロジェクト管理

```bash
# プロジェクトをプロファイルに紐づけて登録
cosense project add <name> --profile <profile>

# 一覧表示
cosense project list

# 削除
cosense project remove <name>
```

### page get — ページ取得

```bash
cosense page get <title> --project <name>
```

**出力:** タイトル、本文行、リンク、関連ページ

### page list — ページ一覧

```bash
cosense page list --project <name> [--sort updated] [--limit 100] [--skip 0]
```

**出力:** ページ数、ページ配列（タイトル、説明、更新日時、ビュー数、リンク数）

### page search — 全文検索

```bash
cosense page search <query> --project <name>
```

query は複数語可。**出力:** クエリ、件数、マッチしたページ配列

### page create — ページ作成

```bash
cosense page create <title> --project <name> --body "# Markdown content"
cosense page create <title> --project <name> --body-stdin --input-format md
echo "content" | cosense page create <title> --project <name> --body-stdin
```

- `--input-format md`（デフォルト）: Markdown → Scrapbox 記法に自動変換
- `--input-format sb`: Scrapbox 記法をそのまま送信
- **出力:** タイトル、commitId

### page append — ページ追記

```bash
cosense page append <title> --project <name> --body "追記内容"
cosense page append <title> --project <name> --body "挿入内容" --after "この行の後に挿入"
```

- `--after`: 指定テキストを含む行の直後に挿入。見つからない場合は末尾に追記
- input-format は create と同様
- **出力:** タイトル、commitId

### export — ページエクスポート

```bash
# 単一ページ + 関連ページ
cosense export <title> --project <name> [--depth 1|2]

# 全ページ
cosense export --all --project <name> [--depth 1|2]
```

- depth 1: 直接リンク先まで / depth 2: 2ホップ先まで（重複排除済み）
- **出力:** ページ配列（タイトル + 本文行）

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
cosense page search "議事録" --project my-project

# 2. 見つかったページを取得
cosense page get "2024-01-15 定例議事録" --project my-project

# 3. 内容を追記
cosense page append "2024-01-15 定例議事録" --project my-project --body "## 追加メモ\n補足事項をここに記載"
```

### プロジェクト全体の把握

```bash
# ページ一覧を取得
cosense page list --project my-project --sort updated --limit 50

# 関連ページごとまとめてエクスポート
cosense export "プロジェクト概要" --project my-project --depth 2
```

### 新規ページ作成（stdin 経由）

```bash
echo "# 見出し\n本文" | cosense page create "新しいページ" --project my-project --body-stdin
```

## やってはいけないこと

- **SID なしで private プロジェクトにアクセスしない** — 認証エラーになる。事前に `profile set` で SID を設定すること
- **`--all` export を安易に使わない** — 全ページ取得するため、大規模プロジェクトではレスポンスが巨大になる
- **`--after` の文字列を曖昧にしない** — 部分一致で最初にヒットした行の後に挿入されるため、一意に特定できる文字列を指定すること
- **存在しないページに append しない** — ページが存在しない場合はエラーになる。先に `page get` で存在確認するか `page create` で作成すること
- **未登録の project を指定しない** — `cosense project add` で事前に登録すること

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
