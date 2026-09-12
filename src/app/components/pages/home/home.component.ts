import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { RatingModule } from 'primeng/rating';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';

import { MapaCoberturaComponent } from '../mapa-cobertura/mapa-cobertura.component';
import { PreloaderService } from '../../../services/preloader.service';
import { UtilidadesService } from '../../../services/utilidades.service';

interface BannerShowcase {
  tag: string;
  tabLabel: string;
  icono: string;
  titleParte1: string;
  titleParte2: string;
  description: string;
  image: string;
  mobile?: boolean;
  pagina?: () => void;
  statTitulo: string;
  statSubtitulo: string;
  badgeTitulo: string;
  badgeSubtitulo: string;
}
@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CarouselModule,
    RatingModule,
    AnimateOnScrollModule,
    MapaCoberturaComponent
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  activoIndex = 0;
  pausado = false;
  private autoTimer: any;

  banners: BannerShowcase[] = [
    {
      tag: 'Telefonía Móvil',
      tabLabel: 'Móvil',
      icono: 'pi pi-mobile',
      titleParte1: 'Cambia de red y vive',
      titleParte2: 'más conectado',
      description: 'Descubre nuestra telefonía móvil, mejor cobertura, datos ilimitados y planes a tu medida.',
      image: 'assets/principal/carrusel/mobile.png',
      mobile: true,
      pagina: () => window.open('https://mobile.emenet.mx', '_blank'),
      statTitulo: 'Red 4.5G LTE',
      statSubtitulo: 'Cobertura nacional',
      badgeTitulo: 'Portabilidad',
      badgeSubtitulo: 'Conserva tu mismo número'
    },
    {
      tag: 'Internet residencial',
      tabLabel: 'Hogar',
      icono: 'pi pi-home',
      titleParte1: 'Planes pensados para',
      titleParte2: 'tu hogar',
      description: 'Desde $300 al mes, consulta disponibilidad en tu zona.',
      image: 'assets/principal/carrusel/atencion.png',
      statTitulo: 'Conexión por fibra óptica',
      statSubtitulo: 'Subida y bajada idéntica',
      badgeTitulo: 'Datos ilimitados',
      badgeSubtitulo: 'Sujeto a política de uso justo'
    },
    {
      tag: 'Servicios para tu empresa',
      tabLabel: 'Empresas',
      icono: 'pi pi-building',
      titleParte1: 'Internet de alta velocidad para tu',
      titleParte2: 'empresa o servicios dedicados',
      description: 'Planes personalizados para cubrir las necesidades de tu negocio.',
      image: 'assets/principal/carrusel/trabajadores.png',
      statTitulo: 'Internet dedicado',
      statSubtitulo: 'Alta disponibilidad y baja latencia',
      badgeTitulo: 'Soluciones a la medida',
      badgeSubtitulo: 'Diseñados para el ritmo y escala de tu negocio'
    },
    {
      tag: 'Cobertura',
      tabLabel: 'Cobertura',
      icono: 'pi pi-map',
      titleParte1: 'Cobertura en',
      titleParte2: 'expansión',
      description: 'Consulta en nuestro mapa interactivo si tu zona ya está activa.',
      image: 'assets/principal/carrusel/emenetauto.png',
      statTitulo: 'Soporte 24/7',
      statSubtitulo: 'Atención por WhatsApp con embot',
      badgeTitulo: 'Instalación Rápida',
      badgeSubtitulo: 'Atención técnica local'
    }
  ];

  testimonios = [
    {
      nombre: 'Alfredo Aureliano',
      comentario: 'Excelente opción si lo que buscas es calidad de servicio. Brindan servicio de internet de Fibra Óptica donde otras empresas no llegan y a precios muy accesibles.',
      rating: 5
    },
    {
      nombre: 'J. M. C.',
      comentario: 'Muy buen servicio de Internet. Cuando he tenido alguna duda me solucionan rápido por WhatsApp, lo recomiendo mucho.',
      rating: 5
    },
    {
      nombre: 'Beto Lozano',
      comentario: 'Excelente atención y estabilidad en el enlace. Muy recomendable para trabajo en casa.',
      rating: 5
    },
    {
      nombre: 'Gzmxs',
      comentario: 'Excelente servicio por parte del personal, los técnicos que acuden son muy amables y resuelven en el momento.',
      rating: 5
    },
    {
      nombre: 'Roberto R',
      comentario: 'Siempre que hablo o solicito ayuda me han atendido muy rápido. La conexión simétrica es bastante buena.',
      rating: 4
    }
  ];

  responsiveOptions = [
    { breakpoint: '1199px', numVisible: 3, numScroll: 1 },
    { breakpoint: '991px', numVisible: 2, numScroll: 1 },
    { breakpoint: '640px', numVisible: 1, numScroll: 1 }
  ];

  constructor(
    public router: Router,
    private preloader: PreloaderService,
    public utilidades: UtilidadesService
  ) {
    this.preloader.actualizarClases(false);
  }

  ngOnInit(): void {
    this.iniciarRotacionAutomatica();
  }

  ngOnDestroy(): void {
    this.detenerRotacionAutomatica();
  }

  get bannerActivo(): BannerShowcase {
    return this.banners[this.activoIndex];
  }

  seleccionarBanner(index: number): void {
    this.activoIndex = index;
    this.detenerRotacionAutomatica();
    this.iniciarRotacionAutomatica();
  }

  irAPagina(): void {
    if (this.bannerActivo.pagina) {
      this.bannerActivo.pagina();
    }
  }

  pausarAutoplay(): void {
    this.pausado = true;
    this.detenerRotacionAutomatica();
  }

  reanudarAutoplay(): void {
    this.pausado = false;
    this.iniciarRotacionAutomatica();
  }

  private iniciarRotacionAutomatica(): void {
    this.autoTimer = setInterval(() => {
      if (!this.pausado) {
        this.activoIndex = (this.activoIndex + 1) % this.banners.length;
      }
    }, 5000);
  }

  private detenerRotacionAutomatica(): void {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
    }
  }

  verCobertura(): void {
    const cobertura = document.getElementById('mapa-cobertura');
    if (cobertura) {
      cobertura.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
