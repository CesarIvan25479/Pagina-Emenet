import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class UtilidadesService {
  constructor(private router: Router) {}

  public rutaPlanes() {
    this.router.navigate(['/planes']);
    setTimeout(() => {
      const cobertura = document.getElementById('planes');
      if (cobertura) {
        window.scrollTo({
          top: cobertura.offsetTop - 0,
          behavior: 'smooth',
        });
      }
    }, 1000);
  }

  public rutaPlanesDirect() {
    const cobertura = document.getElementById('planes');
    if (cobertura) {
      window.scrollTo({
        top: cobertura.offsetTop - 0,
        behavior: 'smooth',
      });
    }
  }
}
