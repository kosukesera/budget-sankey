# ゼイリュウ — みんなの税金はどこへ流れる？

日本の令和7年度一般会計予算（115.5兆円）をサンキーダイアグラムで可視化するインタラクティブWebサイトです。

## Features

- **歳入 → 使いみち**: 税収・国債などの歳入から、社会保障・防衛・教育など機能別歳出への流れを可視化
- **使いみち → 省庁**: 機能別歳出から16省庁への配分を可視化
- **3階層ドリルダウン**: ダブルクリックで費目の内訳を順に展開
- **ホバー連動解説**: 各費目にマウスを合わせると概要・昨年比・トレンド・国会論点の4象限パネルを表示
- **レスポンシブ対応**: ウィンドウ幅に応じてSVGサイズを自動調整

## Tech Stack

- [React](https://react.dev/) 19
- [Vite](https://vite.dev/) 8
- Custom SVG Sankey rendering (no d3-sankey dependency)

## Getting Started

```bash
npm install
npm run dev
```

`http://localhost:5173` でアプリが起動します。

## Build

```bash
npm run build
```

`dist/` に静的ファイルが出力されます。

## Data Source

令和7年度一般会計予算（政府案）に基づく。詳細は財務省「令和7年度予算のポイント」等を参照。

## License

[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — 自由に利用・改変・再配布できます。クレジット表記をお願いします。
