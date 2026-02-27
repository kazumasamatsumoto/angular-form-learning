import { TestBed } from '@angular/core/testing';

import { SharedForm } from './shared-form';

describe('SharedForm', () => {
  let service: SharedForm;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedForm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
