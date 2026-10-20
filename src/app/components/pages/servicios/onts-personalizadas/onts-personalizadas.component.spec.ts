import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntsPersonalizadasComponent } from './onts-personalizadas.component';

describe('OntsPersonalizadasComponent', () => {
  let component: OntsPersonalizadasComponent;
  let fixture: ComponentFixture<OntsPersonalizadasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OntsPersonalizadasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntsPersonalizadasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
