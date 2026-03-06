import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { PatternCardComponent } from './components/pattern-card/pattern-card.component';

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
    CommonModule,
    MatCardModule,
    PatternCardComponent,
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

  // パターンの値を取得
  getPatternValues(patternIndex: number) {
    return this.patternForms[patternIndex].value;
  }

  // パターン選択のハンドラー
  onPatternSelect = (index: number): void => {
    this.selectedPatternIndex = index;
  };
}
