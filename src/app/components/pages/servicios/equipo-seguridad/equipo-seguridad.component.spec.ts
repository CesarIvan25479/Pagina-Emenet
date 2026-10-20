import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipoSeguridadComponent } from './equipo-seguridad.component';

describe('EquipoSeguridadComponent', () => {
  let component: EquipoSeguridadComponent;
  let fixture: ComponentFixture<EquipoSeguridadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipoSeguridadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipoSeguridadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
