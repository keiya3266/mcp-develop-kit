# CLAUDE.md

## プロジェクト概要
@modelcontextprotocol/sdkを使用したサンプルMCPサーバーの実装です。基本的なツール群を提供し、MCPの動作を理解するためのリファレンス実装として機能します。

## 主要コマンド

### 開発・ビルド
- `npm run build` - TypeScriptコンパイル
- `npm run dev` - 開発モード（TypeScriptを直接実行）
- `npm start` - 本番実行

### テスト・品質管理
- `npm test` - テスト実行
- `npm run test:watch` - ウォッチモードでテスト
- `npm run typecheck` - TypeScript型チェック
- `npm run lint` - ESLintによるコード品質チェック

## プロジェクト構造

```
src/
├── index.ts          # メインのMCPサーバー実装
└── index.test.ts     # テストファイル（Vitest使用）
```

## 実装されているツール

1. **calculate** - 数学計算（セキュリティを考慮した式評価）
2. **generate_uuid** - UUID v4生成
3. **reverse_string** - 文字列反転
4. **current_time** - 現在時刻取得（複数フォーマット対応）

## アーキテクチャのポイント

- **型安全性**: TypeScriptの厳密な型チェックを活用
- **エラーハンドリング**: 各ツールで適切なエラー処理を実装
- **セキュリティ**: 計算式のサニタイズなど基本的なセキュリティ対策
- **テスト**: 包括的なユニットテスト（18テスト）
- **MCP準拠**: Model Context Protocolの仕様に完全準拠

## 技術スタック

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: @modelcontextprotocol/sdk
- **Testing**: Vitest
- **Linting**: ESLint + @typescript-eslint
- **Build**: TypeScript Compiler

## 使用方法

Claude DesktopなどのMCPクライアントで使用するには、設定ファイルに以下を追加：

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