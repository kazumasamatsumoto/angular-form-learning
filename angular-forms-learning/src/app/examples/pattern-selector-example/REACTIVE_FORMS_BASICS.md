# Angular Reactive Forms 基礎解説

## FormControl、FormGroup、FormBuilder とは？

Angular のフォームには2つの方式があります:
- **Template-driven Forms**: テンプレート主体（`ngModel`を使う）
- **Reactive Forms**: TypeScript主体（`FormControl`, `FormGroup`を使う） ← 今回使用

---

## 1. FormControl とは？

### 一言で言うと
**単一の入力フィールドの値と状態を管理するオブジェクト**

### 具体例

```typescript
// FormControlの作成
const nameControl = new FormControl('山田太郎');

// 値を取得
console.log(nameControl.value);  // '山田太郎'

// 値を設定
nameControl.setValue('鈴木花子');

// 値を監視
nameControl.valueChanges.subscribe(value => {
  console.log('値が変わった:', value);
});
```

### FormControlが持つ情報

```typescript
const control = new FormControl(30);

// 値
control.value        // 30

// 状態
control.valid        // バリデーションが通っているか？
control.invalid      // バリデーションエラーがあるか？
control.dirty        // ユーザーが値を変更したか？
control.pristine     // まだ変更されていないか？
control.touched      // フォーカスが当たったか？
control.untouched    // まだフォーカスが当たっていないか？

// 値の変更を監視
control.valueChanges // Observable<number>
control.statusChanges // Observable<string>
```

### テンプレートでの使用

```html
<!-- FormControlを直接バインド -->
<input type="text" [formControl]="nameControl" />

<!-- 値を表示 -->
<p>現在の値: {{ nameControl.value }}</p>
```

### FormControlの完全な例

```typescript
import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

@Component({...})
export class ExampleComponent {
  // 初期値30、バリデーション付き
  ageControl = new FormControl(30, [
    Validators.required,
    Validators.min(0),
    Validators.max(100)
  ]);

  submit() {
    if (this.ageControl.valid) {
      console.log('年齢:', this.ageControl.value);
    }
  }
}
```

```html
<input type="number" [formControl]="ageControl" />

<div *ngIf="ageControl.invalid && ageControl.touched">
  <p *ngIf="ageControl.errors?.['required']">年齢は必須です</p>
  <p *ngIf="ageControl.errors?.['min']">0以上を入力してください</p>
  <p *ngIf="ageControl.errors?.['max']">100以下を入力してください</p>
</div>

<button (click)="submit()">送信</button>
```

---

## 2. FormGroup とは？

### 一言で言うと
**複数のFormControlをまとめて管理するオブジェクト（入れ物）**

### 具体例

```typescript
// FormGroupの作成
const userForm = new FormGroup({
  name: new FormControl('山田太郎'),
  age: new FormControl(30),
  email: new FormControl('yamada@example.com')
});

// 全体の値を取得
console.log(userForm.value);
// { name: '山田太郎', age: 30, email: 'yamada@example.com' }

// 特定のFormControlを取得
const nameControl = userForm.get('name');
console.log(nameControl.value);  // '山田太郎'

// 値をまとめて設定
userForm.setValue({
  name: '鈴木花子',
  age: 25,
  email: 'suzuki@example.com'
});

// 一部の値だけ設定
userForm.patchValue({
  age: 26  // name と email はそのまま
});
```

### FormGroupの構造

```typescript
FormGroup {
  value: { name: '山田太郎', age: 30, email: '...' },
  controls: {
    name: FormControl('山田太郎'),
    age: FormControl(30),
    email: FormControl('...')
  },
  valid: true,
  invalid: false,
  // ... その他の状態
}
```

### テンプレートでの使用

```html
<form [formGroup]="userForm">
  <input type="text" formControlName="name" />
  <input type="number" formControlName="age" />
  <input type="email" formControlName="email" />
</form>

<!-- 全体の値を表示 -->
<pre>{{ userForm.value | json }}</pre>
```

### ネストしたFormGroup

FormGroupの中にFormGroupを入れることもできます。

