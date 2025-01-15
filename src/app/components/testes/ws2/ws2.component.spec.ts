import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ws2Component } from './ws2.component';

describe('Ws2Component', () => {
  let component: Ws2Component;
  let fixture: ComponentFixture<Ws2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ws2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ws2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
