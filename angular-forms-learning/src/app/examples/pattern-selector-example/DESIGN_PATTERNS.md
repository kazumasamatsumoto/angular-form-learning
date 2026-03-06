# pattern-selector-example で使われているデザインパターン

## 概要

このコンポーネントは、複数のコンピュータサイエンスの設計パターンを組み合わせて実装されています。

---

## 1. Observer パターン（観察者パターン）

### 定義
オブジェクト（Subject）の状態変化を、複数の観察者（Observer）に自動通知する設計パターン。

### GoF（Gang of Four）の定義
> "Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically."
>
> オブジェクト間に1対多の依存関係を定義し、あるオブジェクトの状態が変化したときに、それに依存する全てのオブジェクトが自動的に通知され更新されるようにする。

### pattern-selector-example での実装

```typescript
// Subject（観察対象）
class FormControl {
  private _valueChanges$ = new Subject<any>();  // 観察者リスト
  private _value: any;

  setValue(value: any) {
    this._value = value;
    this._valueChanges$.next(value);  // 全ての観察者に通知
  }

  get valueChanges(): Observable<any> {
    return this._valueChanges$.asObservable();
  }
}

// Observer（観察者）たち
親コンポーネント  }
子コンポーネント  } ← 全員がFormControlを観察
孫コンポーネント  }

// 孫が値を変更
formControl.setValue(40);
// → 親、子、孫の全てのUIが自動更新される
```

### UML図

```
┌─────────────────┐
│   Subject       │
│  (FormControl)  │
├─────────────────┤
│ + setValue()    │
│ + valueChanges  │
└─────────────────┘
        │
        │ notifies
        ▼
┌─────────────────┐
│   Observer      │
│  (Components)   │
├─────────────────┤
│ + update()      │
└─────────────────┘
```

---

## 2. Publish-Subscribe パターン（Pub/Sub）

### 定義
Observerパターンの拡張。発行者（Publisher）と購読者（Subscriber）が疎結合。

### pattern-selector-example での実装

```typescript
// Publisher（発行者）
formControl.setValue(40);  // イベントを発行

// Subscribers（購読者）
親.valueChanges.subscribe(v => console.log('親:', v));
子.valueChanges.subscribe(v => console.log('子:', v));
孫.valueChanges.subscribe(v => console.log('孫:', v));

// 出力:
// 親: 40
// 子: 40
// 孫: 40
```

### RxJSによる実装

```typescript
// RxJS Subject = Pub/Subの実装
private _valueChanges$ = new Subject<any>();

// Publish
this._valueChanges$.next(40);

// Subscribe
this._valueChanges$.subscribe(value => {
  // 値が変わった時の処理
});
```

---

## 3. Shared State パターン（共有状態）

### 定義
複数のコンポーネントが同じ状態（State）を共有し、状態の変更が全てのコンポーネントに反映される。

### pattern-selector-example での実装

```typescript
// 共有状態
const patternForm = this.fb.group({
  a: [30],
  b: [50],
  c: [60],
  d: [100]
});

// 親コンポーネント
this.patternForms[0] = patternForm;  // 共有状態を保持

// 子コンポーネント
@Input() patternForm: FormGroup;  // 同じ状態を参照

// 孫コンポーネント
@Input() control: FormControl;  // 同じ状態の一部を参照

// 孫が変更
control.setValue(40);
// → 親の patternForms[0].get('a').value も 40
```

### 状態管理ライブラリとの比較

| ライブラリ | 共有状態の実装 |
|-----------|---------------|
| Redux | Store |
| Vuex | State |
| NgRx | Store |
| **Angular Forms** | **FormControl/FormGroup** |

---

## 4. Single Source of Truth（SSOT）

### 定義
データには唯一の信頼できる情報源があり、全てのコンポーネントはそれを参照する。

### pattern-selector-example での実装

```typescript
// ❌ SSOT違反の例
class ParentComponent {
  value = 30;
}
class ChildComponent {
  value = 30;  // 複製
}
// → 親と子で値が不一致になる可能性

// ✅ SSOT準拠の例
class ParentComponent {
  control = new FormControl(30);  // ← 唯一の情報源
}
class ChildComponent {
  @Input() control: FormControl;  // ← 同じものを参照
}
// → 常に一致が保証される
```

### メモリ上のイメージ

