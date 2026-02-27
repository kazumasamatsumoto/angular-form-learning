import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { JsonPipe } from '@angular/common';

// パターンデータの型定義
interface PatternData {
  name: string;
  initialValues: {
    a: number;
    b: number;
    c: number;
    d: number;
  };
}

@Component({
  selector: 'app-pattern-selector-example',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatSliderModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatButtonModule,
    MatRadioModule,
    JsonPipe,
  ],
  templateUrl: './pattern-selector-example.html',
  styleUrl: './pattern-selector-example.scss',
})
export class PatternSelectorExample implements OnInit {
  private fb = inject(FormBuilder);

  // パターンのデータ定義
  patterns: PatternData[] = [
    {
      name: 'パターンA',
      initialValues: { a: 30, b: 50, c: 60, d: 100 },
    },
    {
      name: 'パターンB',
      initialValues: { a: 25, b: 30, c: 55, d: 87 },
    },
    {
      name: 'パターンC',
      initialValues: { a: 10, b: 40, c: 70, d: 90 },
    },
  ];

  // 各パターンのフォーム
  patternForms: FormGroup[] = [];

  // 選択されたパターンのインデックス
  selectedPatternIndex: number = 0;

  ngOnInit(): void {
    // 各パターンごとに独立したフォームを作成
    this.patternForms = this.patterns.map(pattern =>
      this.fb.group({
        a: [pattern.initialValues.a],
        b: [pattern.initialValues.b],
        c: [pattern.initialValues.c],
        d: [pattern.initialValues.d],
      })
    );
  }

  // スライダーの値が変更されたとき
  onSliderChange(patternIndex: number, paramName: string, value: number): void {
    this.patternForms[patternIndex].get(paramName)?.setValue(value, { emitEvent: false });
  }

  // 入力フィールドの値が変更されたとき
  onInputChange(patternIndex: number, paramName: string, event: any): void {
    const value = Number(event.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      this.patternForms[patternIndex].get(paramName)?.setValue(value, { emitEvent: false });
    }
  }

  // パターンの値を取得
  getPatternValues(patternIndex: number) {
    return this.patternForms[patternIndex].value;
  }

  // パターンをリセット
  resetPattern(patternIndex: number): void {
    const pattern = this.patterns[patternIndex];
    this.patternForms[patternIndex].patchValue({
      a: pattern.initialValues.a,
      b: pattern.initialValues.b,
      c: pattern.initialValues.c,
      d: pattern.initialValues.d,
    });
  }

  // 全パターンの値を取得
  getAllPatternValues() {
    return this.patterns.map((pattern, index) => ({
      pattern: pattern.name,
      values: this.getPatternValues(index)
    }));
  }

  // パターンを選択
  selectPattern(index: number): void {
    this.selectedPatternIndex = index;
  }

  // 選択されたパターンの値を取得
  getSelectedPatternValues() {
    return {
      selectedPattern: this.patterns[this.selectedPatternIndex].name,
      values: this.getPatternValues(this.selectedPatternIndex)
    };
  }
}
