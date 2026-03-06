# Pattern Selector Example - コンポーネント分割ガイド

## 概要

このドキュメントは、FormBuilderで構築したフォームをコンポーネント化する際の設計パターンを説明します。

## コンポーネント構成

### 1. 親コンポーネント (PatternSelectorExampleModule)

**役割**: フォームのデータ管理とビジネスロジック

**責務**:
- FormBuilderでFormGroupの配列を作成・管理
- パターンデータの定義と初期化
- 選択状態の管理
- データの取得や保存などのビジネスロジック

**実装例**:
```typescript
export class PatternSelectorExampleModule implements OnInit {
  private fb = inject(FormBuilder);

  // パターンデータ定義
  patterns: PatternData[] = [...];

  // FormGroupの配列として管理
  patternForms: FormGroup[] = [];

  // 選択状態
  selectedPatternIndex: number = 0;

  ngOnInit(): void {
    // 各パターンごとに独立したFormGroupを作成
    this.patternForms = this.patterns.map(pattern =>
      this.fb.group({
        a: [pattern.initialValues.a],
        b: [pattern.initialValues.b],
        c: [pattern.initialValues.c],
        d: [pattern.initialValues.d],
      })
    );
  }

  // イベントハンドラー
  onPatternSelect = (index: number): void => {
    this.selectedPatternIndex = index;
  };
}
```

**テンプレート**:
```html
@for (pattern of patterns; track $index) {
  <div class="pattern-row">
    <app-pattern-card
      [patternForm]="patternForms[$index]"
      [patternName]="pattern.name"
      [patternIndex]="$index"
      [selectedPatternIndex]="selectedPatternIndex"
      [onPatternSelect]="onPatternSelect"
    />
  </div>
}
```

**ポイント**:
- FormGroupを子コンポーネントに渡す（FormControlではない）
- イベントハンドラーを関数として渡す（アロー関数で定義）
- データの管理は親コンポーネントが責務を持つ

---

### 2. 中間コンポーネント (PatternCardComponent)

**役割**: FormGroupを受け取り、複数のパラメータを表示

**責務**:
- 親から渡されたFormGroupを保持
- FormGroupから個別のFormControlを抽出して子コンポーネントへ渡す
- ラジオボタンなどのUI要素の配置
- 選択状態の視覚的フィードバック

**実装例**:
```typescript
export class PatternCardComponent {
  @Input({ required: true }) patternForm!: FormGroup;
  @Input({ required: true }) patternName!: string;
  @Input({ required: true }) patternIndex!: number;
  @Input({ required: true }) selectedPatternIndex!: number;
  @Input({ required: true }) onPatternSelect!: (index: number) => void;

  get isSelected(): boolean {
    return this.selectedPatternIndex === this.patternIndex;
  }

  // FormGroup内の各FormControlを取得
  getControl(fieldName: string): FormControl<number> {
    return this.patternForm.get(fieldName) as FormControl<number>;
  }
}
```

**テンプレート**:
```html
<div class="pattern-card" [class.selected]="isSelected">
  <div class="pattern-content">
    <!-- ラジオボタン -->
    <div class="radio-display">
      <mat-radio-group [ngModel]="selectedPatternIndex" (ngModelChange)="onPatternSelect($event)">
        <mat-radio-button [value]="patternIndex">
          {{ patternName }}
        </mat-radio-button>
      </mat-radio-group>
    </div>

    <!-- パラメータグリッド -->
    <div class="pattern-form">
      <div class="parameters-grid">
        <app-parameter-slider
          [control]="getControl('a')"
          label="× Stop Rate"
        />
        <!-- 他のパラメータ... -->
      </div>
    </div>
  </div>
</div>
```

**ポイント**:
- FormGroupを受け取り、`getControl()`でFormControlを抽出
- 子コンポーネントにはFormControlを渡す
- イベントハンドラーは親から受け取った関数を呼び出す
- UI構造の責務を持つ（レイアウト、スタイリング）

---

### 3. リーフコンポーネント (ParameterSliderComponent)

**役割**: FormControlを受け取り、単一パラメータの入力UIを提供

**責務**:
- 親から渡されたFormControlを直接使用
- スライダーと数値入力フィールドの連動
- 値の更新処理
- 再利用可能な汎用的なUIコンポーネント

**実装例**:
```typescript
export class ParameterSliderComponent {
  @Input({ required: true }) control!: FormControl<number>;
  @Input({ required: true }) label!: string;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;

  updateValue(value: number): void {
    this.control.setValue(value);
  }
}
```

**テンプレート**:
```html
<div class="parameter-control">
  <div class="parameter-header">
    <h4>{{ label }}</h4>
  </div>
  <div class="slider-input-row">
    <mat-slider [min]="min" [max]="max" [step]="step" discrete class="slider">
      <input
        matSliderThumb
        [value]="control.value"
        (valueChange)="updateValue($event)"
      />
    </mat-slider>
    <div class="number-input">
      <input
        type="number"
        [formControl]="control"
        [min]="min"
        [max]="max"
      />
    </div>
  </div>
</div>
```

