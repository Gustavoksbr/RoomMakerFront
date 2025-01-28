import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuasSalasComponent } from './suas-salas.component';

describe('SuasSalasComponent', () => {
  let component: SuasSalasComponent;
  let fixture: ComponentFixture<SuasSalasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuasSalasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuasSalasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
