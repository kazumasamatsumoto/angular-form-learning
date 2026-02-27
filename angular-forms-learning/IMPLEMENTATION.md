# パターン選択とパラメータ調整機能の実装ドキュメント

## 概要

このドキュメントは、`pattern-selector-example`コンポーネントの実装方法を説明します。
3つのパターン（A, B, C）をラジオボタンで選択し、それぞれ4つのパラメータ（A, B, C, D）をスライダーと入力フォームで調整できる機能を実装しています。

## 要件

1. **3つのパターンを常に表示**: 全パターンのパラメータが同時に表示され、編集可能
2. **ラジオボタンによる選択**: 1つのパターンのみを「有効化」として選択可能
3. **カード内の視覚的配置**: ラジオボタンとパラメータが各カード内で横並びに表示
4. **imo-radioコンポーネントの使用**: 既存のカスタムラジオコンポーネントを使用（修正不可）
5. **独立したパラメータ編集**: ラジオボタンの選択に関係なく、全パラメータが編集可能

## データ構造

### パターンデータ

```typescript
interface PatternData {
  name: string;           // パターン名（例: "パターンA"）
  initialValues: {        // 初期値
    a: number;            // パラメータA（0-100）
    b: number;            // パラメータB（0-100）
    c: number;            // パラメータC（0-100）
    d: number;            // パラメータD（0-100）
  };
}
```

### 実際のデータ

```typescript
patterns: PatternData[] = [
  {
    name: 'パターンA',
    initialValues: { a: 30, b: 50, c: 60, d: 100 },
  },
  {
    name: 'パターンB',
    initialValues: { a: 25, b: 30, c: 55, d: 87 },
  },
  {
    name: 'パターンC',
    initialValues: { a: 10, b: 40, c: 70, d: 90 },
  },
];
```

### フォーム管理

各パターンごとに独立した`FormGroup`を作成:

```typescript
patternForms: FormGroup[] = [];

ngOnInit(): void {
  this.patternForms = this.patterns.map(pattern =>
    this.fb.group({
      a: [pattern.initialValues.a],
      b: [pattern.initialValues.b],
      c: [pattern.initialValues.c],
      d: [pattern.initialValues.d],
    })
  );
}
```

## 実装の工夫：imo-radioコンポーネントの制約を克服

### 課題

`imo-radio`コンポーネントは全てのラジオボタンを1つのグループとして縦並びに表示します。
しかし、要件では各パターンカード内にラジオボタンを配置する必要がありました。

### 解決策：ハイブリッドアプローチ

1. **imo-radioを非表示で使用**: データ管理のみに使用
2. **カスタムラジオUIを作成**: 見た目用のラジオボタンを各カード内に配置
3. **双方向の同期**: クリックイベントで選択状態を同期

### HTML構造

```html
<!-- imo-radioを非表示で配置（データ管理用） -->
<imo-radio
  [radios]="radioButtons"
  [defaultValue]="selectedPatternIndex.toString()"
  (changed)="onRadioChange($event)"
  class="hidden-radio-group"
></imo-radio>

<!-- 各パターンカード -->
@for (pattern of patterns; track $index) {
  <div class="pattern-card">
    <div class="pattern-content">
      <!-- カスタムラジオUI（見た目用） -->
      <div class="radio-display">
        <div class="radio-item" (click)="selectPattern($index)">
          <span class="radio-circle" [class.selected]="selectedPatternIndex === $index"></span>
          <span class="radio-label">{{ pattern.name }}</span>
        </div>
      </div>

      <!-- パラメータフォーム -->
      <form [formGroup]="patternForms[$index]">
        <!-- スライダーと入力フォーム -->
      </form>
    </div>
  </div>
}
```

### TypeScript実装

```typescript
// 選択されたパターンのインデックス
selectedPatternIndex: number = 0;

// ラジオボタン用のデータ
radioButtons: RadioButton[] = [];

ngOnInit(): void {
  // ラジオボタンデータを生成
  this.radioButtons = this.patterns.map((pattern, index) => ({
    name: pattern.name,
    value: index.toString(),
  }));
}

// カスタムラジオUIからの選択
selectPattern(index: number): void {
  this.selectedPatternIndex = index;
}

// imo-radioからの変更イベント
onRadioChange(value: string): void {
  this.selectedPatternIndex = parseInt(value, 10);
}
```

### CSS実装

```scss
// imo-radioを非表示にする
::ng-deep .hidden-radio-group {
  display: none;
}

// カスタムラジオボタンのスタイル
.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  .radio-circle {
    width: 18px;
    height: 18px;
    border: 2px solid #5f6368;
    border-radius: 50%;
    position: relative;

    &.selected::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      background-color: #1976d2;
      border-radius: 50%;
    }
  }
}
```

## レイアウト構造

### カード内のレイアウト

