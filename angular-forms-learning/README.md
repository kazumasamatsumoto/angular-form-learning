# Angular Forms 学習ツール

Angular Formsの学習を目的とした実践的なサンプルアプリケーションです。FormControl、FormGroup、FormBuilder、バリデーション、複数コンポーネント間でのフォーム値の共有など、Angular Formsの主要な機能を網羅的に学習できます。

## 📚 学習内容

このアプリケーションでは以下の内容を学習できます：

1. **FormControl の基本**
   - 単一のフォームコントロールの管理
   - 値の取得・設定・リセット

2. **FormGroup の基本**
   - 複数のFormControlをグループ化
   - ネストされたFormGroup
   - setValue と patchValue の使い分け

3. **FormBuilder**
   - より簡潔な構文でのフォーム作成
   - FormArrayを使った動的フォーム

4. **バリデーション（Validators）**
   - 組み込みバリデータ（required, email, minLength, maxLength, pattern, min, max）
   - カスタムバリデータの作成
   - フォームグループレベルのバリデータ

5. **複数コンポーネントでのフォーム値共有**
   - サービスを使った状態管理
   - BehaviorSubjectとObservableの活用
   - InputとSliderの連動

6. **パターン選択UI（ラジオボタン + スライダー）**
   - ラジオボタンによる複数パターンの切り替え
   - 各パターンに紐づく4つのパラメータ管理
   - スライダーと入力フィールドの双方向同期
   - 視覚的なプログレスバー表示

## 🚀 セットアップ

### 前提条件

- Node.js 18.x 以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start
```

ブラウザで `http://localhost:4200/` を開くと、アプリケーションが表示されます。

## 🛠️ 使用技術

- **Angular**: 21.x（最新版）
- **Angular Material**: 21.x
- **RxJS**: Observable、BehaviorSubject
- **TypeScript**: 5.x

## 📂 プロジェクト構成

```
src/app/
├── examples/
│   ├── form-control-example/    # FormControlの基本
│   ├── form-group-example/      # FormGroupの基本
│   ├── form-builder-example/    # FormBuilder
│   ├── validation-example/      # バリデーション
│   ├── shared-form-example/     # フォーム値共有
│   └── pattern-selector-example/ # パターン選択UI
├── services/
│   └── shared-form.ts          # フォーム値共有サービス
├── app.ts                      # メインアプリケーション
├── app.routes.ts              # ルーティング設定
└── app.html                   # アプリケーションテンプレート
```

## 🎓 使い方

1. 左側のナビゲーションメニューから学習したいトピックを選択
2. 各ページでインタラクティブなフォームを操作
3. コード例を確認して、実装方法を学習
4. 実際の動作を確認しながら理解を深める

## 🔧 ビルド

```bash
# 本番用ビルド
npm run build

# ビルド成果物は dist/ ディレクトリに出力されます
```

## 📝 主な機能

### FormControl
- 基本的な入力フィールドの管理
- リアルタイムでの値の表示
- リセット機能

### FormGroup
- 複数のフィールドをグループ化
- ネストされた構造の管理
- JSON形式での値の表示

### FormBuilder
- 簡潔な構文でのフォーム作成
- FormArrayによる動的なフィールド追加・削除
- バリデーション付きフォーム

### バリデーション
- 組み込みバリデータの全パターン
- カスタムバリデータの実装例
- エラーメッセージの表示

### フォーム値共有
- InputとSliderの連動
- サービスを使った状態管理
- 複数コンポーネント間でのデータ共有
- パーセンテージバーによる視覚的なフィードバック

### パターン選択UI
- ラジオボタンによるパターン切り替え
- 4つのパラメータ（A, B, C, D）の独立管理
- スライダーと入力フィールドの双方向同期
- プログレスバーによる視覚的な値の表示
- パターン初期値へのリセット機能

## 💡 学習のポイント

1. **Reactive Forms**：このアプリケーションはReactive Formsアプローチを採用しています
2. **型安全性**：TypeScriptの型システムを活用した安全なフォーム管理
3. **Material Design**：Angular Materialを使用した美しいUI
4. **実践的な例**：実際のアプリケーション開発で使用する機能を網羅

## 📖 参考リソース

- [Angular Forms 公式ドキュメント](https://angular.dev/guide/forms)
- [Angular Material](https://material.angular.io/)
- [RxJS](https://rxjs.dev/)

## 📄 ライセンス

MIT License

---

このプロジェクトは Angular Forms の学習を目的として作成されました。
実際のプロジェクトで活用できる実践的なパターンを多数含んでいます。
