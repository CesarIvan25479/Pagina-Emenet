import { AfterViewInit, Component, HostListener, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapaCoberturaComponent } from '../mapa-cobertura/mapa-cobertura.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CarouselModule } from 'primeng/carousel';
import { Router } from '@angular/router';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { PreloaderService } from '../../../services/preloader.service';
import { UtilidadesService } from '../../../services/utilidades.service';
import { RatingModule } from 'primeng/rating';

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
    RatingModule,
    FormsModule,
    ReactiveFormsModule
  ],
})
export class HomeComponent{
  calificacion: number = 5
  constructor(public router: Router, private preloader: PreloaderService, public utilidades: UtilidadesService){
    preloader.actualizarClases(false);
  }
  banners = [
    {
      title: 'Planes pensados para tu hogar',
      description: 'Desde $300 al mes, consulta disponibilidad en tu zona',
      image: 'assets/principal/carrusel/atencion.png ',
    },
    {
      title: 'Internet de alta velocidad para tu empresa o servicios dedicados',
      description: 'Planes personalizados para cubrir las necesidades de tu negocio',
      image: ' assets/principal/carrusel/trabajadores.png',
    },
    {
      title: 'Cobertura en expansión',
      description: 'Consulta si ya contamos con cobertura en tu zona',
      image: 'assets/principal/carrusel/emenetauto.png',
    },
  ];

  public verCobertura(){
    const cobertura = document.getElementById('mapa-cobertura');
    if (cobertura) {
      window.scrollTo({
        top: cobertura.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  }
@HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollY = window.scrollY;
    const grid = document.querySelector('.grid-flow') as HTMLElement;
    if (grid) {
      // Movimiento parallax: el fondo se mueve a 1/5 de la velocidad del scroll
      grid.style.transform = `translateY(${scrollY * 0.2}px)`;
    }
  }

  testimonios = [
  {
    nombre: 'Alfredo Aureliano',
    plataforma: 'Google maps',
    comentario: 'Excelente Opción, si lo que buscas es calidad de servicio, brindan servicio de internet de Fibra Óptica donde otras empresas No y a precios muy accesibles dependiendo las necesidades (residencial o empresarial).',
    rating: 5
  },
  {
    nombre: 'J. M. C.',
    plataforma: 'Google maps',
    comentario: 'Muy buen servicio de Internet Cuando tengo alguna falla me solucionan muy rápido lo recomiendo mucho',
    rating: 5
  },
  {
    nombre: 'Beto Lozano',
    plataforma: 'Google maps',
    comentario: 'Excelente atención muy recomendable',
    rating: 5
  },
  {
    nombre: 'Gzmxs',
    plataforma: 'Google maps',
    comentario: 'Excelente servicio por parte del personal, los chic@s que atienden son muy amables, muy recomendable 👍🏻…',
    rating: 5
  },
  {
    nombre: 'Roberto R',
    plataforma: 'Google maps',
    comentario: 'Siempre que hablo o solicito ayuda me han atendido muy rápido y aunque el servicio que recibo está lejos de su negocio es bastante bueno',
    rating: 4
  },
];

// Configuración de respuesta para el carrusel
responsiveOptions = [
  { breakpoint: '1024px', numVisible: 3, numScroll: 1 },
  { breakpoint: '768px', numVisible: 2, numScroll: 1 },
  { breakpoint: '560px', numVisible: 1, numScroll: 1 }
];
}
