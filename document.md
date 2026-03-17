# Edge DevTools を使ったHTTPエラーレスポンス テスト手順書

**対象環境：** Windows / Microsoft Edge  
**目的：** バックエンドに依存せず、任意のHTTPステータスコード（400系・500系）をフロントエンドで再現する  
**難易度順：** 方法① → 方法② → 方法③ の順に試すことを推奨

---

## 事前確認

- Microsoft Edge がインストールされていること
- テスト対象のWebアプリケーションがブラウザで開けること
- DevTools が開けること（`F12` キーで起動確認）

---

## 方法① Console で xhook を使って XHR を差し替える（動作確認済み）

### 概要

`xhook` というライブラリをConsoleから読み込み、XHRのリクエストをプロキシ化することで任意のステータスコードを返す。  
**Angular の HttpClient は内部的に XMLHttpRequest（XHR）を使用しているため、`window.fetch` の上書きでは効かない。xhook はこの問題を解決する。**

### なぜ4つのプロパティを書き換える必要があるのか

Angular の HttpClient はレスポンスを受け取るとき、以下の4つを参照してエラー判定を行う。

| プロパティ     | 役割                                                 |
| -------------- | ---------------------------------------------------- |
| `status`       | 数値（500）でエラーの種類を判断する                  |
| `statusText`   | 文字列（"Internal Server Error"）でログ表示に使う    |
| `responseText` | 文字列としてのレスポンスボディ（旧API）              |
| `response`     | パース済みのレスポンスボディ（Angular が実際に読む） |

1つでも元の値のままだとAngularの判定が矛盾するため、**4つ全て書き換える必要がある。**

### なぜ `Object.defineProperty` では動かないのか

XHRの `status` はブラウザが内部的にセットするネイティブプロパティであり、`configurable: false` の状態で存在している。  
レスポンス受信後にこれを `Object.defineProperty` で上書きしようとすると `TypeError` が発生する。  
xhook はリクエスト送信**前**にXHR全体をプロキシ化するため、この制約を回避できる。

### 手順

#### STEP 1 - DevTools を開く

1. テスト対象のページをEdgeで開く
2. キーボードの `F12` を押す
3. DevTools ウィンドウが画面下部または右側に表示されることを確認する

#### STEP 2 - Console タブを開く

1. DevTools 上部のタブ一覧から **「Console」** をクリックする
2. `>` のプロンプトが表示されていることを確認する

#### STEP 3 - 貼り付けを許可する

初めてConsoleにコードを貼り付けようとすると、以下の警告が表示される場合がある。

```
Warning: Don't paste code into the Devtools Console that you don't understand
or haven't reviewed yourself. This could allow attackers to steal your identity
or take control of your computer. Please type 'allow pasting' below and press
Enter to allow pasting.
```

これはEdgeの**正常なセキュリティ機能**であり、エラーではない。

**対処手順：**

1. Consoleのプロンプトに **キーボードで手入力** で以下を打ち込む（コピペ不可）
   ```
   allow pasting
   ```
2. `Enter` を押す
3. `undefined` と表示されれば許可完了

> **なぜこの警告が出るのか：**  
> 悪意あるサイトが「このコードをConsoleに貼り付けてください」と誘導し、  
> CookieやTokenを盗むスクリプトを実行させる攻撃（Self-XSS）を防ぐための仕組み。  
> 手入力させることで「内容を理解した上での意図的な操作」であることを確認している。
>
> **有効期間：** DevToolsを開いている間のみ有効。閉じて再度開いた場合は再入力が必要。

#### STEP 4 - xhook を読み込む

以下のコードを貼り付けて `Enter` を押す。

```javascript
const script = document.createElement("script");
script.src = "https://unpkg.com/xhook@latest/dist/xhook.min.js";
document.head.appendChild(script);
```

> **注意：** xhook はインターネット上のCDNから読み込む。  
> 社内ネットワーク等で外部アクセスが制限されている場合は方法②（Fiddler）を使うこと。

