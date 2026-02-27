import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-form-group-example',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatButtonModule,
    JsonPipe,
  ],
  templateUrl: './form-group-example.html',
  styleUrl: './form-group-example.scss',
})
export class FormGroupExample {
  // FormGroupで複数のFormControlをグループ化
  userForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl(''),
    phone: new FormControl(''),
  });

  // ネストされたFormGroup
  addressForm = new FormGroup({
    personalInfo: new FormGroup({
      name: new FormControl(''),
      age: new FormControl(0),
    }),
    address: new FormGroup({
      zipCode: new FormControl(''),
      prefecture: new FormControl(''),
      city: new FormControl(''),
    }),
  });

  // フォームの値を取得
  getUserFormValue() {
    return this.userForm.value;
  }

  getAddressFormValue() {
    return this.addressForm.value;
  }

  // フォームをリセット
  resetUserForm(): void {
    this.userForm.reset();
  }

  resetAddressForm(): void {
    this.addressForm.reset();
  }

  // 特定のコントロールにアクセス
  getFirstName(): string {
    return this.userForm.get('firstName')?.value || '';
  }

  // フォームの状態を確認
  isUserFormValid(): boolean {
    return this.userForm.valid;
  }

  // フォーム全体の値を一度に設定
  fillUserForm(): void {
    this.userForm.setValue({
      firstName: '太郎',
      lastName: '山田',
      email: 'taro@example.com',
      phone: '090-1234-5678',
    });
  }

  // 一部の値だけを設定
  fillAddressForm(): void {
    this.addressForm.patchValue({
      personalInfo: {
        name: '花子',
        age: 25,
      },
      address: {
        prefecture: '東京都',
      },
    });
  }
}