```
┌─────────────────────────────────────────────────────────┐
│ パターンカード                                            │
│ ┌───────────────────────────────────────────────────┐   │
│ │ pattern-content (横並びflex)                       │   │
│ │ ┌──────────┐ ┌────────────────────────────────┐ │   │
│ │ │ ラジオ    │ │ パラメータグリッド              │ │   │
│ │ │ ボタン    │ │ ┌─────┬─────┬─────┬─────┐  │ │   │
│ │ │ ○ A      │ │ │  A  │  B  │  C  │  D  │  │ │   │
│ │ │          │ │ │ ━━━ │ ━━━ │ ━━━ │ ━━━ │  │ │   │
│ │ │          │ │ │ [50]│ [60]│ [70]│ [80]│  │ │   │
│ │ │          │ │ └─────┴─────┴─────┴─────┘  │ │   │
│ │ └──────────┘ └────────────────────────────────┘ │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### CSS Grid構造

```scss
// パターンコンテンツ（横並び）
.pattern-content {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

// ラジオボタン部分
.radio-display {
  min-width: 120px;
  padding-top: 8px;
}

// パラメータグリッド（4カラム）
.parameters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  flex: 1;
}
```

## パラメータコントロール

### スライダーと入力フォームの連動

各パラメータには以下の3つのコンポーネントがあります：

1. **スライダー** (`mat-slider`): ビジュアル調整用
2. **数値入力** (`input type="number"`): 直接入力用
3. **プログレスバー**: 視覚的フィードバック

```html
<div class="parameter-control">
  <div class="parameter-header">
    <h4>A</h4>
  </div>

  <!-- スライダーと入力フォーム -->
  <div class="slider-input-row">
    <mat-slider min="0" max="100" step="1" discrete class="slider">
      <input
        matSliderThumb
        [value]="patternForms[$index].get('a')?.value || 0"
        (valueChange)="onSliderChange($index, 'a', $event)"
      >
    </mat-slider>
    <input
      type="number"
      class="number-input"
      [value]="patternForms[$index].get('a')?.value"
      (input)="onInputChange($index, 'a', $event)"
      min="0"
      max="100"
    >
  </div>

  <!-- プログレスバー -->
  <div class="progress-bar">
    <div class="progress-fill progress-a" [style.width.%]="patternForms[$index].get('a')?.value"></div>
  </div>
</div>
```

### イベントハンドラー

```typescript
// スライダーの値が変更されたとき
onSliderChange(patternIndex: number, paramName: string, value: number): void {
  this.patternForms[patternIndex].get(paramName)?.setValue(value, { emitEvent: false });
}

// 入力フィールドの値が変更されたとき
onInputChange(patternIndex: number, paramName: string, event: any): void {
  const value = Number(event.target.value);
  if (!isNaN(value) && value >= 0 && value <= 100) {
    this.patternForms[patternIndex].get(paramName)?.setValue(value, { emitEvent: false });
  }
}
```

## プログレスバーの色分け

各パラメータごとに異なる色のグラデーションを設定:

```scss
.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 8px;

  &.progress-a {
    background: linear-gradient(90deg, #2196f3, #64b5f6); // 青
  }
  &.progress-b {
    background: linear-gradient(90deg, #4caf50, #81c784); // 緑
  }
  &.progress-c {
    background: linear-gradient(90deg, #ff9800, #ffb74d); // オレンジ
  }
  &.progress-d {
    background: linear-gradient(90deg, #f44336, #e57373); // 赤
  }
}
```

## レスポンシブ対応

モバイルデバイスでは縦並びに変更:

```scss
@media (max-width: 1200px) {
  .parameters-grid {
    grid-template-columns: repeat(2, 1fr); // 2カラムに変更
  }
}

@media (max-width: 768px) {
  .pattern-content {
    flex-direction: column; // 縦並びに変更
  }

  .parameters-grid {
    grid-template-columns: 1fr; // 1カラムに変更
  }
}
```

## データ取得メソッド

### 特定パターンの値を取得

```typescript
getPatternValues(patternIndex: number) {
  return this.patternForms[patternIndex].value;
}
```

### 全パターンの値を取得

```typescript
getAllPatternValues() {
  return this.patterns.map((pattern, index) => ({
    pattern: pattern.name,
    values: this.getPatternValues(index)
  }));
}
```

### 選択されたパターンの値を取得

```typescript
getSelectedPatternValues() {
  return {
    selectedPattern: this.patterns[this.selectedPatternIndex].name,
    values: this.getPatternValues(this.selectedPatternIndex)
  };
}
```

## 使用している主要なAngular機能

### 1. Reactive Forms

- `FormBuilder`: フォームグループの生成
- `FormGroup`: 各パターンのフォーム管理
- `formGroup` ディレクティブ: テンプレートとの連携

### 2. Angular Material コンポーネント

- `MatSlider`: スライダーコンポーネント
- `MatCard`: カードレイアウト
- `MatRadio`: ラジオボタン（imo-radioで使用）

### 3. Angular制御フロー

- `@for`: パターンのループ表示（Angular 17+の新構文）

### 4. データバインディング

- プロパティバインディング: `[value]`, `[formGroup]`
- イベントバインディング: `(valueChange)`, `(input)`, `(click)`
- クラスバインディング: `[class.selected]`
- スタイルバインディング: `[style.width.%]`

## まとめ

この実装の核心は、**imo-radioコンポーネントの制約を、カスタムUIとの組み合わせで克服**したことです。

### キーポイント

1. **非表示のimo-radio**: データ管理とフォーム連携を担当
2. **カスタムラジオUI**: 各カード内に配置し、視覚的要件を満たす
3. **独立したFormGroup**: 各パターンのパラメータを個別管理
4. **Flexbox + Grid**: 柔軟なレイアウト構造
5. **双方向同期**: カスタムUIとimo-radioの選択状態を同期

この手法により、既存コンポーネントを変更せずに、要件を満たすUIを実装できました。
