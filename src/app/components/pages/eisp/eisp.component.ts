import { Component } from '@angular/core';
import { PreloaderService } from '../../../services/preloader.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-eisp',
  imports: [],
  templateUrl: './eisp.component.html',
  styleUrl: './eisp.component.scss'
})
export class EispComponent {
  constructor(private preloader: PreloaderService, protected router: Router){
    setTimeout(() => {
      console.log("Se debio ocultar")
      this.preloader.hide();
    }, 1000);
  }
}
