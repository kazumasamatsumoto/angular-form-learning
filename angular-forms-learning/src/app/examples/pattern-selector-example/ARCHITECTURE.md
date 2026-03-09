# Pattern Selector Example - コンポーネント設計とデータ設計

## 1. アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────┐
│ PatternSelectorExample (親コンポーネント)                   │
│ ・FormGroupの配列を管理                                    │
│ ・選択中のパターンインデックスを管理                         │
│ ・パターン選択のハンドラーを提供                            │
└────────────┬────────────────────────────────────────────┘
             │
             │ @for (pattern of patterns)
             ▼
    ┌────────────────────────────────┐
    │ PatternCardComponent (中間)     │
    │ ・1つのパターンを表示           │
    │ ・ラジオボタンの制御            │
    │ ・FormGroupを子に伝播           │
    └────────┬───────────────────────┘
             │
             │ @for (4つのパラメータ)
             ▼
    ┌────────────────────────────────┐
    │ ParameterSliderComponent (葉)   │
    │ ・1つのパラメータを表示         │
    │ ・スライダーと入力の同期        │
    │ ・FormControlを直接操作         │
    └────────────────────────────────┘
```

## 2. データフロー図

```
[PatternSelectorExample]
    │
    ├─ patterns: PatternData[]  ────────── 静的データ(初期値)
    │    └─ { name, initialValues }
    │
    ├─ patternForms: FormGroup[]  ─────── リアクティブフォーム
    │    └─ FormGroup { a, b, c, d }     (各パターンごとに独立)
    │
    └─ selectedPatternIndex: number ───── 選択状態の管理

        ↓ @Input による Props 渡し

[PatternCardComponent]
    │
    ├─ @Input patternForm: FormGroup ──── 親から受け取った FormGroup
    ├─ @Input patternName: string
    ├─ @Input patternIndex: number
    ├─ @Input selectedPatternIndex: number
    └─ @Input onPatternSelect: Function ── コールバック関数

        ↓ getControl('a') で FormControl を抽出

[ParameterSliderComponent]
    │
    └─ @Input control: FormControl<number> ── 直接 FormControl を受け取る
```

## 3. コンポーネントの責務

### 3.1 PatternSelectorExample (親コンポーネント)
**ファイル**: `pattern-selector-example.ts:28-74`

**責務**:
- 3つのパターンデータの定義と管理
- 各パターンに対応する FormGroup の配列を生成・保持
- 選択中のパターンのインデックス管理
- パターン選択のイベントハンドラー提供

**データ管理**:
```typescript
patterns: PatternData[] = [
  { name: 'パターンA', initialValues: { a: 30, b: 50, c: 60, d: 100 } },
  { name: 'パターンB', initialValues: { a: 25, b: 30, c: 55, d: 87 } },
  { name: 'パターンC', initialValues: { a: 10, b: 40, c: 70, d: 90 } }
];

patternForms: FormGroup[] = [
  FormGroup { a: 30, b: 50, c: 60, d: 100 },  // パターンA用
  FormGroup { a: 25, b: 30, c: 55, d: 87 },   // パターンB用
  FormGroup { a: 10, b: 40, c: 70, d: 90 }    // パターンC用
];

selectedPatternIndex: number = 0;  // デフォルトはパターンA
```

**初期化処理** (`ngOnInit`):
```typescript
this.patternForms = this.patterns.map(pattern =>
  this.fb.group({
    a: [pattern.initialValues.a],
    b: [pattern.initialValues.b],
    c: [pattern.initialValues.c],
    d: [pattern.initialValues.d],
  })
);
```

### 3.2 PatternCardComponent (中間コンポーネント)
**ファイル**: `pattern-card.component.ts:7-38`

**責務**:
- 1つのパターンのUI表示
- ラジオボタンの表示と選択状態の管理
- FormGroup から各パラメータの FormControl を抽出して子に渡す
- パターン選択時のイベント伝播

**受け取るデータ**:
```typescript
@Input patternForm: FormGroup        // 親から受け取った FormGroup
@Input patternName: string           // "パターンA" など
@Input patternIndex: number          // 0, 1, 2
@Input selectedPatternIndex: number  // 現在選択中のインデックス
@Input onPatternSelect: Function     // 選択変更のコールバック
```

**データ変換処理**:
```typescript
getControl(fieldName: string): FormControl<number> {
  return this.patternForm.get(fieldName) as FormControl<number>;
}
// FormGroup から 'a', 'b', 'c', 'd' の FormControl を個別に取り出す
```

**選択状態の判定**:
```typescript
get isSelected(): boolean {
  return this.selectedPatternIndex === this.patternIndex;
}
```

### 3.3 ParameterSliderComponent (葉コンポーネント)
**ファイル**: `parameter-slider.component.ts:5-22`

**責務**:
- 1つのパラメータ(A, B, C, D)のUI表示
- スライダーと数値入力フィールドの同期
- FormControl の値の更新

**受け取るデータ**:
```typescript
@Input control: FormControl<number>  // 直接 FormControl を受け取る
@Input label: string                 // "× Stop Rate" など
@Input min: number = 0
@Input max: number = 100
@Input step: number = 1
```

**双方向バインディング**:
```html
<!-- スライダー -->
<input matSliderThumb
       [value]="control.value"
       (valueChange)="updateValue($event)" />