**ポイント**:
- FormControlを`@Input()`で受け取る
- `[formControl]`ディレクティブで直接バインド
- スライダーは`(valueChange)`イベントで`setValue()`を呼ぶ
- 数値入力は`[formControl]`で自動的に双方向バインド
- 汎用的なパラメータとして設計（label, min, max, step）

---

## フォームコントロールの分離パターン

### パターン1: FormControlを直接渡す（今回採用）

**メリット**:
- シンプルで理解しやすい
- FormControlの全機能が子コンポーネントで利用可能
- ReactiveFormsの機能（バリデーション、状態管理）をそのまま使える

**デメリット**:
- 親のFormGroupとの結合度が高い

**使用例**:
```typescript
// 親コンポーネント
patternForms = this.fb.group({ a: [30], b: [50] });

// 子コンポーネントへの渡し方
<app-parameter-slider [control]="patternForm.get('a')" />

// 子コンポーネント
@Input() control!: FormControl<number>;
```

---

### パターン2: ControlValueAccessorを実装（今回は不使用）

**メリット**:
- 完全にカスタムコンポーネントとして扱える
- 親のFormGroup/FormControlから独立

**デメリット**:
- 実装が複雑
- `writeValue`, `registerOnChange`, `registerOnTouched`などの実装が必要
- 今回のような単純なケースではオーバーエンジニアリング

---

## データフロー

```
親コンポーネント (FormBuilder)
  │
  ├── FormGroup[] を作成
  │   └── 各FormGroupは { a, b, c, d } のFormControlを持つ
  │
  ├── パターンデータを定義
  │
  └── 選択状態を管理
      │
      ▼
中間コンポーネント (PatternCard)
  │
  ├── FormGroup を受け取る
  │
  ├── getControl(field) でFormControlを抽出
  │
  └── 各パラメータ用にFormControlを渡す
      │
      ▼
リーフコンポーネント (ParameterSlider)
  │
  ├── FormControl<number> を受け取る
  │
  ├── [formControl]でバインド
  │
  └── setValue()で値を更新
      │
      ▼
    親のFormGroupに自動反映
```

---

## 重要な設計原則

### 1. 単一責任の原則
- **親**: データ管理とビジネスロジック
- **中間**: UI構造とレイアウト
- **リーフ**: 再利用可能なUI部品

### 2. データは親で管理
- FormBuilderは親コンポーネントでのみ使用
- 子コンポーネントはFormControl/FormGroupを受け取るだけ
- 値の変更は自動的に親のFormGroupに反映される

### 3. イベントの伝播
- 子から親へのイベント伝達は`@Input()`で関数を渡す
- 親で定義したハンドラーをそのまま子に渡す

### 4. 型安全性
- FormControl<number>のように型パラメータを明示
- required: trueで必須入力を保証

---

## モジュール構成（NgModule vs Standalone）

この例では、**親コンポーネントはNgModule**、**子コンポーネントはStandalone**の混在構成を採用しています。

### 親コンポーネント（NgModule方式）

```typescript
// pattern-selector-example.module.ts
@NgModule({
  declarations: [
    PatternSelectorExampleComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    PatternCardComponent,      // Standaloneコンポーネントをインポート
    ParameterSliderComponent,  // Standaloneコンポーネントをインポート
  ],
  exports: [
    PatternSelectorExampleComponent
  ]
})
export class PatternSelectorExampleModule { }
```

### 子コンポーネント（Standalone方式）

```typescript
// pattern-card.component.ts
@Component({
  selector: 'app-pattern-card',
  standalone: true,  // Standaloneフラグ
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatRadioModule,
    ParameterSliderComponent,
  ],
  templateUrl: './pattern-card.component.html',
  styleUrl: './pattern-card.component.scss',
})
export class PatternCardComponent { }
```

**この構成のメリット**:
- 既存のNgModuleベースのコードとの互換性
- 新しいStandaloneコンポーネントの再利用性
- 段階的な移行が可能

---

## 再利用のポイント

### ParameterSliderComponent の再利用例

このコンポーネントは以下のように別の場面でも再利用できます:

```html
<!-- 他のフォームでも使用可能 -->
<form [formGroup]="myForm">
  <app-parameter-slider
    [control]="myForm.get('volume')"
    label="音量"
    [min]="0"
    [max]="100"
  />

  <app-parameter-slider
    [control]="myForm.get('brightness')"
    label="明るさ"
    [min]="0"
    [max]="255"
  />
</form>
```

---

## まとめ

FormBuilderで構築したフォームをコンポーネント化する際のベストプラクティス:

1. **親コンポーネント**: FormBuilderでFormGroupを作成・管理
2. **中間コンポーネント**: FormGroupを受け取り、FormControlを抽出して子に渡す
3. **リーフコンポーネント**: FormControlを受け取り、UI部品として機能
4. **データフロー**: 親→中間→リーフの一方向データフロー
5. **イベント**: 親で定義したハンドラーを子に渡す
6. **型安全**: FormControl<T>で型を明示
7. **責務分離**: データ管理とUI表示を明確に分ける

この設計により、**保守性**、**再利用性**、**テスタビリティ**が向上します。
