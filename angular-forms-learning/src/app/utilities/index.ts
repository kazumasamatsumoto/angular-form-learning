import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function noXssValidator(): ValidatorFn {
  const regex = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/?\w+[^>]*>?|&#?\w+;|javascript:/i;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const forbidden = regex.test(control.value);
    return forbidden ? { invalidXssPattern: true } : null
  }
}