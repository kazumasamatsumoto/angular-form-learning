# FormControl/FormGroup の参照共有の仕組み

## 本質: JavaScriptのオブジェクトは参照渡し

### 基本的な例

```javascript
// オブジェクトを作る
const person = { name: '太郎', age: 30 };

// 別の変数に代入
const personRef = person;

// personRefを変更すると
personRef.age = 40;

// 元のpersonも変わる
console.log(person.age);  // 40

// なぜなら、同じオブジェクトを参照しているから
person === personRef  // true (同じメモリアドレスを指している)
```

### メモリ上のイメージ

```
メモリ
┌─────────────────────┐
│ { name: '太郎',      │ ← メモリアドレス: 0x1234
│   age: 30 }         │
└─────────────────────┘
    ↑           ↑
    │           │
  person    personRef
  (0x1234)  (0x1234)

// どちらも同じアドレスを指している
```

---

## FormControlも同じ仕組み

### コード例

```typescript
// 親コンポーネント
export class ParentComponent {
  ageControl = new FormControl(30);  // ← メモリ上に1つだけ作られる
}
```

```html
<!-- 子コンポーネントに渡す -->
<app-child [control]="ageControl"></app-child>
```

```typescript
// 子コンポーネント
export class ChildComponent {
  @Input() control!: FormControl;  // ← 同じオブジェクトを参照
}
```

### メモリ上のイメージ

```
メモリ
┌──────────────────────────┐
│ FormControl {            │ ← メモリアドレス: 0xABCD
│   value: 30,             │
│   listeners: []          │
│ }                        │
└──────────────────────────┘
    ↑                  ↑
    │                  │
ParentComponent    ChildComponent
.ageControl        .control
(0xABCD)          (0xABCD)

// どちらも同じFormControlを指している
```

### 子コンポーネントで値を変更すると

```typescript
// 子コンポーネント
this.control.setValue(40);

// メモリ上のFormControlが更新される
FormControl {
  value: 40,  // ← 更新された
  listeners: []
}

// 親コンポーネントからアクセスしても
console.log(this.ageControl.value);  // 40
// 同じオブジェクトを見ているので、変更が反映されている
```

---

## pattern-selector-example での実際の流れ

### 1. 親コンポーネントでFormGroupを作成

```typescript
// pattern-selector-example-module.ts
ngOnInit(): void {
  this.patternForms = [
    this.fb.group({
      a: [30],  // ← new FormControl(30) が作られる
      b: [50],  // ← new FormControl(50) が作られる
      c: [60],
      d: [100]
    })
  ];
}
```

### メモリ上の状態

```
メモリ

FormGroup (0x1000)
├── controls: {
│     a: FormControl(30) (0x1001),
│     b: FormControl(50) (0x1002),
│     c: FormControl(60) (0x1003),
│     d: FormControl(100) (0x1004)
│   }

this.patternForms[0] → 0x1000
```

### 2. PatternCardコンポーネントに渡す

```html
<app-pattern-card [patternForm]="patternForms[0]" />
```

```typescript
// PatternCardコンポーネント
@Input() patternForm!: FormGroup;  // ← 0x1000 を受け取る
```

### メモリ上の状態

```
メモリ

FormGroup (0x1000) ← 同じオブジェクト
├── controls: {
│     a: FormControl(30) (0x1001),
│     b: FormControl(50) (0x1002),
│     c: FormControl(60) (0x1003),
│     d: FormControl(100) (0x1004)
│   }

親.patternForms[0] → 0x1000
       ↓
子.patternForm → 0x1000 (同じ)
```

### 3. FormControlを取り出す

```typescript
// PatternCardコンポーネント
getControl(fieldName: string): FormControl<number> {
  return this.patternForm.get(fieldName);
}

// getControl('a') を呼ぶ
const aControl = this.patternForm.get('a');
// → 0x1001 を返す
```

### メモリ上の状態

