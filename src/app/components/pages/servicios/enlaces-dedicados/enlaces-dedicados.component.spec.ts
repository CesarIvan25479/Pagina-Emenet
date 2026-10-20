import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnlacesDedicadosComponent } from './enlaces-dedicados.component';

describe('EnlacesDedicadosComponent', () => {
  let component: EnlacesDedicadosComponent;
  let fixture: ComponentFixture<EnlacesDedicadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnlacesDedicadosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnlacesDedicadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
