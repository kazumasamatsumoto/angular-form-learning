# FormGroupとFormControlの受け渡しパターン

## 前提知識

### FormGroupとFormControlの関係

```typescript
// FormBuilderで作成
const formGroup = this.fb.group({
  a: [30],   // FormControl<number>
  b: [50],   // FormControl<number>
  c: [60],   // FormControl<number>
  d: [100]   // FormControl<number>
});

// FormGroupの構造
FormGroup {
  controls: {
    a: FormControl<number>,  // .get('a') で取得可能
    b: FormControl<number>,  // .get('b') で取得可能
    c: FormControl<number>,
    d: FormControl<number>
  }
}
```

---

## パターン1: 直接FormControlを渡す（シンプル）

親コンポーネントで直接FormControlを抽出して子に渡す方法。

### コード例

```typescript
// 親コンポーネント
export class ParentComponent {
  myForm = this.fb.group({
    a: [30],
    b: [50]
  });
}
```

```html
<!-- 親コンポーネントのテンプレート -->
<app-parameter-slider
  [control]="myForm.get('a')"
  label="パラメータA"
/>

<app-parameter-slider
  [control]="myForm.get('b')"
  label="パラメータB"
/>
```

```typescript
// 子コンポーネント (ParameterSlider)
export class ParameterSliderComponent {
  @Input() control!: FormControl<number>;
}
```

### メリット
- シンプルで分かりやすい
- 親が全てのFormControlを管理

### デメリット
- パラメータが多いと親のテンプレートが冗長になる
- a, b, c, d の4つなら良いが、10個、20個になると辛い

---

## パターン2: FormGroupを渡して中間で抽出（今回採用）

中間コンポーネントでFormGroupを受け取り、そこでFormControlを抽出する方法。

### コード例

```typescript
// 親コンポーネント
export class ParentComponent {
  myForm = this.fb.group({
    a: [30],
    b: [50],
    c: [60],
    d: [100]
  });
}
```

```html
<!-- 親コンポーネントのテンプレート（シンプル！） -->
<app-pattern-card
  [patternForm]="myForm"
/>
```

```typescript
// 中間コンポーネント (PatternCard)
export class PatternCardComponent {
  @Input() patternForm!: FormGroup;

  // FormGroupからFormControlを抽出するヘルパーメソッド
  getControl(fieldName: string): FormControl<number> {
    return this.patternForm.get(fieldName) as FormControl<number>;
  }
}
```

```html
<!-- 中間コンポーネントのテンプレート -->
<app-parameter-slider
  [control]="getControl('a')"
  label="× Stop Rate"
/>

<app-parameter-slider
  [control]="getControl('b')"
  label="△ Stop Rate"
/>

<app-parameter-slider
  [control]="getControl('c')"
  label="× Acceptance Rate"
/>

<app-parameter-slider
  [control]="getControl('d')"
  label="△ Acceptance Rate"
/>
```

```typescript
// 葉のコンポーネント (ParameterSlider)
export class ParameterSliderComponent {
  @Input() control!: FormControl<number>;  // FormControlを受け取る
}
```

### メリット
- 親のテンプレートがシンプル
- PatternCardが4つのパラメータをまとめて管理
- PatternCardを再利用しやすい

### デメリット
- 中間コンポーネントが必要

---

## 実際のデータフロー図

```
親コンポーネント
├── patternForms[0]: FormGroup { a, b, c, d }
│   │
│   └─→ [patternForm]="patternForms[0]"
│        │
│        ▼
│   中間コンポーネント (PatternCard)
│   ├── @Input() patternForm: FormGroup
│   │
│   ├── getControl('a') → FormControl<number>
│   │   └─→ [control]="getControl('a')"
│   │        │
│   │        ▼
│   │   葉コンポーネント (ParameterSlider)
│   │   └── @Input() control: FormControl<number>
│   │
│   ├── getControl('b') → FormControl<number>
│   │   └─→ [control]="getControl('b')"
│   │        │
│   │        ▼
│   │   葉コンポーネント (ParameterSlider)
│   │   └── @Input() control: FormControl<number>
│   │
│   ├── getControl('c') → ...
│   └── getControl('d') → ...
```

---

## getControl() メソッドの役割

```typescript
getControl(fieldName: string): FormControl<number> {
  return this.patternForm.get(fieldName) as FormControl<number>;
}
```

### 何をしているか？

