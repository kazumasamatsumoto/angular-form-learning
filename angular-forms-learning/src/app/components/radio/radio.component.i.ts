import { TemplateRef } from "@angular/core";

export interface RadioButton {
  name: string;
  value: string;
  templateRef?: TemplateRef<unknown>
  isDisable?: boolean;
}