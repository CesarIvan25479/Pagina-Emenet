import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { PreloaderService } from '../../../services/preloader.service';
@Component({
  selector: 'app-test-velocidad',
  standalone: true,
  imports: [
    CommonModule,
    AnimateOnScrollModule
  ],
  templateUrl: './test-velocidad.component.html',
})
export class TestVelocidadComponent {
  constructor(private preloader: PreloaderService){
    this.preloader.actualizarClases(true);
  }
}
