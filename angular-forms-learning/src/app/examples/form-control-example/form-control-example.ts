import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-form-control-example',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatButtonModule,
  ],
  templateUrl: './form-control-example.html',
  styleUrl: './form-control-example.scss',
})
export class FormControlExample {
  // 基本的なFormControl
  nameControl = new FormControl('');

  // 初期値を持つFormControl
  emailControl = new FormControl('example@example.com');

  // 数値のFormControl
  ageControl = new FormControl(0);

  // FormControlの値を取得
  getName(): string {
    return this.nameControl.value || '';
  }

  getEmail(): string {
    return this.emailControl.value || '';
  }

  getAge(): number {
    return this.ageControl.value || 0;
  }

  // FormControlの値を設定
  setName(name: string): void {
    this.nameControl.setValue(name);
  }

  // FormControlをリセット
  resetForm(): void {
    this.nameControl.reset();
    this.emailControl.reset('example@example.com');
    this.ageControl.reset(0);
  }
}
