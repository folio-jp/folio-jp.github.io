# KASANE COFFEE ROASTERS — 1ページ LP（架空店舗デモ）

清澄白河の自家焙煎ロースタリーカフェ「KASANE COFFEE ROASTERS」の
1ページ ホームページです。**すべて架空店舗のデモンストレーション**であり、
掲載している店舗・人物・住所・電話番号・口コミ・商品はすべて実在しません。

## 公開方法（GitHub Pages）

このフォルダ（`site/`）の中身が、そのまま公開できる静的サイトです。
ビルド不要。サーバー不要。HTMLを開くだけで動きます。

1. GitHub に新規リポジトリを作成（例：`kasane-coffee-roasters`）
2. この `site/` フォルダの**中身**をリポジトリ直下に配置
   （`index.html` がリポジトリのトップに来るようにする）
3. リポジトリ Settings → Pages → Source を
   `Deploy from a branch` → `main` / `/ (root)` に設定
4. 数十秒後、`https://<ユーザー名>.github.io/<リポジトリ名>/` で公開

> `.nojekyll` を同梱済みのため、Jekyll による処理をスキップして
> そのまま配信されます。

## 公開後にやること（URL差し替え）

`index.html`, `robots.txt`, `sitemap.xml` 内の
`https://folio-jp.github.io/kasane-coffee-roasters/` を、
実際の公開URLに置換してください（canonical / OGP / 構造化データ / sitemap）。

例：
```
folio-jp.github.io/kasane-coffee-roasters  →  実際の公開ドメイン
```

独自ドメインを使う場合は `site/` に `CNAME` ファイル（中身は
ドメイン名のみ）を追加してください。

## ファイル構成

```
site/
├─ index.html            … LP本体（1ファイル完結のマークアップ＋ロジック）
├─ support.js            … 描画ランタイム（外部通信なし・同梱）
├─ .nojekyll             … GitHub Pages 用
├─ robots.txt
├─ sitemap.xml
└─ assets/
   ├─ favicon.png        … ファビコン（シンボルマーク）
   ├─ ogp.jpg            … OGP画像 1200×630
   └─ opt/               … 本文で使用する画像（1600px以下・JPEG最適化済み）
```

## 実装ハイライト

- **構成**：固定ヘッダー / ファーストビュー / 導入 / コンセプト / 3つの特徴 /
  人気メニュー / フルメニュー / ギャラリー / ストーリー・制作工程 /
  過ごし方・設備 / 口コミ（デモ）/ 物販・ギフト / Instagram /
  アクセス / 最終CTA / フッター / モバイル固定CTA
- **レスポンシブ**：320 / 375 / 430 / 768 / 1024 / 1440px を個別最適化。
  CSS Grid・Flexbox・`clamp()`・`aspect-ratio` 中心、横スクロールなし。
- **アクセシビリティ**：セマンティックHTML、skip link、キーボード操作、
  フォーカストラップ（モバイルメニュー / ライトボックス）、ESC、
  44px以上のタップ領域、`prefers-reduced-motion` 対応。
- **パフォーマンス**：画像は1600px以下のJPEGへ最適化、遅延読み込み、
  ファーストビュー画像は優先読み込み、外部埋め込みなし。
- **SEO**：title / description / canonical / OGP / X Card / favicon /
  apple-touch-icon / 構造化データ（デモ明記）/ robots.txt / sitemap.xml。

## デモ用の外部リンク

予約・オンラインショップ・地図・メール等は `*.example` の
プレースホルダーURLです。実運用時に実URL・地図埋め込みへ
差し替えてください。

---
本サイトは架空店舗のデモンストレーションです。
