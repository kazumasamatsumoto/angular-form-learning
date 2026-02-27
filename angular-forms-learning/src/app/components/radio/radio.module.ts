import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RadioComponent } from "./radio.component";
import { MatRadioModule } from "@angular/material/radio";
import { TranslateModule } from "@ngx-translate/core"

@NgModule({
  declarations: [RadioComponent],
  imports: [CommonModule, MatRadioModule, TranslateModule],
  exports: [RadioComponent]
})
export class RadioModule { }