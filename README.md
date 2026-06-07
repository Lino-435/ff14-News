# 光の戦士情報局 ⚔️

FF14の最新情報をAIが自動収集・要約するWebアプリ

## 情報源
- **FF14公式 Lodestone** - パッチノート・お知らせ
- **X (Yahoo リアルタイム検索経由)** - コミュニティの話題・ざわめき
- **Claude AI** - 情報を要約・重要度判定

## デプロイ手順

### 1. GitHubにリポジトリを作成
1. https://github.com/new で新しいリポジトリを作成
2. リポジトリ名: `ff14-news`
3. Public/Private どちらでもOK

### 2. コードをプッシュ
```bash
cd ff14-news
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/ff14-news.git
git push -u origin main
```

### 3. Vercelにデプロイ
1. https://vercel.com にGitHubアカウントでログイン
2. 「Add New Project」をクリック
3. ff14-newsリポジトリを選択
4. 「Environment Variables」に以下を追加:
   - Key: `ANTHROPIC_API_KEY`
   - Value: あなたのAPIキー
5. 「Deploy」をクリック

### 4. iPhoneのホーム画面に追加
1. Safariでデプロイ後のURLを開く
2. 共有ボタン → 「ホーム画面に追加」
3. アプリのように使える！
