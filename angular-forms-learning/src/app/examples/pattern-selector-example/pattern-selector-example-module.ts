import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

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
  templateUrl: './pattern-selector-example.html',
  styleUrls: ['./pattern-selector-example.scss'],
  standalone: false
})
export class PatternSelectorExampleModule implements OnInit {
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

  constructor(private fb: FormBuilder) { }

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

  // スライダーの値が変更されたときにフォームを更新
  updateValue(patternIndex: number, field: string, value: number): void {
    this.patternForms[patternIndex].patchValue({
      [field]: value
    });
  }

  // 全パターンの値を取得（一括登録用）
  getAllPatternValues() {
    return this.patterns.map((pattern, index) => ({
      pattern: pattern.name,
      enabled: this.selectedPatternIndex === index,
      values: this.getPatternValues(index)
    }));
  }

  // 選択されたパターンの値を取得
  getSelectedPatternValues() {
    return {
      selectedPattern: this.patterns[this.selectedPatternIndex].name,
      values: this.getPatternValues(this.selectedPatternIndex)
    };
  }
}
