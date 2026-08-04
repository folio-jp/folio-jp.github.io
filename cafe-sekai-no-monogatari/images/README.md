# public/images

docs/image-ledger.md で配置が決まった画像のみを置く。

- ディレクトリはページ単位（home / story / menu / collection / journal / access）。
- ファイル名は画像IDを含める（例: img-060-interior.jpg）。台帳のIDとの対応を必ず維持する。
- 配置したら src/data/images.ts の imageRegistry へ登録する。
- 除外画像、台帳にない画像、AI生成画像は置かない。
- 配信対象は最適化済みWebPのみ。PNG/JPEG原本は `photos/published-originals/` に保全し、publicへ置かない。
