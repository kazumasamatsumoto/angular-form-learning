import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-form-builder-example',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    JsonPipe,
  ],
  templateUrl: './form-builder-example.html',
  styleUrl: './form-builder-example.scss',
})
export class FormBuilderExample {
  private fb = inject(FormBuilder);

  // FormBuilderを使った基本的なフォーム
  profileForm = this.fb.group({
    name: [''],
    email: [''],
    age: [0],
  });

  // バリデーション付きのフォーム
  registrationForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    agreeToTerms: [false, Validators.requiredTrue],
  });

  // FormArrayを使った動的フォーム
  skillsForm = this.fb.group({
    personalInfo: this.fb.group({
      name: ['', Validators.required],
      occupation: [''],
    }),
    skills: this.fb.array([this.createSkill()]),
  });

  createSkill() {
    return this.fb.group({
      skillName: [''],
      level: [''],
    });
  }

  get skills() {
    return this.skillsForm.get('skills') as any;
  }

  addSkill() {
    this.skills.push(this.createSkill());
  }

  removeSkill(index: number) {
    this.skills.removeAt(index);
  }

  // フォームの値を取得
  getProfileValue() {
    return this.profileForm.value;
  }

  getRegistrationValue() {
    return this.registrationForm.value;
  }

  getSkillsValue() {
    return this.skillsForm.value;
  }

  // バリデーションエラーを確認
  isRegistrationFormValid(): boolean {
    return this.registrationForm.valid;
  }

  // フォームをリセット
  resetProfileForm(): void {
    this.profileForm.reset();
  }

  resetRegistrationForm(): void {
    this.registrationForm.reset();
  }

  resetSkillsForm(): void {
    this.skillsForm.reset();
    // スキルを1つだけに戻す
    while (this.skills.length > 1) {
      this.skills.removeAt(1);
    }
  }

  // サンプルデータを入力
  fillProfileForm(): void {
    this.profileForm.patchValue({
      name: '山田太郎',
      email: 'yamada@example.com',
      age: 30,
    });
  }

  fillRegistrationForm(): void {
    this.registrationForm.patchValue({
      username: 'taro123',
      email: 'taro@example.com',
      password: 'password123',
      agreeToTerms: true,
    });
  }
}
