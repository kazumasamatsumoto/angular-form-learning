import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedForm {
  // BehaviorSubjectで値を管理（初期値は0）
  private valueSubject = new BehaviorSubject<number>(50);

  // Observableとして公開
  value$: Observable<number> = this.valueSubject.asObservable();

  // 現在の値を取得
  getValue(): number {
    return this.valueSubject.value;
  }

  // 値を更新
  setValue(value: number): void {
    this.valueSubject.next(value);
  }
}
