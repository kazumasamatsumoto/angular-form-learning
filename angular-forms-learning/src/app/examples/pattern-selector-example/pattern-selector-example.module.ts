import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

import { PatternSelectorExampleModule as PatternSelectorExampleComponent } from './pattern-selector-example-module';
import { PatternCardComponent } from './components/pattern-card/pattern-card.component';
import { ParameterSliderComponent } from './components/parameter-slider/parameter-slider.component';

@NgModule({
  declarations: [
    PatternSelectorExampleComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    PatternCardComponent,
    ParameterSliderComponent,
  ],
  exports: [
    PatternSelectorExampleComponent
  ]
})
export class PatternSelectorExampleModule { }