```
Single Source of Truth
┌──────────────────┐
│ FormControl(30)  │ ← 唯一の情報源
└──────────────────┘
  ↑    ↑    ↑
  │    │    │
  親   子   孫

全員が同じオブジェクトを参照
```

---

## 5. Mediator パターン（仲介者パターン）

### 定義
オブジェクト間の複雑な通信を、Mediator（仲介者）を介して整理する。

### GoF の定義
> "Define an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly."
>
> 一連のオブジェクトがどのように相互作用するかをカプセル化するオブジェクトを定義する。Mediatorは、オブジェクトが互いを明示的に参照しないようにすることで、疎結合を促進する。

### pattern-selector-example での実装

```typescript
// ❌ 密結合: 直接通信
親 ↔ 子 ↔ 孫
// コンポーネント同士が直接やりとり

// ✅ 疎結合: Mediatorを介して通信
親 ↔ FormControl ↔ 孫
      ↑
   Mediator（仲介者）

// 親が孫に値を渡す場合
親: formControl.setValue(40)
孫: control.valueChanges.subscribe(v => console.log(v))

// 親と孫は互いを知らない（疎結合）
```

### UML図

```
┌─────────┐         ┌──────────────┐         ┌─────────┐
│  親     │────────▶│ FormControl  │◀────────│  孫     │
│         │         │  (Mediator)  │         │         │
└─────────┘         └──────────────┘         └─────────┘

// 親と孫は直接通信しない
// FormControlが仲介する
```

---

## 6. Composite パターン（複合パターン）

### 定義
オブジェクトをツリー構造で扱い、単一オブジェクトと複合オブジェクトを同じように扱う。

### pattern-selector-example での実装

```typescript
// 抽象クラス（共通インターフェース）
abstract class AbstractControl {
  abstract value: any;
  abstract setValue(value: any): void;
  abstract get(path: string): AbstractControl | null;
}

// Leaf（葉）
class FormControl extends AbstractControl {
  value: number;
  setValue(value: number) { this.value = value; }
  get(path: string) { return null; }  // 子を持たない
}

// Composite（複合）
class FormGroup extends AbstractControl {
  controls: { [key: string]: AbstractControl };

  get value() {
    // 全ての子の値を集める
    return Object.keys(this.controls).reduce((acc, key) => {
      acc[key] = this.controls[key].value;
      return acc;
    }, {});
  }

  setValue(value: any) {
    // 全ての子に値を設定
    Object.keys(value).forEach(key => {
      this.controls[key].setValue(value[key]);
    });
  }

  get(path: string): AbstractControl | null {
    return this.controls[path] || null;
  }
}
```

### ツリー構造

```
FormGroup (Composite)
├── a: FormControl(30) (Leaf)
├── b: FormControl(50) (Leaf)
├── c: FormControl(60) (Leaf)
└── d: FormControl(100) (Leaf)

// FormGroupもFormControlも同じインターフェース
formGroup.setValue({...})
formControl.setValue(30)

// どちらも setValue() を持つ
```

---

## 7. Strategy パターン（戦略パターン）

### 定義
アルゴリズム（戦略）を動的に切り替え可能にする。

### pattern-selector-example での実装

バリデーションがStrategyパターンです。

```typescript
// Strategy（戦略）インターフェース
interface Validator {
  (control: FormControl): { [key: string]: any } | null;
}

// 具体的な戦略
const requiredValidator: Validator = (control) => {
  return control.value ? null : { required: true };
};

const minValidator = (min: number): Validator => {
  return (control) => {
    return control.value >= min ? null : { min: true };
  };
};

// 戦略を動的に適用
const control = new FormControl(30, [
  requiredValidator,        // 戦略1
  minValidator(0),          // 戦略2
  maxValidator(100)         // 戦略3
]);

// 戦略の実行
control.setValue(150);
// → minValidatorとmaxValidatorが実行される
// → { max: true } エラー
```

---

## 8. Factory パターン（工場パターン）

### 定義
オブジェクトの生成ロジックをカプセル化する。

### pattern-selector-example での実装

FormBuilderがFactoryパターンです。

```typescript
// Factory（工場）
class FormBuilder {
  // FormGroupを生成
  group(config: any): FormGroup {
    const controls = {};

    Object.keys(config).forEach(key => {
      controls[key] = this.control(config[key][0], config[key][1]);
    });

    return new FormGroup(controls);
  }

  // FormControlを生成
  control(value: any, validators?: any): FormControl {
    return new FormControl(value, validators);
  }
}

// 使用例
const fb = new FormBuilder();

// Factoryを使わない場合（冗長）
const form1 = new FormGroup({
  a: new FormControl(30),
  b: new FormControl(50)
});

// Factoryを使う場合（簡潔）
const form2 = fb.group({
  a: [30],
  b: [50]
});
```

