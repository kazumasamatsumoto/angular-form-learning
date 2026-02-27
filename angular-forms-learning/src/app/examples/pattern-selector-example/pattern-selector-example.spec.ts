import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternSelectorExample } from './pattern-selector-example';

describe('PatternSelectorExample', () => {
  let component: PatternSelectorExample;
  let fixture: ComponentFixture<PatternSelectorExample>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatternSelectorExample],
    }).compileComponents();

    fixture = TestBed.createComponent(PatternSelectorExample);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
