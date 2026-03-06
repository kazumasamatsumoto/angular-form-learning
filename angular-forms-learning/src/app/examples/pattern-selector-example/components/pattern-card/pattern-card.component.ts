import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { ParameterSliderComponent } from '../parameter-slider/parameter-slider.component';

@Component({
  selector: 'app-pattern-card',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatRadioModule,
    ParameterSliderComponent,
  ],
  templateUrl: './pattern-card.component.html',
  styleUrl: './pattern-card.component.scss',
})
export class PatternCardComponent {
  @Input({ required: true }) patternForm!: FormGroup;
  @Input({ required: true }) patternName!: string;
  @Input({ required: true }) patternIndex!: number;
  @Input({ required: true }) selectedPatternIndex!: number;
  @Input({ required: true }) onPatternSelect!: (index: number) => void;

  get isSelected(): boolean {
    return this.selectedPatternIndex === this.patternIndex;
  }

  // FormGroup内の各FormControlを取得
  getControl(fieldName: string): FormControl<number> {
    return this.patternForm.get(fieldName) as FormControl<number>;
  }

  selectPattern(): void {
    this.onPatternSelect(this.patternIndex);
  }
}
