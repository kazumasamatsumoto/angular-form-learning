# Angular Reactive Forms の内部実装と動作原理

## 概要

FormControl、FormGroup、FormBuilderは**どういう仕組み**で動いているのか？
AngularのソースコードレベルでRxJSとObserverパターンを使った実装を解説します。

---

## 1. FormControl の内部実装

### 本質: Observable + State管理

FormControlは以下のようなJavaScriptクラスです（簡略化版）:

```typescript
class FormControl {
  private _value: any;                    // 現在の値
  private _onChange: Function[] = [];     // 値が変わった時のコールバック配列
  private _status: string = 'VALID';      // 状態 ('VALID' | 'INVALID' | 'PENDING' | 'DISABLED')
  private _validators: Function[] = [];   // バリデーション関数の配列

  // RxJSのSubject（観察可能なストリーム）
  private _valueChanges$ = new Subject<any>();
  private _statusChanges$ = new Subject<string>();

  constructor(initialValue: any, validators?: Function[]) {
    this._value = initialValue;
    this._validators = validators || [];
    this._updateValue(initialValue);  // 初期化時にバリデーション実行
  }

  // 値を取得
  get value(): any {
    return this._value;
  }

  // 値を設定
  setValue(value: any): void {
    this._value = value;
    this._updateValue(value);
  }

  // 値の変更を通知
  private _updateValue(value: any): void {
    // 1. バリデーションを実行
    this._runValidators();

    // 2. 登録されたコールバックを全て実行
    this._onChange.forEach(fn => fn(value));

    // 3. RxJSストリームに値を流す
    this._valueChanges$.next(value);
    this._statusChanges$.next(this._status);
  }

  // バリデーション実行
  private _runValidators(): void {
    let errors = null;

    // 全てのバリデーション関数を実行
    for (const validator of this._validators) {
      const result = validator(this);
      if (result !== null) {
        errors = { ...errors, ...result };
      }
    }

    // 状態を更新
    this._status = errors === null ? 'VALID' : 'INVALID';
    this._errors = errors;
  }

  // 値の変更を監視するObservable
  get valueChanges(): Observable<any> {
    return this._valueChanges$.asObservable();
  }

  // コールバックを登録（これがAngularの内部で使われる）
  registerOnChange(fn: Function): void {
    this._onChange.push(fn);
  }

  get valid(): boolean {
    return this._status === 'VALID';
  }

  get invalid(): boolean {
    return this._status === 'INVALID';
  }
}
```

### 実際の動作例

```typescript
// FormControlのインスタンスを作成
const control = new FormControl(30);

// 内部では
{
  _value: 30,
  _onChange: [],
  _valueChanges$: Subject<any>,
  _status: 'VALID',
  _validators: []
}

// setValue()を呼ぶと
control.setValue(40);

// 内部で以下が実行される:
// 1. this._value = 40
// 2. this._runValidators()  → バリデーション実行
// 3. this._onChange.forEach(fn => fn(40))  → コールバック実行
// 4. this._valueChanges$.next(40)  → RxJSストリームに値を流す
```

### RxJS Subject の役割

```typescript
// Subjectは「値を流せるObservable」
const subject = new Subject<number>();

// 購読者を登録
subject.subscribe(value => {
  console.log('値が変わった:', value);
});

// 値を流す
subject.next(10);  // → '値が変わった: 10'
subject.next(20);  // → '値が変わった: 20'
```

FormControlの`valueChanges`はこのSubjectをObservableに変換したものです。

```typescript
control.valueChanges.subscribe(value => {
  console.log('FormControlの値が変わった:', value);
});

control.setValue(50);  // → 'FormControlの値が変わった: 50'
```

### テンプレートとの連携の仕組み

```html
<input type="number" [formControl]="ageControl" />
```

Angularは内部で以下を実行しています:

