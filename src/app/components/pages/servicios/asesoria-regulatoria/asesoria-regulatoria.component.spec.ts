import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsesoriaRegulatoriaComponent } from './asesoria-regulatoria.component';

describe('AsesoriaRegulatoriaComponent', () => {
  let component: AsesoriaRegulatoriaComponent;
  let fixture: ComponentFixture<AsesoriaRegulatoriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsesoriaRegulatoriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsesoriaRegulatoriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
