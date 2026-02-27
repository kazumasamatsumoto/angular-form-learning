import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedFormExample } from './shared-form-example';

describe('SharedFormExample', () => {
  let component: SharedFormExample;
  let fixture: ComponentFixture<SharedFormExample>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedFormExample],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedFormExample);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
