// drizzle.config.ts (修正案)

import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv'; // .env ファイルから環境変数を読み込むために追加

// .env ファイルを読み込む（Cloudflareの認証情報を取得するため）
dotenv.config({ path: '.env' }); 

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',

  // 🚨 修正が必要な部分: D1 HTTP API 接続情報
  driver: 'd1-http', // 接続ドライバーを明示的に指定
  dbCredentials: {
    // これらの情報は .env や Cloudflare の設定から取得します
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!, 
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_API_TOKEN!, 
  },
});