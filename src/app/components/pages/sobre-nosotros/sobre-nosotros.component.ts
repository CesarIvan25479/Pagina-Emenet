import { Component } from '@angular/core';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { PreloaderService } from '../../../services/preloader.service';

@Component({
  selector: 'app-sobre-nosotros',
  imports: [ButtonModule],
  styleUrl: "./sobre-nosotros.component.scss",
  templateUrl: './sobre-nosotros.component.html',
})
export class SobreNosotrosComponent {
  constructor(
    private preloader: PreloaderService,
    public router: Router
  ) {
    this.preloader.actualizarClases(true);
  }
}
