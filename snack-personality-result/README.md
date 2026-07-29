# 好きなお菓子からわかる12タイプ診断｜結果ページ

カスタムGPTが生成したURLパラメータを受け取り、診断結果を可視化する静的Webサイトです。結果から全12タイプ一覧、各タイプ詳細へ回遊できます。診断質問や採点は行いません。

## 公開URL

- ベースURL：`https://folio-jp.github.io/snack-personality-result/`
- GitHubリポジトリ：`https://github.com/folio-jp/folio-jp.github.io`
- 公開ブランチ：`main`
- 公開ディレクトリ：リポジトリ直下の `snack-personality-result/`

## ファイル構成

```text
snack-personality-result/
├── index.html                 # ページ構造
├── types.html                 # 全12タイプ一覧
├── type.html                  # URLで切り替えるタイプ詳細テンプレート
├── styles.css                 # レスポンシブ・印刷CSS
├── browse.css                 # 一覧・詳細ページ共通CSS
├── app.js                     # 入力検証・描画・共有・印刷
├── types-page.js              # 一覧描画・絞り込み
├── type-page.js               # 詳細描画・ID検証・前後ナビ
├── types.js                   # 12タイプ一元データ（自動生成）
├── README.md
├── package.json
├── package-lock.json
├── .nojekyll
├── assets/                    # 確定キャラクターPNG 12体
├── scripts/build-data.mjs     # 正本Markdownからtypes.jsを生成
├── source/                    # 添付された正本Markdown 4資料
└── tests/site.test.mjs        # 自動テスト
```

`node_modules/`は公開対象に含めません。

## ページURL

- 診断結果：`./?m=...`
- 全12タイプ一覧：`./types.html`
- タイプ詳細：`./type.html?id=T01`

詳細ページの`id`は`T01`〜`T12`のみ許可します。無効または空の場合はタイプを偽装せず、専用エラーと一覧への導線を表示します。

## URLパラメータ

| キー | 内容 | 形式 |
|---|---|---|
| `m` | メインタイプ | `T01`〜`T12` |
| `s` | サブタイプ | `T01`〜`T12` |
| `t` | 第3タイプ | `T01`〜`T12` |
| `a` | 好奇心、社交性、こだわり、安心志向、刺激欲求 | 0〜100の数値5個をカンマ区切り |
| `p` | メイン、サブ、第3タイプの構成比 | 0〜100の数値3個をカンマ区切り |
| `snack` | 好きなお菓子名 | URLエンコード済み文字列、最大40文字 |

`p`の合計が100でない場合は、比率を保ちながら整数の合計が100になるよう再正規化します。不正値は安全なサンプル値に戻し、画面上部に補正案内を表示します。ユーザー入力は`textContent`経由でのみDOMへ挿入します。

## タイプID一覧

- T01：ときめきシェアラー／シェアリ
- T02：ほっとひと息クラシック派／クラノ
- T03：こだわりカカオ派／カカリオ
- T04：冒険スナッカー／スナッピ
- T05：刺激ハンター／ビリッツ
- T06：ごほうびリッチ派／リッチェ
- T07：さくさくムードメーカー／サクポン
- T08：じっくりマイペース派／モグリィ
- T09：きっちりヘルシー派／トトノ
- T10：ノスタルジーコレクター／オモイネ
- T11：ひらめきフレーバー派／ヒラメキィ
- T12：まろやか癒し派／マロネ

## ローカル確認

Node.js 20以降を推奨します。

```bash
npm install
npm test
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000/`、`/types.html`、`/type.html?id=T01`を開きます。ファイルを直接開くよりHTTPサーバー経由を推奨します。

正本Markdownを更新した場合は、先に次を実行します。

```bash
npm run build:data
npm test
```

## GitHub Pages公開

本番はユーザーサイト用リポジトリ `folio-jp/folio-jp.github.io` の `main` ブランチから配信します。このフォルダを同名パスへ配置すれば、クエリパラメータを含むURLもそのまま動作します。

別リポジトリへ移す場合は、Settings → Pagesで `Deploy from a branch`、`main`、`/(root)`を選択してください。

## カスタムGPTとの連携

カスタムGPTは診断後に、次のベースURLへ6パラメータを付けたURLを生成します。

```text
https://folio-jp.github.io/snack-personality-result/?m={MAIN}&s={SUB}&t={THIRD}&a={AXIS_1},{AXIS_2},{AXIS_3},{AXIS_4},{AXIS_5}&p={MAIN_PERCENT},{SUB_PERCENT},{THIRD_PERCENT}&snack={URL_ENCODED_SNACK}
```

カスタムGPTのInstructions内にある`<RESULT_PAGE_BASE_URL>`は次へ置き換えます。

```text
https://folio-jp.github.io/snack-personality-result/
```

## テスト用URL

```text
https://folio-jp.github.io/snack-personality-result/?m=T01&s=T07&t=T10&a=55,95,40,75,30&p=50,30,20&snack=%E3%83%9D%E3%83%83%E3%82%AD%E3%83%BC

https://folio-jp.github.io/snack-personality-result/?m=T07&s=T05&t=T04&a=66,74,54,43,74&p=48,31,21&snack=%E3%83%97%E3%83%AA%E3%83%83%E3%83%84

https://folio-jp.github.io/snack-personality-result/?m=T11&s=T04&t=T03&a=97,53,82,22,68&p=52,30,18&snack=%E7%99%BE%E5%91%B3%E3%83%93%E3%83%BC%E3%83%B3%E3%82%BA

https://folio-jp.github.io/snack-personality-result/?m=T12&s=T10&t=T02&a=30,50,40,100,15&p=55,25,20&snack=%E3%83%9E%E3%82%B7%E3%83%A5%E3%83%9E%E3%83%AD
```

## キャラクター画像の管理

- `03_キャラクター対応表(1).md`記載のID・キャラクター名・推奨ファイル名を正本とします。
- 診断ごとに画像を生成せず、`assets/`内の確定PNGのみを使います。
- 別タイプの画像を代用しません。
- 画像の色、服装、小物、構図を改変しません。
- 画像を差し替える場合も、対応するタイプIDとファイル名を維持します。

## 更新時の注意点

- タイプ名、キャラクター名、本文、相性、カラーは`source/`の正本を変更してから`npm run build:data`を実行します。
- 一覧・詳細用のタグ、補助分類、お菓子スタイル、似ているタイプも`build-data.mjs`から同じ`types.js`へ生成し、ページ別データを作りません。
- `types.js`は自動生成物のため直接編集しません。
- 一言コピーが対応表と結果文章で一致しない場合、生成処理は失敗します。
- 12タイプ未満、無効な相性ID、対応表不足も生成エラーになります。
- 更新後は必ず`npm test`、375px・390px・430px・768px・1440pxの表示、印刷プレビュー、共有URLを確認します。
- 診断を正式な心理検査・医療診断として表現しません。
