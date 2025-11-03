import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapaCoberturaComponent } from '../mapa-cobertura/mapa-cobertura.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CarouselModule } from 'primeng/carousel';
import { Router, RouterModule } from '@angular/router';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { PreloaderService } from '../../../services/preloader.service';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    MapaCoberturaComponent,
    CarouselModule,
    AnimateOnScrollModule,
    RouterModule
  ],
})
export class HomeComponent{
  constructor(public router: Router, private preloader: PreloaderService){
    preloader.actualizarClases(false);
    console.log('Banners generados:', this.banners);
  }
  private currentRound = 0;
  private sucursales = [
    {
      nombre: 'Santiago',
      imagenPrincipal: 'assets/sucursales/santiago sucursal.jpeg',
      imagenes: [
        'assets/sucursales/santiago1.jpeg',
        'assets/sucursales/santiago2.jpeg'
      ],
      descPrincipal: 'Atención cercana y soluciones rápidas en nuestra sucursal de Santiago.',
      desc1: 'Área de atención y recepción — te ayudamos a elegir tu plan ideal.',
      desc2: 'Equipo técnico listo para instalar y brindar soporte cuando lo necesites.'
    },
    {
      nombre: 'Santa Mónica',
      imagenPrincipal: 'assets/sucursales/santa monica sucursal.png',
      imagenes: [
        'assets/sucursales/santa monica2.jpeg',
        'assets/sucursales/santa monica3.jpeg'
      ],
      descPrincipal: 'Ubicación conveniente y asesoría personalizada en Santa Mónica.',
      desc1: 'Espacio de demostración — prueba la velocidad y estabilidad de nuestra red.',
      desc2: 'Zona de pagos y trámites pensada para tu comodidad.'
    },
    {
      nombre: 'Cholula',
      imagenPrincipal: 'assets/sucursales/cholula sucursal.png',
      imagenes: [
        'assets/sucursales/cholula2.jpeg',
        'assets/sucursales/cholula3.jpeg'
      ],
      descPrincipal: 'Conectividad confiable para tu hogar y negocio en Cholula.',
      desc1: 'Mostrador de servicio — resuelve tus dudas en minutos.',
      desc2: 'Back‑office y soporte — siempre listos para ayudarte.'
    }
  ];

  banners = this.generarBanners();

  private generarBanners() {
    const banners = [];
    
    // Ronda 1: Sucursales principales
    for (const sucursal of this.sucursales) {
      banners.push({
        title: `Visítanos en ${sucursal.nombre}`,
        description: sucursal.descPrincipal,
        image: this.getImageUrl(sucursal.imagenPrincipal),
        tipo: 'sucursal'
      });
    }
    
    // Ronda 2: Primera imagen adicional de cada sucursal
    for (const sucursal of this.sucursales) {
      banners.push({
        title: `Instalaciones de ${sucursal.nombre}`,
        description: sucursal.desc1,
        image: this.getImageUrl(sucursal.imagenes[0]),
        tipo: 'imagen1'
      });
    }
    
    // Ronda 3: Segunda imagen adicional de cada sucursal
    for (const sucursal of this.sucursales) {
      banners.push({
        title: `Atención en ${sucursal.nombre}`,
        description: sucursal.desc2,
        image: this.getImageUrl(sucursal.imagenes[1]),
        tipo: 'imagen2'
      });
    }
    
    return banners;
  }

  private getImageUrl(path: string): string {
    // Encode spaces and special characters in the URL
    return path.replace(/ /g, '%20');
  }

  public verCobertura(){
    const cobertura = document.getElementById('mapa-cobertura');
    if (cobertura) {
      window.scrollTo({
        top: cobertura.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  }

}