```typescript
// 1. input要素の値が変わったら FormControl.setValue() を呼ぶ
inputElement.addEventListener('input', (event) => {
  ageControl.setValue(event.target.value);
});

// 2. FormControlの値が変わったら input要素の値を更新
ageControl.registerOnChange((value) => {
  inputElement.value = value;
});

// 3. valueChangesを監視してDOMを更新
ageControl.valueChanges.subscribe(value => {
  inputElement.value = value;
});
```

これが**双方向バインディング**の仕組みです。

---

## 2. FormGroup の内部実装

### 本質: FormControlの辞書 + 親子関係の管理

FormGroupは複数のFormControlを保持する入れ物です（簡略化版）:

```typescript
class FormGroup {
  // 子のコントロールを保持する辞書
  public controls: { [key: string]: FormControl } = {};

  private _onChange: Function[] = [];
  private _valueChanges$ = new Subject<any>();
  private _statusChanges$ = new Subject<string>();

  constructor(controls: { [key: string]: FormControl }) {
    this.controls = controls;

    // 各子コントロールの変更を監視
    Object.keys(controls).forEach(key => {
      const control = controls[key];

      // 子の値が変わったら、親も更新
      control.registerOnChange(() => {
        this._updateValue();
      });
    });

    this._updateValue();  // 初期化
  }

  // 全体の値を取得
  get value(): any {
    const result: any = {};

    // 全ての子コントロールの値を集める
    Object.keys(this.controls).forEach(key => {
      result[key] = this.controls[key].value;
    });

    return result;
  }

  // 特定のコントロールを取得
  get(path: string): FormControl | null {
    return this.controls[path] || null;
  }

  // 値を設定
  setValue(value: { [key: string]: any }): void {
    // 全ての子コントロールに値を設定
    Object.keys(value).forEach(key => {
      if (this.controls[key]) {
        this.controls[key].setValue(value[key]);
      }
    });
  }

  // 一部の値だけ設定
  patchValue(value: { [key: string]: any }): void {
    // 指定されたフィールドだけ更新
    Object.keys(value).forEach(key => {
      if (this.controls[key]) {
        this.controls[key].setValue(value[key]);
      }
    });
  }

  // 値の変更を通知
  private _updateValue(): void {
    const value = this.value;

    // 子のステータスをチェック
    const allValid = Object.keys(this.controls).every(key =>
      this.controls[key].valid
    );
    this._status = allValid ? 'VALID' : 'INVALID';

    // コールバック実行
    this._onChange.forEach(fn => fn(value));

    // RxJSストリームに値を流す
    this._valueChanges$.next(value);
    this._statusChanges$.next(this._status);
  }

  get valueChanges(): Observable<any> {
    return this._valueChanges$.asObservable();
  }

  get valid(): boolean {
    return this._status === 'VALID';
  }
}
```

### 実際の動作例

```typescript
// FormGroupを作成
const form = new FormGroup({
  name: new FormControl('太郎'),
  age: new FormControl(30)
});

// 内部構造
{
  controls: {
    name: FormControl { _value: '太郎', ... },
    age: FormControl { _value: 30, ... }
  },
  _valueChanges$: Subject<any>,
  _onChange: []
}

// form.value を取得すると
form.value
// → { name: '太郎', age: 30 }

// 内部で実行されるコード:
get value() {
  const result = {};
  result['name'] = this.controls['name'].value;  // '太郎'
  result['age'] = this.controls['age'].value;    // 30
  return result;  // { name: '太郎', age: 30 }
}

// form.get('name') を呼ぶと
form.get('name')
// → FormControl { _value: '太郎', ... }

// 内部で実行されるコード:
get(path) {
  return this.controls[path];  // this.controls['name']
}
```

### 子の変更が親に伝播する仕組み

