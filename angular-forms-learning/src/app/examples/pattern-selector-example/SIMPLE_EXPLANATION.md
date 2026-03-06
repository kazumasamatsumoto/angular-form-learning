# Angular Reactive Forms 超わかりやすい解説

## まず、普通のJavaScriptで考えてみる

### 1. FormControl = 値を保存する箱

```javascript
// 普通のJavaScriptで書くと
class FormControl {
  constructor(initialValue) {
    this.value = initialValue;           // 値
    this.listeners = [];                 // 変更を知りたい人のリスト
  }

  // 値を変更する
  setValue(newValue) {
    this.value = newValue;

    // 変更を知りたい人全員に教える
    this.listeners.forEach(listener => {
      listener(newValue);
    });
  }

  // 変更を知りたい人を登録
  onChange(callback) {
    this.listeners.push(callback);
  }
}
```

### 使ってみる

```javascript
// FormControlを作る
const ageControl = new FormControl(30);

console.log(ageControl.value);  // 30

// 変更を監視する人を登録
ageControl.onChange((newValue) => {
  console.log('年齢が変わった！新しい値:', newValue);
});

// 値を変更
ageControl.setValue(40);
// → コンソールに「年齢が変わった！新しい値: 40」と表示される
```

### 何が起きているか？

```
1. ageControl.setValue(40) を呼ぶ
   ↓
2. ageControl.value = 40 に更新
   ↓
3. ageControl.listeners を全部実行
   ↓
4. 登録したコールバック関数が呼ばれる
   → console.log('年齢が変わった！新しい値: 40')
```

---

## 2. FormGroup = FormControlの入れ物

```javascript
class FormGroup {
  constructor(controls) {
    this.controls = controls;  // { name: FormControl, age: FormControl }
  }

  // 全体の値を取得
  getValue() {
    const result = {};

    // 各FormControlの値を集める
    for (let key in this.controls) {
      result[key] = this.controls[key].value;
    }

    return result;
  }

  // 特定のFormControlを取得
  get(name) {
    return this.controls[name];
  }
}
```

### 使ってみる

```javascript
// FormControlを2つ作る
const nameControl = new FormControl('太郎');
const ageControl = new FormControl(30);

// FormGroupに入れる
const userForm = new FormGroup({
  name: nameControl,
  age: ageControl
});

// 全体の値を取得
console.log(userForm.getValue());
// { name: '太郎', age: 30 }

// 特定のFormControlを取得
const name = userForm.get('name');
console.log(name.value);  // '太郎'

// 値を変更
userForm.get('age').setValue(40);
console.log(userForm.getValue());
// { name: '太郎', age: 40 }
```

### 何が起きているか？

```
userForm = {
  controls: {
    name: FormControl { value: '太郎' },
    age: FormControl { value: 30 }
  }
}

userForm.getValue() を呼ぶ
  ↓
result = {}
result['name'] = controls['name'].value  // '太郎'
result['age'] = controls['age'].value    // 30
return result  // { name: '太郎', age: 30 }
```

---

## 3. FormBuilder = 簡単に作るヘルパー

```javascript
class FormBuilder {
  group(config) {
    const controls = {};

    // 設定を見て、FormControlを作る
    for (let key in config) {
      const value = config[key];
      controls[key] = new FormControl(value);
    }

    return new FormGroup(controls);
  }
}
```

### 使ってみる

```javascript
const fb = new FormBuilder();

// これ（面倒）
const form1 = new FormGroup({
  name: new FormControl('太郎'),
  age: new FormControl(30)
});

// の代わりに、これ（簡単）
const form2 = fb.group({
  name: '太郎',
  age: 30
});

// 結果は同じ
console.log(form1.getValue());  // { name: '太郎', age: 30 }
console.log(form2.getValue());  // { name: '太郎', age: 30 }
```

---

## 実際の動作を追ってみる

### シナリオ: ユーザーがinput欄に入力する

```html
<input type="number" [formControl]="ageControl" />
```

### ステップ1: 初期化

```javascript
// TypeScriptコード
const ageControl = new FormControl(30);

// メモリの中
ageControl = {
  value: 30,
  listeners: []
}
```

### ステップ2: Angularがinput要素とFormControlを接続

```javascript
// Angularが内部でやっていること（イメージ）
const inputElement = document.querySelector('input');

// input要素の値を初期化
inputElement.value = ageControl.value;  // 30

// input要素が変わったらFormControlを更新
inputElement.addEventListener('input', (event) => {
  const newValue = event.target.value;  // ユーザーが入力した値
  ageControl.setValue(newValue);        // FormControlを更新
});

// FormControlが変わったらinput要素を更新
ageControl.onChange((newValue) => {
  inputElement.value = newValue;
});
```

