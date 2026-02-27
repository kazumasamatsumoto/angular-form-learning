import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { SharedForm } from '../../services/shared-form';

@Component({
  selector: 'app-shared-form-example',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatSliderModule,
  ],
  templateUrl: './shared-form-example.html',
  styleUrl: './shared-form-example.scss',
})
export class SharedFormExample implements OnInit {
  // FormControlを作成
  valueControl = new FormControl(50);

  constructor(private sharedFormService: SharedForm) {}

  ngOnInit(): void {
    // サービスから初期値を取得
    this.valueControl.setValue(this.sharedFormService.getValue());

    // FormControlの値が変更されたらサービスに通知
    this.valueControl.valueChanges.subscribe((value) => {
      if (value !== null) {
        this.sharedFormService.setValue(value);
      }
    });

    // サービスの値が変更されたらFormControlを更新
    this.sharedFormService.value$.subscribe((value) => {
      if (this.valueControl.value !== value) {
        this.valueControl.setValue(value, { emitEvent: false });
      }
    });
  }

  // スライダーの値が変更されたとき
  onSliderChange(event: any): void {
    const value = event.value;
    this.sharedFormService.setValue(value);
  }

  // 入力フィールドの値が変更されたとき
  onInputChange(event: any): void {
    const value = Number(event.target.value);
    if (!isNaN(value)) {
      this.sharedFormService.setValue(value);
    }
  }
}
