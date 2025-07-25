import { Component } from '@angular/core';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { PreloaderService } from '../../../services/preloader.service';

@Component({
  selector: 'app-sobre-nosotros',
  imports: [AnimateOnScrollModule],
  templateUrl: './sobre-nosotros.component.html',
})
export class SobreNosotrosComponent {
  constructor(private preloader: PreloaderService) {
    this.preloader.actualizarClases(true);
  }
}