### ステップ3: ユーザーが「40」を入力

```
1. ユーザーがキーボードで「40」を入力
   ↓
2. inputイベントが発火
   ↓
3. addEventListener のコールバックが実行される
   → ageControl.setValue(40)
   ↓
4. FormControlの中で
   this.value = 40
   this.listeners.forEach(listener => listener(40))
   ↓
5. 登録されたコールバックが実行される
   → inputElement.value = 40
   （すでに40なので見た目は変わらない）
```

---

## FormGroupとFormControlの親子関係

### 子が変わったら親も変わる仕組み

```javascript
class FormGroup {
  constructor(controls) {
    this.controls = controls;
    this.listeners = [];

    // 重要: 各子の変更を監視
    for (let key in controls) {
      const control = controls[key];

      // 子が変わったら、親も変わったことを通知
      control.onChange(() => {
        this.notifyChange();
      });
    }
  }

  getValue() {
    const result = {};
    for (let key in this.controls) {
      result[key] = this.controls[key].value;
    }
    return result;
  }

  notifyChange() {
    // 親の変更を知りたい人全員に教える
    const value = this.getValue();
    this.listeners.forEach(listener => {
      listener(value);
    });
  }

  onChange(callback) {
    this.listeners.push(callback);
  }
}
```

### 実際の動作

```javascript
// FormGroupを作る
const form = new FormGroup({
  name: new FormControl('太郎'),
  age: new FormControl(30)
});

// FormGroupの変更を監視
form.onChange((value) => {
  console.log('フォーム全体が変わった:', value);
});

// 子のFormControlを変更
form.get('age').setValue(40);

// 実行される流れ:
// 1. ageControl.setValue(40)
// 2. ageControl.value = 40
// 3. ageControl.listeners が実行される
// 4. → form.notifyChange() が呼ばれる
// 5. → form.listeners が実行される
// 6. → console.log('フォーム全体が変わった:', { name: '太郎', age: 40 })
```

---

## 具体例: pattern-selector-example で何が起きているか？

### コード

```typescript
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

### ステップ1: this.fb.group() が呼ばれる

```javascript
// 1回目のループ: パターンA
this.fb.group({
  a: [30],
  b: [50],
  c: [60],
  d: [100]
})

// FormBuilder内部で
const controls = {};
controls['a'] = new FormControl(30);
controls['b'] = new FormControl(50);
controls['c'] = new FormControl(60);
controls['d'] = new FormControl(100);

return new FormGroup(controls);
```

### ステップ2: メモリの状態

```javascript
this.patternForms = [
  // パターンA
  FormGroup {
    controls: {
      a: FormControl { value: 30 },
      b: FormControl { value: 50 },
      c: FormControl { value: 60 },
      d: FormControl { value: 100 }
    }
  },
  // パターンB
  FormGroup {
    controls: {
      a: FormControl { value: 25 },
      b: FormControl { value: 30 },
      c: FormControl { value: 55 },
      d: FormControl { value: 87 }
    }
  },
  // パターンC
  FormGroup {
    controls: {
      a: FormControl { value: 10 },
      b: FormControl { value: 40 },
      c: FormControl { value: 70 },
      d: FormControl { value: 90 }
    }
  }
]
```

### ステップ3: テンプレートで使う

```html
<app-pattern-card [patternForm]="patternForms[0]" />
```

これは以下を渡している:

```javascript
patternForms[0] = FormGroup {
  controls: {
    a: FormControl { value: 30 },
    b: FormControl { value: 50 },
    c: FormControl { value: 60 },
    d: FormControl { value: 100 }
  }
}
```

### ステップ4: PatternCardコンポーネントで受け取る

```typescript
@Input() patternForm!: FormGroup;

getControl(fieldName: string): FormControl<number> {
  return this.patternForm.get(fieldName);
}
```

```javascript
// getControl('a') を呼ぶと
getControl('a') {
  return this.patternForm.controls['a'];
  // → FormControl { value: 30 }
}
```

### ステップ5: ParameterSliderコンポーネントに渡す

```html
<app-parameter-slider [control]="getControl('a')" />
```

これは以下を渡している:

```javascript
control = FormControl { value: 30 }
```

### ステップ6: ParameterSliderでinput要素にバインド

```html
<input type="number" [formControl]="control" />
```

Angularが内部でやること:

```javascript
const inputElement = document.querySelector('input');

// 初期値を設定
inputElement.value = control.value;  // 30

// input要素が変わったらFormControlを更新
inputElement.addEventListener('input', (event) => {
  control.setValue(event.target.value);
});

