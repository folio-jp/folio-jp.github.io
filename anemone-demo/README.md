# Hair salon Anemone デモHP

4ページ構成の静的サイトです。

- `index.html`：トップ、店舗情報、アクセス、予約
- `about.html`：サロン紹介・代表プロフィール
- `menu.html`：主な通常メニュー・税込料金・個別条件
- `gallery.html`：掲載ヘアスタイル15件

`site`フォルダ全体を同じ階層のまま静的Webサーバーへ配置してください。ローカルでは `python3 -m http.server 4175` で起動し、http://localhost:4175/ を開きます。

営業時間10：00～18：00、定休日は木曜日（2026年9月15日にユーザー確認）。現行の支払い方法は未確認のため、店舗への問い合わせ案内を掲載しています。予約はHot Pepper Beautyの当該サロンページと電話番号に接続します。

掲載料金は提供された2026年9月8日の店舗マスターに基づきます。全メニューとクーポンの条件は予約先で確認する案内を掲載しています。公開URLは https://folio-jp.github.io/anemone-demo/ です。各ページにcanonical URLとSNS共有用URLを設定しています。

元のフォントと実行環境を引き継いでいるため、Google Fontsとunpkgへのインターネット接続が必要です。
