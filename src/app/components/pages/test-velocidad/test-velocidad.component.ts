import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { SplittingTextComponent } from '../../shared/splitting-text/splitting-text.component';
import { PreloaderService } from '../../../services/preloader.service';
import { PrimeIcons } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-test-velocidad',
  standalone: true,
  imports: [
    CommonModule,
    AnimateOnScrollModule,
    SplittingTextComponent,
    TooltipModule
  ],
  templateUrl: './test-velocidad.component.html',
})
export class TestVelocidadComponent {
  constructor(private preloader: PreloaderService){
    this.preloader.actualizarClases(true);
  }
}