<!-- 数値入力 -->
<input type="number" [formControl]="control" />
```

**値の更新処理**:
```typescript
updateValue(value: number): void {
  this.control.setValue(value);
}
```

## 4. FormGroup と FormControl の参照共有

### 4.1 参照共有の仕組み
```
PatternSelectorExample
  │
  └─ patternForms[0]: FormGroup ──┐
                                   │ (参照を共有)
                                   │
PatternCardComponent               │
  │                                │
  └─ patternForm ←─────────────────┘
       │
       └─ getControl('a')
            │
            └─ FormControl<number> ──┐
                                      │ (参照を共有)
                                      │
ParameterSliderComponent              │
  │                                   │
  └─ control ←────────────────────────┘
```

### 4.2 重要なポイント

1. **FormGroup は配列で管理**: `patternForms[0]`, `patternForms[1]`, `patternForms[2]` として独立
2. **参照渡し**: FormGroup や FormControl はオブジェクト参照で渡されるため、子コンポーネントでの変更が親にも反映される
3. **リアクティブフォームの特性**: `control.setValue()` や `[formControl]` による変更は、同じ参照を持つすべての場所で即座に反映される

### 4.3 データの流れの具体例

```
ユーザーがスライダーを操作
  ↓
ParameterSliderComponent.updateValue(50)
  ↓
FormControl.setValue(50)
  ↓
FormGroup { a: 50, b: 30, c: 55, d: 87 }  // 自動更新
  ↓
PatternSelectorExample.patternForms[1]  // 参照共有により即座に反映
  ↓
getPatternValues(1) で最新の値を取得可能
```

## 5. データ構造の設計思想

### 5.1 要件に対応したデータ設計

```typescript
// データベース登録想定のデータ構造
{
  patternA: {
    有効化: true,   // selectedPatternIndex === 0
    paramsA: 30,
    paramsB: 50,
    paramsC: 60,
    paramsD: 100
  },
  patternB: {
    有効化: false,  // selectedPatternIndex !== 1
    paramsA: 25,
    paramsB: 30,
    paramsC: 55,
    paramsD: 87
  },
  patternC: {
    有効化: false,  // selectedPatternIndex !== 2
    paramsA: 10,
    paramsB: 40,
    paramsC: 70,
    paramsD: 90
  }
}
```

### 5.2 UI とデータの分離

- **ラジオボタン**: 選択状態のみを管理 (`selectedPatternIndex`)
- **パラメータ**: 選択状態に関係なく常に編集可能 (`patternForms[]`)
- **視覚的な関連性**: レイアウトで「ラジオボタン → カード」の横並びを実現

### 5.3 重要な設計判断

**なぜラジオボタンとパラメータを分離したのか？**

1. **要件**: 選択されていないパターンのパラメータも編集可能にする必要があった
2. **解決策**: ラジオボタンは「どのパターンを使用するか」の選択のみを管理し、各パターンのパラメータは常に独立して編集可能にした
3. **利点**:
   - 全パターンの値を一括登録できる
   - ユーザーは複数パターンを比較しながら調整できる
   - UI上は関連して見えるが、データ構造は独立している

## 6. コンポーネント間の通信パターン

### 6.1 親 → 子 (データの流れ)
```
PatternSelectorExample
  │ @Input
  ├─→ patternForms[$index]  ────→ PatternCardComponent
  │ @Input
  ├─→ selectedPatternIndex  ────→ PatternCardComponent
  │ @Input
  └─→ onPatternSelect       ────→ PatternCardComponent

PatternCardComponent
  │ @Input
  └─→ getControl('a')       ────→ ParameterSliderComponent
```

### 6.2 子 → 親 (イベントの流れ)
```
ParameterSliderComponent
  │ updateValue() または [formControl]
  └─→ FormControl.setValue()
       │
       └─→ FormGroup (自動更新)
            │
            └─→ PatternSelectorExample.patternForms[] (リアクティブに反映)

PatternCardComponent (ラジオボタンクリック)
  │ (ngModelChange)
  └─→ onPatternSelect(index)
       │
       └─→ PatternSelectorExample.selectedPatternIndex 更新