```typescript
const profileForm = new FormGroup({
  personalInfo: new FormGroup({
    firstName: new FormControl('太郎'),
    lastName: new FormControl('山田')
  }),
  contactInfo: new FormGroup({
    email: new FormControl('yamada@example.com'),
    phone: new FormControl('090-1234-5678')
  })
});

// ネストした値の取得
console.log(profileForm.value);
// {
//   personalInfo: { firstName: '太郎', lastName: '山田' },
//   contactInfo: { email: '...', phone: '...' }
// }

// ネストしたFormControlの取得
const firstNameControl = profileForm.get('personalInfo.firstName');
// または
const firstNameControl = profileForm.get('personalInfo')?.get('firstName');
```

---

## 3. FormBuilder とは？

### 一言で言うと
**FormGroupやFormControlを簡単に作るためのヘルパークラス**

### なぜFormBuilderを使うのか？

#### FormBuilderを使わない場合（冗長）

```typescript
const userForm = new FormGroup({
  name: new FormControl(''),
  age: new FormControl(0, Validators.required),
  email: new FormControl('', [Validators.required, Validators.email])
});
```

#### FormBuilderを使う場合（簡潔）

```typescript
import { FormBuilder } from '@angular/forms';

constructor(private fb: FormBuilder) {}

const userForm = this.fb.group({
  name: [''],  // 初期値だけ
  age: [0, Validators.required],  // [初期値, バリデーション]
  email: ['', [Validators.required, Validators.email]]  // [初期値, 複数のバリデーション]
});
```

### 完全な比較例

#### 方法1: new FormGroup を使う

```typescript
import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

export class UserFormComponent {
  userForm = new FormGroup({
    name: new FormControl('', Validators.required),
    age: new FormControl(0, [Validators.required, Validators.min(0)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    address: new FormGroup({
      street: new FormControl(''),
      city: new FormControl(''),
      zipCode: new FormControl('')
    })
  });
}
```

#### 方法2: FormBuilder を使う（推奨）

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

export class UserFormComponent {
  private fb = inject(FormBuilder);

  userForm = this.fb.group({
    name: ['', Validators.required],
    age: [0, [Validators.required, Validators.min(0)]],
    email: ['', [Validators.required, Validators.email]],
    address: this.fb.group({
      street: [''],
      city: [''],
      zipCode: ['']
    })
  });
}
```

### FormBuilderのメソッド

```typescript
// FormControl を作成
this.fb.control(初期値, バリデーション);

// FormGroup を作成
this.fb.group({
  フィールド名: [初期値, バリデーション]
});

// FormArray を作成（配列のフォーム）
this.fb.array([
  this.fb.control(''),
  this.fb.control('')
]);
```

---

## 実際のコード例: pattern-selector-example

### コード全体

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

interface PatternData {
  name: string;
  initialValues: { a: number; b: number; c: number; d: number };
}

@Component({...})
export class PatternSelectorExample implements OnInit {
  private fb = inject(FormBuilder);  // ← FormBuilderを注入

  patterns: PatternData[] = [
    { name: 'パターンA', initialValues: { a: 30, b: 50, c: 60, d: 100 } },
    { name: 'パターンB', initialValues: { a: 25, b: 30, c: 55, d: 87 } },
    { name: 'パターンC', initialValues: { a: 10, b: 40, c: 70, d: 90 } },
  ];

  // FormGroupの配列
  patternForms: FormGroup[] = [];

  ngOnInit(): void {
    // 各パターンごとにFormGroupを作成
    this.patternForms = this.patterns.map(pattern =>
      this.fb.group({  // ← FormBuilderでFormGroupを作成
        a: [pattern.initialValues.a],  // ← FormControlが自動作成される
        b: [pattern.initialValues.b],
        c: [pattern.initialValues.c],
        d: [pattern.initialValues.d],
      })
    );
  }
}
```

### 何が起きているか？

1. **FormBuilderの注入**
   ```typescript
   private fb = inject(FormBuilder);
   ```
   FormBuilderのインスタンスを取得

2. **FormGroupの作成**
   ```typescript
   this.fb.group({
     a: [30],
     b: [50],
     c: [60],
     d: [100]
   })
   ```
   これは以下と同じ意味:
   ```typescript
   new FormGroup({
     a: new FormControl(30),
     b: new FormControl(50),
     c: new FormControl(60),
     d: new FormControl(100)
   })
   ```

3. **配列への格納**
   ```typescript
   this.patternForms = [
     FormGroup { a: FormControl(30), b: FormControl(50), ... },
     FormGroup { a: FormControl(25), b: FormControl(30), ... },
     FormGroup { a: FormControl(10), b: FormControl(40), ... }
   ]
   ```

---

