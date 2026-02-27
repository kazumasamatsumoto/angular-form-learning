import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormBuilderExample } from './form-builder-example';

describe('FormBuilderExample', () => {
  let component: FormBuilderExample;
  let fixture: ComponentFixture<FormBuilderExample>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormBuilderExample],
    }).compileComponents();

    fixture = TestBed.createComponent(FormBuilderExample);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
