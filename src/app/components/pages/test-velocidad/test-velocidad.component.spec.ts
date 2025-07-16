import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestVelocidadComponent } from './test-velocidad.component';

describe('TestVelocidadComponent', () => {
  let component: TestVelocidadComponent;
  let fixture: ComponentFixture<TestVelocidadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestVelocidadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestVelocidadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