## 視覚的なイメージ

### FormControl = 単一の入力欄

```
┌─────────────────┐
│  FormControl    │
│  value: 30      │
│  valid: true    │
└─────────────────┘
     ↕
┌─────────────────┐
│ <input>         │
│  [value]="30"   │
└─────────────────┘
```

### FormGroup = 複数の入力欄をまとめたもの

```
┌──────────────────────────────────┐
│  FormGroup                       │
│  ┌────────────────────────────┐  │
│  │ a: FormControl(30)         │  │
│  │ b: FormControl(50)         │  │
│  │ c: FormControl(60)         │  │
│  │ d: FormControl(100)        │  │
│  └────────────────────────────┘  │
│  value: {a:30, b:50, c:60, d:100}│
└──────────────────────────────────┘
           ↕
┌──────────────────────────────────┐
│ <form [formGroup]="myForm">      │
│   <input formControlName="a">    │
│   <input formControlName="b">    │
│   <input formControlName="c">    │
│   <input formControlName="d">    │
│ </form>                          │
└──────────────────────────────────┘
```

### FormBuilder = FormGroupを簡単に作るツール

```
FormBuilder.group({...})
      ↓
   FormGroup {
     a: FormControl(30),
     b: FormControl(50),
     c: FormControl(60),
     d: FormControl(100)
   }
```

---

## よくある質問

### Q1: FormControlを直接使わずFormBuilderを使う理由は？

**A:** コードが簡潔になり、読みやすくなるから。

```typescript
// 直接作成: 冗長
new FormGroup({
  name: new FormControl('', Validators.required),
  age: new FormControl(0, Validators.min(0))
})

// FormBuilder: 簡潔
this.fb.group({
  name: ['', Validators.required],
  age: [0, Validators.min(0)]
})
```

### Q2: FormGroupの値はどうやって取得する？

**A:** `.value` プロパティを使う。

```typescript
const form = this.fb.group({
  name: ['太郎'],
  age: [30]
});

console.log(form.value);  // { name: '太郎', age: 30 }
```

### Q3: FormGroupから特定のFormControlを取得するには？

**A:** `.get()` メソッドを使う。

```typescript
const form = this.fb.group({
  name: ['太郎'],
  age: [30]
});

const nameControl = form.get('name');  // FormControl('太郎')
console.log(nameControl.value);  // '太郎'
```

### Q4: FormControlの値を変更するには？

**A:** `.setValue()` または `.patchValue()` を使う。

```typescript
const control = new FormControl('太郎');

// setValue: 値を完全に置き換え
control.setValue('花子');

// FormGroupの場合
const form = this.fb.group({ name: ['太郎'], age: [30] });

// setValue: 全フィールド必須
form.setValue({ name: '花子', age: 25 });

// patchValue: 一部だけ変更可能
form.patchValue({ age: 26 });  // name はそのまま
```

### Q5: FormControlの値の変更を監視するには？

**A:** `.valueChanges` を使う。

```typescript
const control = new FormControl('');

control.valueChanges.subscribe(value => {
  console.log('値が変わった:', value);
});

control.setValue('新しい値');  // → '値が変わった: 新しい値'
```

---

## まとめ

| クラス | 役割 | 例 |
|--------|------|-----|
| **FormControl** | 単一の入力フィールドを管理 | `new FormControl(30)` |
| **FormGroup** | 複数のFormControlをまとめる | `new FormGroup({ a: FormControl(30), b: ... })` |
| **FormBuilder** | FormGroupを簡単に作るヘルパー | `fb.group({ a: [30], b: [50] })` |

### データの流れ

```
FormBuilder
  ↓ fb.group({ a: [30], b: [50] })
FormGroup
  ↓ .get('a')
FormControl
  ↓ .value
30
```

### 実際の使用例

```typescript
// 1. FormBuilderで作成
const form = this.fb.group({
  a: [30],
  b: [50]
});

// 2. FormGroupから値を取得
console.log(form.value);  // { a: 30, b: 50 }

// 3. FormControlを取り出す
const aControl = form.get('a');  // FormControl(30)

// 4. FormControlの値を取得
console.log(aControl.value);  // 30

// 5. FormControlの値を変更
aControl.setValue(40);

// 6. FormGroupの値が自動的に更新される
console.log(form.value);  // { a: 40, b: 50 }
```

これが **FormBuilder**, **FormGroup**, **FormControl** の基本です！