```typescript
// FormGroup作成時
const form = new FormGroup({
  name: new FormControl('太郎'),
  age: new FormControl(30)
});

// 内部では各子コントロールにコールバックを登録
Object.keys(controls).forEach(key => {
  const control = controls[key];

  // 子が変更されたら親のupdateValueを呼ぶ
  control.registerOnChange(() => {
    this._updateValue();  // 親のvalueChangesに通知
  });
});

// 子の値を変更すると
form.get('age').setValue(40);

// 実行される流れ:
// 1. FormControl('age')._updateValue(40)
// 2. FormControl('age')._onChange.forEach(fn => fn(40))
// 3. → FormGroup._updateValue() が呼ばれる
// 4. FormGroup._valueChanges$.next({ name: '太郎', age: 40 })
```

### FormGroupのvalueChangesの実例

```typescript
const form = new FormGroup({
  name: new FormControl('太郎'),
  age: new FormControl(30)
});

// FormGroup全体の変更を監視
form.valueChanges.subscribe(value => {
  console.log('フォーム全体が変わった:', value);
});

// 子のFormControlを変更
form.get('age').setValue(40);

// 出力:
// 'フォーム全体が変わった: { name: "太郎", age: 40 }'
```

---

## 3. FormBuilder の内部実装

### 本質: ファクトリーパターン

FormBuilderは単に`new FormGroup()`や`new FormControl()`を呼ぶヘルパーです（簡略化版）:

```typescript
class FormBuilder {
  // FormGroupを作成
  group(config: { [key: string]: any }): FormGroup {
    const controls: { [key: string]: FormControl } = {};

    // 各フィールドをFormControlに変換
    Object.keys(config).forEach(key => {
      const value = config[key];

      if (Array.isArray(value)) {
        // [初期値, バリデーション] の形式
        const [initialValue, validators] = value;
        controls[key] = new FormControl(initialValue, validators);
      } else {
        // 初期値のみ
        controls[key] = new FormControl(value);
      }
    });

    // FormGroupを返す
    return new FormGroup(controls);
  }

  // FormControlを作成
  control(initialValue: any, validators?: any): FormControl {
    return new FormControl(initialValue, validators);
  }

  // FormArrayを作成
  array(controls: any[]): FormArray {
    return new FormArray(controls);
  }
}
```

### 実際の動作例

```typescript
const fb = new FormBuilder();

// fb.group() を呼ぶ
const form = fb.group({
  name: ['太郎'],
  age: [30, Validators.required]
});

// 内部で実行されるコード:
group(config) {
  const controls = {};

  // 'name' フィールド
  const nameValue = config['name'];  // ['太郎']
  controls['name'] = new FormControl('太郎', undefined);

  // 'age' フィールド
  const ageValue = config['age'];  // [30, Validators.required]
  controls['age'] = new FormControl(30, Validators.required);

  // FormGroupを返す
  return new FormGroup(controls);
}

// 結果として以下と同じ
new FormGroup({
  name: new FormControl('太郎'),
  age: new FormControl(30, Validators.required)
})
```

### 配列記法の解析

```typescript
// FormBuilderの配列記法
fb.group({
  name: ['太郎', Validators.required],
  age: [30, [Validators.required, Validators.min(0)]]
})

// 内部処理:
Object.keys(config).forEach(key => {
  const value = config[key];

  if (Array.isArray(value)) {
    const [initialValue, validators] = value;

    // validators が配列なら複数のバリデーション
    // validators が関数なら単一のバリデーション
    controls[key] = new FormControl(initialValue, validators);
  }
});
```

---

## 4. バリデーションの仕組み

### Validatorsは単なる関数

```typescript
// Validatorsの実装例
class Validators {
  // required バリデーション
  static required(control: FormControl): { [key: string]: any } | null {
    const value = control.value;

    // 値が空ならエラー
    if (value === null || value === undefined || value === '') {
      return { required: true };  // エラーオブジェクトを返す
    }

    return null;  // エラーなし
  }

  // min バリデーション
  static min(minValue: number) {
    return (control: FormControl): { [key: string]: any } | null => {
      const value = control.value;

      if (value < minValue) {
        return { min: { min: minValue, actual: value } };
      }

      return null;
    };
  }

  // email バリデーション
  static email(control: FormControl): { [key: string]: any } | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const value = control.value;

    if (value && !emailRegex.test(value)) {
      return { email: true };
    }

    return null;
  }
}
```

