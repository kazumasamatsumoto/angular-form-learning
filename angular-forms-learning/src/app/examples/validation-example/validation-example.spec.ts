import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidationExample } from './validation-example';

describe('ValidationExample', () => {
  let component: ValidationExample;
  let fixture: ComponentFixture<ValidationExample>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidationExample],
    }).compileComponents();

    fixture = TestBed.createComponent(ValidationExample);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