#### STEP 5 - 数秒待ってから差し替えスクリプトを実行する

xhook の読み込みが完了するまで数秒待ってから、以下を貼り付けて `Enter` を押す。

```javascript
xhook.after(function (request, response) {
  if (request.url.includes("/settings/thresholds")) {
    // ← 対象URLの一部に書き換える
    response.status = 500; // ← 返したいステータスコード
    response.statusText = "Internal Server Error";
    response.text = JSON.stringify({ message: "forced error" });
    response.data = JSON.stringify({ message: "forced error" });
  }
});
```

> **ポイント：**
>
> - `request.url.includes(...)` の文字列を、テストしたいAPIのURLの一部に変更する  
>   例：`/api/users`、`/api/orders/detail` など
> - `response.status` の数値を変えることで 400、401、403、404、503 なども再現できる
> - `response.statusText` はステータスコードに対応する文字列に変える  
>   例：`400` → `'Bad Request'`、`404` → `'Not Found'`、`503` → `'Service Unavailable'`

#### STEP 6 - リクエストを発生させる

1. テスト対象のページを操作して、APIリクエストが発生する操作を行う  
   例：ボタンを押す、フォームを送信するなど

#### STEP 7 - Network タブで結果を確認する

1. DevTools の **「Network」** タブをクリックする
2. リクエスト一覧の中から対象のAPIリクエストを探す
3. **Status 列** に `500`（または指定したコード）が表示されていることを確認する
4. リクエストをクリックすると詳細（レスポンスボディなど）も確認できる

#### STEP 8 - 元に戻す

- ページを `F5` でリロードするだけで xhook ごとリセットされ、元の動作に戻る

### トラブルシューティング

| 症状                                      | 原因                                                            | 対処                                                      |
| ----------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| STEP 4 でエラーが出る                     | 外部CDNへのアクセスが制限されている                             | 方法②（Fiddler）を使う                                    |
| `xhook is not defined` というエラーが出る | STEP 4 の読み込みが完了していない                               | さらに数秒待ってから STEP 5 を実行する                    |
| ステータスコードが変わっていない          | `request.url.includes(...)` の文字列が実際のURLと一致していない | Network タブで実際のURLを確認し、一致する文字列に変更する |
| Networkタブにリクエストが表示されない     | Network タブを開く前にリクエストが発生した                      | Network タブを開いた状態でページ操作をやり直す            |

---

## 方法② Fiddler Classic を使う（再現性・繰り返し使用向け）

### 概要

Windowsで定番のプロキシツール「Fiddler Classic」を使い、ブラウザのすべての通信をインターセプトしてレスポンスを差し替える。  
`fetch` / `XMLHttpRequest` どちらにも対応し、ルールを保存できるので繰り返しのテストに向いている。

### 事前準備

#### Fiddler Classic のインストール

1. 以下のURLにアクセスする  
   `https://www.telerik.com/fiddler/fiddler-classic`
2. **「Download for free」** ボタンをクリックする
3. メールアドレスを入力してダウンロードする
4. ダウンロードされた `.exe` ファイルを実行してインストールする
5. インストール完了後、Fiddler Classic を起動する

#### Edge に証明書をインストールする（HTTPS対応）

HTTPSのサイトをインターセプトするために必要な手順。

1. Fiddler を起動した状態で、メニューバーの **「Tools」** → **「Options」** をクリックする
2. **「HTTPS」** タブをクリックする
3. **「Decrypt HTTPS traffic」** にチェックを入れる
4. 警告ダイアログが表示されたら **「Yes」** をクリックする（証明書インストールの確認）
5. さらに証明書のインストール確認が出たら **「Yes」** をクリックする
6. **「OK」** で閉じる

### 手順

#### STEP 1 - Fiddler を起動してトラフィックをキャプチャする

1. Fiddler Classic を起動する
2. 画面左下に **「Capturing」** と表示されていることを確認する  
   （表示されていない場合は `F12` キーを押してキャプチャを有効にする）