```

### 6.3 具体的なコード例

**親から子へのデータ渡し**:
```html
<!-- pattern-selector-example.html -->
<app-pattern-card
  [patternForm]="patternForms[$index]"
  [patternName]="pattern.name"
  [patternIndex]="$index"
  [selectedPatternIndex]="selectedPatternIndex"
  [onPatternSelect]="onPatternSelect"
/>
```

**子から孫へのデータ渡し**:
```html
<!-- pattern-card.component.html -->
<app-parameter-slider
  [control]="getControl('a')"
  label="× Stop Rate"
/>
```

**子から親へのイベント伝播**:
```html
<!-- pattern-card.component.html -->
<mat-radio-group
  [ngModel]="selectedPatternIndex"
  (ngModelChange)="onPatternSelect($event)">
  <mat-radio-button [value]="patternIndex">
    {{ patternName }}
  </mat-radio-button>
</mat-radio-group>
```

## 7. レイアウト設計

### 7.1 視覚的な構造

```
┌────────────────────────────────────────────────────────────┐
│ パターン選択とパラメータ調整                                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ ○ パターンA  │ × Stop Rate │ △ Stop Rate │ ...      │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ ◯ パターンB  │ × Stop Rate │ △ Stop Rate │ ...      │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ ◯ パターンC  │ × Stop Rate │ △ Stop Rate │ ...      │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 7.2 レイアウトの実装方法

**パターンカード内のグリッド**:
```scss
.pattern-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.parameters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  flex: 1;
}
```

**ポイント**:
- ラジオボタンとパラメータグリッドを `display: flex` で横並びに配置
- パラメータグリッドは4カラムの `display: grid` で均等配置
- 視覚的にラジオボタンとパラメータが関連して見える

## 8. 設計の利点と学習ポイント

### 8.1 設計の利点

1. **単一責任の原則**: 各コンポーネントが明確な責務を持つ
2. **再利用性**: ParameterSliderComponent は他の用途でも使用可能
3. **テスタビリティ**: FormControl を @Input で受け取るため、テストが容易
4. **スケーラビリティ**: パターン数やパラメータ数の変更に柔軟に対応
5. **状態管理の明確さ**: 選択状態とパラメータ値が独立して管理される

### 8.2 Angular Reactive Forms の学習ポイント

1. **FormGroup の配列管理**: 複数の独立したフォームを配列で管理する方法
2. **FormControl の参照共有**: `formGroup.get('fieldName')` で取得した FormControl を子コンポーネントに渡す
3. **双方向バインディング**: スライダーと入力フィールドを同じ FormControl にバインド
4. **コンポーネント間のフォーム共有**: FormGroup や FormControl を @Input で渡すことで、複数コンポーネント間でフォームを共有

### 8.3 このパターンが役立つケース

- 複数の設定プリセットを管理する画面
- 比較表形式でデータを編集する画面
- マスター・詳細パターンでの詳細編集
- 複数バリエーションの一括編集機能

## 9. データ取得とDB登録の実装例

### 9.1 全パターンのデータ取得

```typescript
// PatternSelectorExample
getAllPatternsData() {
  return this.patterns.map((pattern, index) => ({
    name: pattern.name,
    isSelected: index === this.selectedPatternIndex,
    values: this.patternForms[index].value
  }));
}

// 出力例:
// [
//   { name: 'パターンA', isSelected: true, values: { a: 30, b: 50, c: 60, d: 100 } },
//   { name: 'パターンB', isSelected: false, values: { a: 25, b: 30, c: 55, d: 87 } },
//   { name: 'パターンC', isSelected: false, values: { a: 10, b: 40, c: 70, d: 90 } }
// ]
```

### 9.2 選択中のパターンのみ取得

```typescript
getSelectedPatternData() {
  return {
    name: this.patterns[this.selectedPatternIndex].name,
    values: this.patternForms[this.selectedPatternIndex].value
  };
}

// 出力例:
// { name: 'パターンA', values: { a: 30, b: 50, c: 60, d: 100 } }
```

## 10. まとめ

このコンポーネント設計は、以下の要件を満たすために構築されました:

1. **3つのパターンを常に表示**: 全パターンが画面に表示され、比較しながら編集可能
2. **独立したパラメータ管理**: 各パターンのパラメータは独立して編集可能
3. **ラジオボタンによる選択**: どのパターンを使用するかをラジオボタンで選択
4. **視覚的な関連性**: ラジオボタンとパラメータを横並びに配置して関連性を示す
5. **一括登録対応**: 全パターンの値を一度に取得してデータベースに登録可能

Angular Reactive Forms の参照共有の仕組みを活用することで、親コンポーネントから子コンポーネントへ FormGroup や FormControl を渡し、子での変更を親で即座に反映させることができます。この設計パターンは、複雑なフォームを複数のコンポーネントに分割する際の標準的なアプローチとして応用可能です。
