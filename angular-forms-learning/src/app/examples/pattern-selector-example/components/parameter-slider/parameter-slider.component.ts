import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-parameter-slider',
  standalone: true,
  imports: [ReactiveFormsModule, MatSliderModule],
  templateUrl: './parameter-slider.component.html',
  styleUrl: './parameter-slider.component.scss',
})
export class ParameterSliderComponent {
  @Input({ required: true }) control!: FormControl<number>;
  @Input({ required: true }) label!: string;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;

  updateValue(value: number): void {
    this.control.setValue(value);
  }
}