#### STEP 2 - Edge のプロキシ設定を確認する

Fiddler 起動時は自動的にシステムプロキシが設定されるため、通常は追加設定不要。  
Edge を起動してページを開き、Fiddler の左ペインにリクエストが流れてくることを確認する。

#### STEP 3 - AutoResponder を開く

1. Fiddler の右ペインのタブ一覧から **「AutoResponder」** タブをクリックする
2. **「Enable rules」** チェックボックスにチェックを入れる
3. **「Unmatched requests passthrough」** にチェックを入れる（対象外のリクエストは通常通り流す）

#### STEP 4 - ルールを追加する

**方法A：左ペインのリクエストからドラッグ**

1. Edge でテスト対象のページを開き、APIリクエストを発生させる
2. Fiddler 左ペインに表示されたリクエストを右クリックする
3. **「Copy」** → **「Just Url」** でURLをコピーしておく
4. そのリクエストを **AutoResponder タブにドラッグ＆ドロップ** する
5. ルールが追加されることを確認する

**方法B：手動で追加**

1. AutoResponder タブの **「Add Rule」** ボタンをクリックする
2. 上段のテキストボックス（マッチ条件）に対象URLの一部を入力する  
   例：`REGEX:.*api/users.*`（正規表現でURLにマッチ）  
   例：`*api/users*`（ワイルドカードでURLにマッチ）

#### STEP 5 - レスポンスを設定する

1. 追加されたルールをクリックして選択する
2. 下段のドロップダウンリストをクリックする
3. **「\*Return manually crafted response」** を選択する
4. テキストエリアに以下の形式で入力する：

```
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{"message": "forced error"}
```

> **ステータスコードの変更例：**
>
> - `400 Bad Request`
> - `401 Unauthorized`
> - `403 Forbidden`
> - `404 Not Found`
> - `503 Service Unavailable`

5. **「Save」** ボタンをクリックする

#### STEP 6 - 動作確認する

1. Edge でページを操作してAPIリクエストを発生させる
2. Fiddler 左ペインに `→` アイコン付きで表示されるリクエストを確認する
3. そのリクエストをクリックし、右ペインの **「Inspector」** タブで `Status: 500` を確認する
4. Edge の画面でエラーハンドリングが正しく動作しているか確認する

#### STEP 7 - テスト終了後の後処理

1. AutoResponder の **「Enable rules」** チェックを外す、またはルールを削除する
2. Fiddler を終了する（プロキシ設定は自動的に元に戻る）

### トラブルシューティング

| 症状                                            | 原因                                            | 対処                                                           |
| ----------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| Fiddler にリクエストが流れてこない              | プロキシ設定がされていない                      | Fiddlerを再起動する / Windowsのプロキシ設定を確認する          |
| HTTPSのサイトで `HTTPS decryption` エラー       | 証明書がインストールされていない                | 事前準備のHTTPS証明書インストール手順を再実施する              |
| ルールが適用されない                            | マッチ条件のURLが実際のURLと一致していない      | Fiddler左ペインの実際のリクエストURLを確認してルールを修正する |
| Edge が「プロキシに接続できません」と表示される | Fiddlerが落ちているのにプロキシ設定が残っている | Windowsの「プロキシ設定」を開いて手動プロキシをオフにする      |

---

## 方法③ Local Overrides を使う（DevTools内で完結）

### 概要

Edge DevTools の「Local Overrides」機能を使い、ローカルフォルダにレスポンスファイルを保存してサーバーのレスポンスを差し替える。  
外部ツール不要で、DevToolsだけで完結する。

### 事前準備

1. Windowsの任意の場所に作業用フォルダを作成する  
   例：`C:\dev\edge-overrides`

### 手順

#### STEP 1 - DevTools の Sources タブを開く

1. `F12` で DevTools を開く
2. 上部タブから **「Sources」** をクリックする

#### STEP 2 - Overrides を設定する

