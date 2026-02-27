import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormControlExample } from './form-control-example';

describe('FormControlExample', () => {
  let component: FormControlExample;
  let fixture: ComponentFixture<FormControlExample>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormControlExample],
    }).compileComponents();

    fixture = TestBed.createComponent(FormControlExample);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