---

## 9. Dependency Injection パターン

### 定義
依存するオブジェクトを外部から注入する。

### pattern-selector-example での実装

```typescript
// 依存するオブジェクト（FormControl）を外部から注入
export class ParameterSliderComponent {
  @Input() control!: FormControl;  // ← 依存性注入
}

// 親コンポーネントが注入
<app-parameter-slider [control]="myControl"></app-parameter-slider>

// メリット:
// 1. ParameterSliderは自分でFormControlを作らない
// 2. テストしやすい（モックを注入できる）
// 3. 再利用しやすい（どんなFormControlでも使える）
```

### 従来の方法との比較

```typescript
// ❌ 依存性注入なし（密結合）
export class ParameterSliderComponent {
  control = new FormControl(30);  // 自分で作る
  // → 再利用できない、テストしにくい
}

// ✅ 依存性注入あり（疎結合）
export class ParameterSliderComponent {
  @Input() control!: FormControl;  // 外部から受け取る
  // → 再利用できる、テストしやすい
}
```

---

## 10. Reactive Programming（リアクティブプログラミング）

### 定義
データフローと変更の伝播に焦点を当てたプログラミングパラダイム。

### pattern-selector-example での実装

```typescript
// 命令的プログラミング（Imperative）
let value = 30;
parent.update(value);
child.update(value);
grandchild.update(value);

value = 40;
parent.update(value);     // 手動で更新
child.update(value);      // 手動で更新
grandchild.update(value); // 手動で更新

// リアクティブプログラミング（Reactive）
const control = new FormControl(30);

control.valueChanges.subscribe(v => parent.update(v));
control.valueChanges.subscribe(v => child.update(v));
control.valueChanges.subscribe(v => grandchild.update(v));

control.setValue(40);  // これだけで全員自動更新
```

### データフロー図

```
命令的プログラミング:
値の変更 → 手動でUI1更新
        → 手動でUI2更新
        → 手動でUI3更新

リアクティブプログラミング:
値の変更 → 自動でUI1更新
        → 自動でUI2更新
        → 自動でUI3更新
```

---

## パターンの組み合わせ

pattern-selector-example は以下のパターンを組み合わせています:

```
┌─────────────────────────────────────────┐
│  Reactive Programming                   │
│  ┌───────────────────────────────────┐  │
│  │  Observer Pattern                 │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Pub/Sub Pattern            │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │  Shared State         │  │  │  │
│  │  │  │  (FormControl/Group)  │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
        ↑
        │
┌───────────────────┐
│  Mediator Pattern │
│  Composite Pattern│
│  Strategy Pattern │
│  Factory Pattern  │
│  DI Pattern       │
└───────────────────┘
```

---

## まとめ

### pattern-selector-example で使われているパターン

1. **Observer** - FormControlの変更を監視
2. **Pub/Sub** - RxJS Subjectでイベント配信
3. **Shared State** - FormGroupを共有
4. **SSOT** - FormControlが唯一の情報源
5. **Mediator** - FormControlがコンポーネント間を仲介
6. **Composite** - FormGroup/FormControlのツリー構造
7. **Strategy** - バリデーションの切り替え
8. **Factory** - FormBuilderで生成
9. **DI** - @Inputで依存性注入
10. **Reactive** - 自動的な変更伝播

### これらのパターンによって実現されること

- **疎結合**: コンポーネント同士が直接依存しない
- **再利用性**: 任意のFormControlを渡せる
- **保守性**: 変更が局所化される
- **テスタビリティ**: モックで置き換え可能
- **自動同期**: 値の変更が自動的に伝播

### アカデミックな分類

- **ソフトウェアアーキテクチャ**: Reactive Architecture
- **プログラミングパラダイム**: Reactive Programming
- **デザインパターン**: Observer + Composite + Mediator
- **状態管理**: Shared Mutable State (with Observability)
- **データバインディング**: Two-way Data Binding (via Reactive Streams)

これが「コンポーネント構造で分離しているように見えて、変数の参照先を統一することで実装可能にする」仕組みの正体です！
