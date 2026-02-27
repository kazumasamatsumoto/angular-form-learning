import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormGroupExample } from './form-group-example';

describe('FormGroupExample', () => {
  let component: FormGroupExample;
  let fixture: ComponentFixture<FormGroupExample>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormGroupExample],
    }).compileComponents();

    fixture = TestBed.createComponent(FormGroupExample);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
