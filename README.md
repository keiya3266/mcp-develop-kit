# @keiya3266/sample-tools-mcp

@modelcontextprotocol/sdkを使用したプライベートMCPサーバーです。GitHub Package Registryで配布され、npxで直接実行可能です。基本的なツール群を提供し、MCPの動作を理解するためのリファレンス実装として機能します。

## 提供されるツール

### 1. calculate
数学的な計算を実行します。

- **説明**: 基本的な数学演算（+, -, *, /, 括弧）をサポート
- **入力**: `expression` (string) - 計算式
- **例**: `"2 + 3 * 4"` → `"2 + 3 * 4 = 14"`

### 2. generate_uuid
ランダムなUUIDを生成します。

- **説明**: UUID version 4を生成
- **入力**: `version` (number, optional) - UUIDバージョン（デフォルト: 4）
- **例**: → `"550e8400-e29b-41d4-a716-446655440000"`

### 3. reverse_string
文字列を逆順にします。

- **説明**: 入力された文字列を文字単位で逆順に変換
- **入力**: `text` (string) - 逆順にする文字列
- **例**: `"hello"` → `"olleh"`

### 4. current_time
現在の日時を取得します。

- **説明**: 複数のフォーマットで現在時刻を取得
- **入力**: `format` (string, optional) - フォーマット（"iso", "unix", "readable"）
- **例**: 
  - `"iso"` → `"2024-01-01T12:00:00.000Z"`
  - `"unix"` → `"1704110400"`
  - `"readable"` → `"1/1/2024, 12:00:00 PM"`

## インストール・使用方法

### GitHub Package Registryからの使用（プライベートパッケージ）

#### 前提条件
このパッケージはGitHub Package Registryに公開されているため、使用するには認証設定が必要です。

1. **Personal Access Tokenの作成**
   - GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - `read:packages`権限を含むトークンを作成

2. **認証設定**
   ```bash
   # グローバル.npmrcに認証情報を追加
   echo "@keiya3266:registry=https://npm.pkg.github.com/" >> ~/.npmrc
   echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc
   ```

3. **使用**
   ```bash
   # 認証設定後、直接実行可能（動作確認済み）
   npx -y @keiya3266/sample-tools-mcp
   ```

### ローカル開発

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# 開発モード（TypeScriptを直接実行）
npm run dev

# 本番実行
npm start
```

## テスト

```bash
# テスト実行
npm test

# ウォッチモードでテスト
npm run test:watch

# 型チェック
npm run typecheck

# リント
npm run lint
```

## 使用方法

このMCPサーバーは、MCP（Model Context Protocol）クライアントから使用されることを想定しています。サーバーは標準入出力（stdio）を通じて通信を行います。

### Claude Desktop での使用例

Claude Desktop の設定に以下を追加：

#### GitHub Package Registry使用（推奨・動作確認済み）
```json
{
  "mcpServers": {
    "sample-tools": {
      "command": "npx",
      "args": ["-y", "@keiya3266/sample-tools-mcp"]
    }
  }
}
```

**注意**: この設定を使用する前に、上記の認証設定を完了してください。

**動作確認**: `npx -y @keiya3266/sample-tools-mcp`で正常に起動することを確認済みです。

#### ローカルファイル使用
```json
{
  "mcpServers": {
    "sample-tools": {
      "command": "node",
      "args": ["/path/to/mcp-develop-kit/dist/index.js"]
    }
  }
}
```

## アーキテクチャ

- **メインクラス**: `SampleToolsServer` - MCPサーバーのコア機能を実装
- **通信**: `StdioServerTransport` - 標準入出力を使用した通信
- **エラーハンドリング**: 各ツールで適切なエラーハンドリングを実装
- **セキュリティ**: 計算式のサニタイズなど、基本的なセキュリティ対策を実装

## 技術スタック

- **TypeScript**: 型安全性を確保
- **@modelcontextprotocol/sdk**: MCP SDKを使用
- **Vitest**: テストフレームワーク
- **ESLint**: コード品質の維持

## 開発

新しいツールを追加する場合：

1. `getAvailableTools()` メソッドにツール定義を追加
2. `setupToolHandlers()` メソッドにハンドラーを追加
3. 対応するハンドラーメソッドを実装
4. テストを作成

コード規約：
- TypeScriptの厳密な型チェックを使用
- すべての関数に適切なエラーハンドリングを実装
- セキュリティを考慮した実装（入力値のサニタイズなど）