import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaioComponent } from './caio.component';

describe('CaioComponent', () => {
  let component: CaioComponent;
  let fixture: ComponentFixture<CaioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
