import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { JsonPipe } from '@angular/common';

// カスタムバリデータ: 禁止ワードチェック
function forbiddenWordValidator(forbiddenWords: string[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value?.toLowerCase();
    if (!value) return null;

    const hasForbiddenWord = forbiddenWords.some((word) =>
      value.includes(word.toLowerCase())
    );

    return hasForbiddenWord ? { forbiddenWord: { value } } : null;
  };
}

// カスタムバリデータ: パスワード確認
function passwordMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    return password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  };
}

// カスタムバリデータ: 電話番号形式チェック
function phoneNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const phoneRegex = /^0\d{1,4}-\d{1,4}-\d{4}$/;
    const valid = phoneRegex.test(control.value);
    return valid ? null : { invalidPhone: { value: control.value } };
  };
}

@Component({
  selector: 'app-validation-example',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatButtonModule,
    JsonPipe,
  ],
  templateUrl: './validation-example.html',
  styleUrl: './validation-example.scss',
})
export class ValidationExample {
  private fb = inject(FormBuilder);

  // 組み込みバリデータのフォーム
  builtInValidatorsForm = this.fb.group({
    required: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    minLength: ['', Validators.minLength(5)],
    maxLength: ['', Validators.maxLength(10)],
    pattern: ['', Validators.pattern(/^[0-9]+$/)],
    min: [0, Validators.min(18)],
    max: [0, Validators.max(100)],
  });

  // カスタムバリデータのフォーム
  customValidatorsForm = this.fb.group({
    username: ['', [Validators.required, forbiddenWordValidator(['admin', 'root', 'test'])]],
    phone: ['', [Validators.required, phoneNumberValidator()]],
  });

  // パスワード確認フォーム
  passwordForm = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator() }
  );

  // 複合バリデーションフォーム
  complexForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    age: [null, [Validators.required, Validators.min(0), Validators.max(150)]],
    website: ['', Validators.pattern(/^https?:\/\/.+/)],
  });

  getBuiltInValidatorsValue() {
    return this.builtInValidatorsForm.value;
  }

  getCustomValidatorsValue() {
    return this.customValidatorsForm.value;
  }

  getPasswordFormValue() {
    return this.passwordForm.value;
  }

  getComplexFormValue() {
    return this.complexForm.value;
  }

  resetBuiltInForm(): void {
    this.builtInValidatorsForm.reset();
  }

  resetCustomForm(): void {
    this.customValidatorsForm.reset();
  }

  resetPasswordForm(): void {
    this.passwordForm.reset();
  }

  resetComplexForm(): void {
    this.complexForm.reset();
  }

  // エラーメッセージを取得
  getErrorMessage(formGroup: any, controlName: string): string {
    const control = formGroup.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return '必須項目です';
    if (control.errors['email']) return '有効なメールアドレスを入力してください';
    if (control.errors['minlength'])
      return `最低${control.errors['minlength'].requiredLength}文字必要です`;
    if (control.errors['maxlength'])
      return `最大${control.errors['maxlength'].requiredLength}文字まで`;
    if (control.errors['pattern']) return '正しい形式で入力してください';
    if (control.errors['min']) return `${control.errors['min'].min}以上の値を入力してください`;
    if (control.errors['max']) return `${control.errors['max'].max}以下の値を入力してください`;
    if (control.errors['forbiddenWord']) return '使用できない単語が含まれています';
    if (control.errors['invalidPhone']) return '電話番号は0XX-XXXX-XXXXの形式で入力してください';

    return '';
  }

  getPasswordError(): string {
    if (this.passwordForm.errors?.['passwordMismatch']) {
      return 'パスワードが一致しません';
    }
    return '';
  }
}