```
メモリ

FormControl(30) (0x1001) ← 同じオブジェクト
  ↑
  │
親.patternForms[0].controls['a'] → 0x1001
  │
子.patternForm.get('a') → 0x1001 (同じ)
  │
孫.control → 0x1001 (同じ)
```

### 4. ParameterSliderコンポーネントに渡す

```html
<app-parameter-slider [control]="getControl('a')" />
```

```typescript
// ParameterSliderコンポーネント
@Input() control!: FormControl<number>;  // ← 0x1001 を受け取る
```

### 5. 孫コンポーネントで値を変更

```typescript
// ParameterSliderコンポーネント
updateValue(40) {
  this.control.setValue(40);  // ← 0x1001 のFormControlを変更
}
```

### メモリ上で何が起きるか

```
メモリ

FormControl (0x1001)
├── value: 30 → 40  ← ここが更新される
└── listeners: [...]

// 全員が同じオブジェクトを見ているので
親.patternForms[0].controls['a'].value  // 40
子.patternForm.get('a').value           // 40
孫.control.value                        // 40

// 全部同じ値になる
```

---

## コンポーネント階層化ができる理由

### 重要なポイント

1. **FormControl/FormGroupは参照として渡される**
   - コピーではなく、同じオブジェクトへのポインタ

2. **どこで変更しても、全員に反映される**
   - メモリ上の1つのオブジェクトを全員が参照しているから

3. **親がFormGroupを管理、子孫がFormControlを操作**
   - 親: データ構造の管理
   - 子: UI表示とユーザー入力の処理
   - 孫: 個別の入力フィールド

### この仕組みのメリット

```typescript
// 親コンポーネント
ngOnInit() {
  this.form = this.fb.group({ age: [30] });
}

submit() {
  // 孫コンポーネントで変更された値を取得できる
  console.log(this.form.value);  // { age: 40 }
  // なぜなら同じオブジェクトを参照しているから
}
```

---

## 注意点: 参照を上書きしない

### ❌ 危険な例

```typescript
// 子コンポーネント
@Input() control!: FormControl;

ngOnInit() {
  // これは危険！
  this.control = new FormControl(50);
  // 新しいFormControlを作って、this.controlに代入
  // → 親との接続が切れる
}
```

### メモリ上で何が起きるか

```
元々:
親.ageControl → 0x1001 (FormControl(30))
子.control → 0x1001 (同じ)

this.control = new FormControl(50) を実行後:
親.ageControl → 0x1001 (FormControl(30))  ← 変わらない
子.control → 0x2000 (FormControl(50))     ← 新しいオブジェクト

// 接続が切れた！
```

### ✅ 正しい例

```typescript
// 子コンポーネント
@Input() control!: FormControl;

ngOnInit() {
  // これは安全
  this.control.setValue(50);
  // 同じFormControlの値を変更するだけ
}
```

### メモリ上で何が起きるか

```
this.control.setValue(50) を実行後:

親.ageControl → 0x1001 (FormControl { value: 50 })
子.control → 0x1001 (FormControl { value: 50 })

// 同じオブジェクトの値が変わっただけ
// 接続は維持されている
```

---

## まとめ

### FormControl/FormGroupの受け渡しは「参照渡し」

```typescript
// 参照を渡す
<app-child [control]="myControl"></app-child>

// コピーではなく、同じオブジェクトを指すポインタを渡している
親.myControl === 子.control  // true
```

### だからコンポーネント階層化ができる

```
親 (FormGroupを作成・管理)
 ↓ 参照を渡す
中間 (FormGroupを受け取り、FormControlを抽出)
 ↓ 参照を渡す
孫 (FormControlを受け取り、値を変更)
 ↓ 同じオブジェクトを変更
親のFormGroupも自動的に更新される
```

### やってはいけないこと

```typescript
// ❌ 新しいオブジェクトを代入 (参照を上書き)
this.control = new FormControl(50);

// ✅ 同じオブジェクトの値を変更
this.control.setValue(50);
```

これが「FormControl/FormGroupを受け渡すことでコンポーネント階層化ができる」仕組みです！
