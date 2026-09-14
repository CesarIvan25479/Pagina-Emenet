import { Component } from '@angular/core';
import { PreloaderService } from '../../../services/preloader.service';
import { ButtonModule } from 'primeng/button';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-no-encontrado',
  imports: [ButtonModule, RouterModule],
  templateUrl: './no-encontrado.component.html',
})
export class NoEncontradoComponent {
  constructor(private preloader: PreloaderService, protected router: Router){
    this.preloader.actualizarClases(true)
  }
}