### バリデーション実行のタイミング

```typescript
// FormControl内部
setValue(value: any): void {
  this._value = value;
  this._runValidators();  // ← ここでバリデーション実行
  this._updateValue(value);
}

private _runValidators(): void {
  let errors = null;

  // 全てのバリデーション関数を実行
  for (const validator of this._validators) {
    const result = validator(this);  // バリデーション関数に自分自身を渡す

    if (result !== null) {
      // エラーがあればマージ
      errors = { ...errors, ...result };
    }
  }

  this._errors = errors;
  this._status = errors === null ? 'VALID' : 'INVALID';
}
```

### カスタムバリデーションの例

```typescript
// カスタムバリデーション関数
function ageValidator(control: FormControl): { [key: string]: any } | null {
  const value = control.value;

  if (value < 0 || value > 120) {
    return { invalidAge: { value: value } };
  }

  return null;
}

// 使用例
const ageControl = new FormControl(30, ageValidator);

ageControl.setValue(150);
console.log(ageControl.errors);  // { invalidAge: { value: 150 } }
console.log(ageControl.invalid);  // true
```

---

## 5. テンプレートディレクティブの仕組み

### [formControl] ディレクティブ

```typescript
@Directive({
  selector: '[formControl]'
})
class FormControlDirective {
  @Input() formControl: FormControl;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    const element = this.elementRef.nativeElement;

    // 1. DOM→FormControl: input イベントでFormControlを更新
    element.addEventListener('input', (event) => {
      this.formControl.setValue(event.target.value);
    });

    // 2. FormControl→DOM: FormControlの変更をDOMに反映
    this.formControl.valueChanges.subscribe(value => {
      element.value = value;
    });

    // 3. 初期値をDOMに設定
    element.value = this.formControl.value;
  }
}
```

### [formGroup] と formControlName ディレクティブ

```typescript
@Directive({
  selector: '[formGroup]'
})
class FormGroupDirective {
  @Input() formGroup: FormGroup;

  // 子のformControlNameディレクティブがこれを参照
}

@Directive({
  selector: '[formControlName]'
})
class FormControlNameDirective {
  @Input() formControlName: string;

  constructor(
    private parent: FormGroupDirective,  // 親のformGroupを取得
    private elementRef: ElementRef
  ) {}

  ngOnInit() {
    // 親FormGroupから該当するFormControlを取得
    const control = this.parent.formGroup.get(this.formControlName);
    const element = this.elementRef.nativeElement;

    // DOM ↔ FormControl のバインディング
    element.addEventListener('input', (event) => {
      control.setValue(event.target.value);
    });

    control.valueChanges.subscribe(value => {
      element.value = value;
    });

    element.value = control.value;
  }
}
```

使用例:

```html
<form [formGroup]="userForm">
  <input formControlName="name" />
</form>
```

実行される流れ:
1. `FormGroupDirective`が`userForm`を保持
2. `FormControlNameDirective`が親から`userForm.get('name')`を取得
3. input要素と`FormControl('name')`をバインディング

---

## 6. 重要な設計パターン

### Observer パターン (RxJS Subject)

```typescript
// 観察対象
class FormControl {
  private _valueChanges$ = new Subject<any>();

  setValue(value: any) {
    this._value = value;
    this._valueChanges$.next(value);  // 全ての購読者に通知
  }

  get valueChanges() {
    return this._valueChanges$.asObservable();
  }
}

// 観察者
control.valueChanges.subscribe(value => {
  console.log('値が変わった:', value);
});
```

### Composite パターン (親子関係)

```typescript
// FormGroupは複数のFormControlを持つ
// FormControlの変更は親のFormGroupに伝播する
class FormGroup {
  controls: { [key: string]: FormControl } = {};

  constructor(controls) {
    this.controls = controls;

    // 子の変更を監視
    Object.values(controls).forEach(control => {
      control.valueChanges.subscribe(() => {
        this._updateValue();  // 親も更新
      });
    });
  }
}
```

