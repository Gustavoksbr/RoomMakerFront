import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsestateComponent } from './usestate.component';

describe('UsestateComponent', () => {
  let component: UsestateComponent;
  let fixture: ComponentFixture<UsestateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsestateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsestateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
