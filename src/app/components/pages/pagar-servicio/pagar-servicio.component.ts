import { Component } from '@angular/core';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { PreloaderService } from '../../../services/preloader.service';

@Component({
  selector: 'app-pagar-servicio',
  imports: [AnimateOnScrollModule],
  templateUrl: './pagar-servicio.component.html',
  styleUrl: './pagar-servicio.component.scss'
})
export class PagarServicioComponent {
  constructor(private preloader: PreloaderService) {
    this.preloader.actualizarClases(true);
  }
}
