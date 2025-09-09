# Circle Research

Circle ResearchはNext.js、TypeScript、VOライブラリを使用したWebアプリケーションです。

## 必要な環境

- Node.js 20以上
- Docker Desktop（Dockerを使用する場合）
- npm または yarn

## 環境構築手順

### 1. リポジトリのクローン

```bash
git clone [リポジトリURL]
cd circle-research
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成します：

```bash
cp .env.example .env
```

必要に応じて`.env`ファイル内の値を編集してください。デフォルト値で動作します。

### 4. 開発サーバーの起動

#### ローカルで起動する場合

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で確認できます。

#### Dockerを使用する場合

1. **Docker Desktopの起動**
   - macOS: ApplicationsフォルダからDocker Desktopを起動
   - Windows: スタートメニューからDocker Desktopを起動
   - Linux: dockerサービスが起動していることを確認

2. **Dockerの動作確認**
   ```bash
   docker --version
   docker ps
   ```

3. **コンテナの起動**
   ```bash
   # すべてのサービスを起動（データベース含む）
   docker-compose up -d
   
   # ログを確認
   docker-compose logs -f
   ```

   - 開発環境: http://localhost:3001
   - 本番環境: http://localhost:3000
   - PostgreSQLデータベース: localhost:5432

## データベース操作

### Prismaマイグレーション

```bash
# マイグレーションファイルの作成と実行
npm run db:migrate

# データベーススキーマの同期（マイグレーション履歴なし）
npm run db:push

# Prisma Clientの生成
npm run db:generate

# Prisma Studio（データベースGUI）
npm run db:studio
```

## 利用可能なコマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番用ビルドを作成 |
| `npm run start` | 本番サーバーを起動 |
| `npm run lint` | ESLintでコードをチェック |
| `npm run db:migrate` | Prismaマイグレーションを実行 |
| `npm run db:studio` | Prisma Studioを起動 |

## Docker Composeコマンド

| コマンド | 説明 |
|---------|------|
| `docker-compose up -d` | すべてのサービスをバックグラウンドで起動 |
| `docker-compose down` | すべてのサービスを停止 |
| `docker-compose logs -f` | ログをリアルタイムで確認 |
| `docker-compose ps` | 起動中のコンテナを確認 |
| `docker-compose exec dev bash` | 開発コンテナにログイン |

## トラブルシューティング

### Dockerが起動しない場合

1. **Docker Desktopが起動していることを確認**
   ```bash
   docker ps
   ```
   エラーが出る場合はDocker Desktopを起動してください。

2. **ポートが使用されている場合**
   ```bash
   # 使用中のポートを確認
   lsof -i :3000
   lsof -i :5432
   
   # プロセスを終了
   kill -9 [PID]
   ```

3. **コンテナの再起動**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

### データベース接続エラー

1. **環境変数の確認**
   `.env`ファイルの`DATABASE_URL`が正しいことを確認

2. **データベースコンテナの状態確認**
   ```bash
   docker-compose ps db
   docker-compose logs db
   ```

3. **データベースへの直接接続テスト**
   ```bash
   docker-compose exec db psql -U circleuser -d circle_research
   ```

## プロジェクト構成

```
circle-research/
├── app/                  # Next.js App Router
│   ├── layout.tsx       # ルートレイアウト
│   ├── page.tsx         # ホームページ
│   └── globals.css      # グローバルCSS
├── prisma/
│   └── schema.prisma    # Prismaスキーマ
├── public/              # 静的ファイル
├── docker-compose.yml   # Docker Compose設定
├── Dockerfile          # 本番用Dockerfile
├── Dockerfile.dev      # 開発用Dockerfile
├── next.config.ts      # Next.js設定
├── tailwind.config.js  # Tailwind CSS設定
└── package.json        # プロジェクト設定
```

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **コンテナ**: Docker, Docker Compose
- **その他**: VO (並行処理ライブラリ)

## 開発のヒント

1. **ホットリロード**: 開発サーバーではファイルの変更が自動的に反映されます
2. **型安全性**: TypeScriptを活用して型安全なコードを書きましょう
3. **Prisma Studio**: データベースの内容を確認・編集する際に便利です
4. **VOライブラリ**: 並行処理やエラーハンドリングに活用してください

## ライセンス

[ライセンス情報を記載]