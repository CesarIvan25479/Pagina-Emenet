import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreloaderService } from '../../../services/preloader.service';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';

@Component({
  selector: 'app-sobre-nosotros',
  standalone: true,
  imports: [
    CommonModule,
    AnimateOnScrollModule
  ],
  templateUrl: './sobre-nosotros.component.html',
})
export class SobreNosotrosComponent {
  constructor(private preloader: PreloaderService) {
    this.preloader.actualizarClases(true);
  }
}
