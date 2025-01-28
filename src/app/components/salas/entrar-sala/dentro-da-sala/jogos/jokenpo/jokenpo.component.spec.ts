import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JokenpoComponent } from './jokenpo.component';

describe('JokenpoComponent', () => {
  let component: JokenpoComponent;
  let fixture: ComponentFixture<JokenpoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JokenpoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JokenpoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