### Factory パターン (FormBuilder)

```typescript
// FormBuilderは複雑なオブジェクト生成を簡略化
class FormBuilder {
  group(config): FormGroup {
    // configからFormGroupを生成
    return new FormGroup(...);
  }
}
```

---

## 7. 開発で気をつけるべきポイント

### ポイント1: 参照の共有

```typescript
// ❌ 危険: 同じFormControlを複数箇所で使う
const sharedControl = new FormControl(30);
const form1 = this.fb.group({ a: sharedControl });
const form2 = this.fb.group({ a: sharedControl });

// form1とform2が同じControlを参照 → 予期しない動作
form1.get('a').setValue(50);
console.log(form2.get('a').value);  // 50 (意図しない変更)

// ✅ 正しい: 別々のFormControlを作成
const form1 = this.fb.group({ a: [30] });
const form2 = this.fb.group({ a: [30] });
```

### ポイント2: メモリリーク

```typescript
// ❌ 危険: subscribeしたまま放置
ngOnInit() {
  this.control.valueChanges.subscribe(value => {
    console.log(value);
  });
  // コンポーネントが破棄されてもsubscriptionが残る
}

// ✅ 正しい: unsubscribeする
private subscription: Subscription;

ngOnInit() {
  this.subscription = this.control.valueChanges.subscribe(value => {
    console.log(value);
  });
}

ngOnDestroy() {
  this.subscription.unsubscribe();
}

// ✅ さらに良い: async パイプを使う（自動unsubscribe）
<div>{{ control.valueChanges | async }}</div>
```

### ポイント3: setValue vs patchValue

```typescript
const form = this.fb.group({ name: [''], age: [0] });

// ❌ エラー: setValueは全フィールド必須
form.setValue({ age: 30 });  // Error: name がない

// ✅ patchValueは一部だけOK
form.patchValue({ age: 30 });  // OK

// ✅ setValueは全フィールド指定
form.setValue({ name: '太郎', age: 30 });  // OK
```

### ポイント4: get()の型キャスト

```typescript
// ❌ 危険: 型情報が失われる
const control = form.get('age');  // AbstractControl | null
control.setValue(30);  // TypeScriptエラー

// ✅ 型キャストする
const control = form.get('age') as FormControl<number>;
control.setValue(30);  // OK
```

### ポイント5: valueChangesの発火タイミング

```typescript
const control = new FormControl(30);

// subscribeより前にsetValueしても検知されない
control.setValue(40);

control.valueChanges.subscribe(value => {
  console.log('値:', value);
});

control.setValue(50);  // → '値: 50' と表示される

// 初期値を検知したい場合は startWith を使う
control.valueChanges.pipe(
  startWith(control.value)
).subscribe(value => {
  console.log('値:', value);  // 初期値から表示される
});
```

---

## まとめ

### FormControlの本質
- 内部に`_value`と`_valueChanges$: Subject`を持つ
- `setValue()`で値を更新し、Subjectに通知
- RxJSのObserverパターンで変更を伝播

### FormGroupの本質
- 複数のFormControlを`controls`オブジェクトで保持
- 各子の`valueChanges`を監視して親も更新
- `get()`で子のFormControlを取り出す

### FormBuilderの本質
- ファクトリーパターン
- 配列記法を解析して`new FormControl()`を呼ぶだけ

### テンプレートバインディングの本質
- ディレクティブがDOM要素とFormControlを接続
- `addEventListener`でDOM→FormControl
- `valueChanges.subscribe`でFormControl→DOM

### 気をつけるべき点
1. FormControlの参照を共有しない
2. subscriptionは必ずunsubscribeする
3. setValue/patchValueを使い分ける
4. get()の戻り値は型キャストする
5. valueChangesの発火タイミングに注意

これがAngular Reactive Formsの**内部実装の仕組み**です！