1. `this.patternForm` = 親から受け取ったFormGroup
2. `.get(fieldName)` = FormGroupから指定したフィールド名のFormControlを取り出す
3. `as FormControl<number>` = 型キャスト（TypeScriptの型安全性のため）

### 具体例

```typescript
// patternForm の中身
FormGroup {
  controls: {
    a: FormControl(30),
    b: FormControl(50),
    c: FormControl(60),
    d: FormControl(100)
  }
}

// getControl('a') を呼ぶと
getControl('a')  // → FormControl(30) が返る

// getControl('b') を呼ぶと
getControl('b')  // → FormControl(50) が返る
```

---

## 実際のテンプレートでの使用例

```html
<!-- PatternCardコンポーネントのテンプレート -->
<div class="parameters-grid">
  <!-- getControl('a') は FormControl<number> を返す -->
  <app-parameter-slider
    [control]="getControl('a')"
    label="× Stop Rate"
  />

  <!-- getControl('b') は FormControl<number> を返す -->
  <app-parameter-slider
    [control]="getControl('b')"
    label="△ Stop Rate"
  />

  <!-- ... 他のパラメータも同様 ... -->
</div>
```

### これは以下と同じ意味

```html
<!-- 親コンポーネントで直接書いた場合 -->
<div class="parameters-grid">
  <app-parameter-slider
    [control]="patternForm.get('a')"
    label="× Stop Rate"
  />

  <app-parameter-slider
    [control]="patternForm.get('b')"
    label="△ Stop Rate"
  />
</div>
```

---

## なぜこのパターンを採用したか？

### 理由1: 親のテンプレートがシンプルになる

```html
<!-- パターン1: 直接FormControlを渡す場合 -->
<div class="pattern-row">
  <div class="pattern-card">
    <app-parameter-slider [control]="patternForms[0].get('a')" label="..." />
    <app-parameter-slider [control]="patternForms[0].get('b')" label="..." />
    <app-parameter-slider [control]="patternForms[0].get('c')" label="..." />
    <app-parameter-slider [control]="patternForms[0].get('d')" label="..." />
  </div>
</div>

<div class="pattern-row">
  <div class="pattern-card">
    <app-parameter-slider [control]="patternForms[1].get('a')" label="..." />
    <app-parameter-slider [control]="patternForms[1].get('b')" label="..." />
    <app-parameter-slider [control]="patternForms[1].get('c')" label="..." />
    <app-parameter-slider [control]="patternForms[1].get('d')" label="..." />
  </div>
</div>

<!-- 繰り返しが多い！ -->
```

```html
<!-- パターン2: FormGroupを渡す場合（今回採用） -->
@for (pattern of patterns; track $index) {
  <div class="pattern-row">
    <app-pattern-card [patternForm]="patternForms[$index]" />
  </div>
}

<!-- シンプル！ -->
```

### 理由2: PatternCardが再利用可能

PatternCardコンポーネントは「4つのパラメータ(a,b,c,d)を持つFormGroup」を表示する責務を持つ。
このコンポーネントを他の場所でも再利用できる。

```html
<!-- 別の画面でも使える -->
<app-pattern-card [patternForm]="settingsForm" />
<app-pattern-card [patternForm]="userPreferencesForm" />
```

### 理由3: 責務の分離

- **親**: FormGroupの配列を管理（データ管理）
- **PatternCard**: 4つのパラメータのレイアウト（UI構造）
- **ParameterSlider**: 単一パラメータの入力（UI部品）

---

## まとめ

### FormGroupを渡す = FormControlをまとめて渡す

```typescript
// FormGroupは複数のFormControlの入れ物
FormGroup {
  a: FormControl,
  b: FormControl,
  c: FormControl,
  d: FormControl
}

// FormGroupを渡す
<app-pattern-card [patternForm]="myFormGroup" />

// 中間コンポーネントで必要な時にFormControlを取り出す
getControl('a')  // → FormControl を返す
```

### 葉のコンポーネントは必ずFormControlを受け取る

```typescript
// 葉のコンポーネント（ParameterSlider）
@Input() control!: FormControl<number>;

// 葉のコンポーネントのテンプレート
<input type="number" [formControl]="control" />
```

### データの流れ

1. **親**: FormGroupを作成・管理
2. **中間**: FormGroupを受け取り、FormControlを抽出
3. **葉**: FormControlを受け取り、UIにバインド

これが「FormGroupを受け渡して、FormControlを抽出する」という挙動です。