// FormControlが変わったらinput要素を更新
control.onChange((newValue) => {
  inputElement.value = newValue;
});
```

---

## ユーザーがスライダーを動かしたら何が起きる？

### シナリオ: パターンAのパラメータaを30→40に変更

```
1. ユーザーがスライダーを動かす
   ↓
2. (valueChange)="updateValue($event)" が発火
   ↓
3. updateValue(40) が呼ばれる
   ↓
4. this.control.setValue(40) が実行される
   ↓
5. FormControl内部で
   this.value = 40
   this.listeners.forEach(listener => listener(40))
   ↓
6. input要素のvalue属性が40に更新される
   ↓
7. FormControl('a')の親であるFormGroupも通知を受ける
   ↓
8. patternForms[0].getValue() が呼ばれると
   { a: 40, b: 50, c: 60, d: 100 } が返る
```

---

## まとめ: データの流れ

### 作成時

```
FormBuilder.group({ a: [30] })
  ↓
new FormControl(30) を作成
  ↓
new FormGroup({ a: FormControl(30) }) を作成
  ↓
patternForms[0] に格納
```

### 表示時

```
patternForms[0]
  ↓
PatternCardに渡す
  ↓
getControl('a') で FormControl(30) を取り出す
  ↓
ParameterSliderに渡す
  ↓
[formControl]="control" でinput要素にバインド
  ↓
画面に「30」が表示される
```

### 変更時

```
ユーザーがinput要素に「40」を入力
  ↓
inputイベント発火
  ↓
FormControl.setValue(40)
  ↓
FormControl.value = 40
  ↓
FormControl.listeners 全員に通知
  ↓
input要素が更新される (すでに40なので見た目は変わらない)
  ↓
親のFormGroupも通知を受ける
  ↓
patternForms[0].getValue() → { a: 40, b: 50, c: 60, d: 100 }
```

---

## 開発で気をつける点（具体例）

### 1. 同じFormControlを共有しない

```typescript
// ❌ 危険
const sharedControl = new FormControl(30);
const form1 = this.fb.group({ a: sharedControl });
const form2 = this.fb.group({ a: sharedControl });

// メモリの状態
// form1とform2が同じFormControlを参照
form1.controls['a'] === form2.controls['a']  // true

// form1を変更すると
form1.get('a').setValue(50);

// form2も変わってしまう
console.log(form2.get('a').value);  // 50（意図しない）
```

```typescript
// ✅ 正しい
const form1 = this.fb.group({ a: [30] });
const form2 = this.fb.group({ a: [30] });

// 別々のFormControlが作られる
form1.controls['a'] !== form2.controls['a']  // true

// 独立している
form1.get('a').setValue(50);
console.log(form2.get('a').value);  // 30（意図通り）
```

### 2. subscribeしたらunsubscribe

```typescript
// ❌ メモリリーク
ngOnInit() {
  this.control.onChange((value) => {
    console.log(value);
  });
  // コンポーネントが破棄されてもコールバックが残る
}

// コンポーネント破棄後も
// control.listeners = [function(value) { console.log(value); }]
// が残り続ける → メモリリーク
```

```typescript
// ✅ 正しい
listeners = [];

ngOnInit() {
  const listener = (value) => console.log(value);
  this.control.onChange(listener);
  this.listeners.push(listener);
}

ngOnDestroy() {
  // リスナーを削除
  this.listeners.forEach(listener => {
    this.control.removeListener(listener);
  });
}
```

### 3. setValue vs patchValue

```typescript
const form = this.fb.group({
  name: [''],
  age: [0]
});

// ❌ エラー
form.setValue({ age: 30 });
// → { name: ??? }  nameがないのでエラー

// ✅ patchValue
form.patchValue({ age: 30 });
// → { name: '', age: 30 }  nameはそのまま

// ✅ setValue（全フィールド指定）
form.setValue({ name: '太郎', age: 30 });
// → { name: '太郎', age: 30 }
```

---

## 最後に: 一番重要なポイント

FormControl/FormGroupは**ただの箱**です。

```javascript
// 本質はこれだけ
class FormControl {
  value = 初期値;
  listeners = [];

  setValue(newValue) {
    this.value = newValue;
    this.listeners.forEach(fn => fn(newValue));
  }

  onChange(fn) {
    this.listeners.push(fn);
  }
}

class FormGroup {
  controls = { a: FormControl, b: FormControl };

  getValue() {
    return {
      a: this.controls.a.value,
      b: this.controls.b.value
    };
  }

  get(name) {
    return this.controls[name];
  }
}
```

RxJSのSubjectやObservableは、この`listeners`配列を**もっと便利にしたもの**です。
本質は「値を保存して、変更を通知する」だけです。

これが分かれば、Reactive Formsの全てが分かります！