1. Sources タブ左側のサブタブから **「Overrides」** をクリックする  
   （表示されていない場合は `>>` をクリックして展開する）
2. **「Select folder for overrides」** をクリックする
3. 事前準備で作成したフォルダを選択する（例：`C:\dev\edge-overrides`）
4. 画面上部にフォルダへのアクセス許可を求めるバナーが表示されたら **「許可」** をクリックする
5. **「Enable Local Overrides」** チェックボックスにチェックが入っていることを確認する

#### STEP 3 - 対象リクエストをオーバーライド用に保存する

1. **「Network」** タブをクリックする
2. ページを操作してAPIリクエストを発生させる
3. リクエスト一覧から対象のAPIリクエストを右クリックする
4. **「Save for overrides」** をクリックする

#### STEP 4 - 保存されたファイルを編集する

1. **「Sources」** タブに戻る
2. 左ペインの **「Overrides」** セクションに保存されたファイルが表示されていることを確認する
3. ファイルをクリックして開く

ファイルは JSON や HTML などのレスポンスボディが保存されている。  
ステータスコードを変更するには、`.headers` ファイルを使用する。

#### STEP 5 - .headers ファイルを作成する

対象ファイルと同じ階層に `.headers` という名前のファイルを作成し、以下の内容を記述する。

> **Edge の Local Overrides でのステータスコード変更は `.headers` ファイルを使う。**

```json
[
  {
    "name": ":status",
    "value": "500"
  }
]
```

> **注意：** `:status` は HTTP/2 の擬似ヘッダーであり、通常のヘッダーとは異なる記法。  
> 変更したいコードに合わせて `"value"` の値を書き換える。

#### STEP 6 - 動作確認する

1. `Ctrl + R` でページをリロードする（オーバーライドは保持される）
2. Network タブで対象リクエストのステータスコードが変わっていることを確認する  
   ※ オーバーライドされたリクエストは Network タブで **紫色のドット** が付いて表示される

#### STEP 7 - オーバーライドを無効化する

1. Sources タブ → Overrides で **「Enable Local Overrides」** のチェックを外す
2. 完全に削除する場合は、対象ファイルを右クリック → **「Delete」** で削除する

### トラブルシューティング

| 症状                                 | 原因                                    | 対処                                                           |
| ------------------------------------ | --------------------------------------- | -------------------------------------------------------------- |
| 「Save for overrides」が表示されない | Local Overrides が有効になっていない    | STEP 2 のフォルダ設定を再確認する                              |
| ステータスコードが変わらない         | `.headers` ファイルのパスが間違っている | レスポンスファイルと同じフォルダに `.headers` があるか確認する |
| 紫のドットが付かない                 | オーバーライドが適用されていない        | 「Enable Local Overrides」チェックが有効か確認する             |

---

## 各方法の比較まとめ

| 項目               | 方法① xhook             | 方法② Fiddler | 方法③ Local Overrides |
| ------------------ | ----------------------- | ------------- | --------------------- |
| 難易度             | ★☆☆                     | ★★☆           | ★★★                   |
| 準備時間           | 2分                     | 10〜15分      | 5分                   |
| リロード後も有効   | ❌（リセットされる）    | ✅            | ✅                    |
| XMLHttpRequest対応 | ✅                      | ✅            | ✅                    |
| 外部ツール不要     | ✅（CDNアクセスが必要） | ❌            | ✅                    |
| ルール保存         | ❌                      | ✅            | ✅                    |
| 動作確認済み       | ✅                      | ✅            | △                     |

---

## 推奨学習順序

```
① xhook で XHR をプロキシ化（動作確認済み）
  └ 最も手軽に試せる。仕組みも理解できる
      ↓
② Fiddler AutoResponder
  └ 外部CDNが使えない環境や繰り返しのテストに
      ↓
③ Local Overrides
  └ 外部ツール不要でDevToolsだけで完結する応用技として習得
```

---

_作成日：2026年3月_
