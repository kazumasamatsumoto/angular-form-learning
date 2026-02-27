import { Routes } from '@angular/router';
import { FormControlExample } from './examples/form-control-example/form-control-example';
import { FormGroupExample } from './examples/form-group-example/form-group-example';
import { FormBuilderExample } from './examples/form-builder-example/form-builder-example';
import { ValidationExample } from './examples/validation-example/validation-example';
import { SharedFormExample } from './examples/shared-form-example/shared-form-example';
import { PatternSelectorExample } from './examples/pattern-selector-example/pattern-selector-example';

export const routes: Routes = [
  { path: '', redirectTo: '/form-control', pathMatch: 'full' },
  { path: 'form-control', component: FormControlExample },
  { path: 'form-group', component: FormGroupExample },
  { path: 'form-builder', component: FormBuilderExample },
  { path: 'validation', component: ValidationExample },
  { path: 'shared-form', component: SharedFormExample },
  { path: 'pattern-selector', component: PatternSelectorExample },
];
