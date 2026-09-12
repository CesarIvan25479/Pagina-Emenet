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
      tag: 'TELEFONÍA MÓVIL',
      tabLabel: 'Móvil',
      icono: 'pi pi-mobile',
      titleParte1: 'Cambia de red y vive',
      titleParte2: 'más conectado',
      description: 'Descubre nuestra telefonía móvil con datos ilimitados, mejor cobertura nacional y planes prepago o pospago sin plazos forzosos.',
      image: 'assets/principal/carrusel/mobile.png',
      mobile: true,
      pagina: () => window.open('https://mobile.emenet.mx', '_blank'),
      statTitulo: 'Red 4.5G LTE',
      statSubtitulo: 'Cobertura nacional extendida',
      badgeTitulo: 'Portabilidad Express',
      badgeSubtitulo: 'Conserva tu mismo número'
    },
    {
      tag: 'INTERNET RESIDENCIAL',
      tabLabel: 'Hogar',
      icono: 'pi pi-home',
      titleParte1: 'Fibra óptica pura para',
      titleParte2: 'tu hogar',
      description: 'Planes simétricos desde $300 al mes. Navega, juega y haz streaming en 4K con la misma velocidad de subida y bajada.',
      image: 'assets/principal/carrusel/atencion.png',
      statTitulo: '100% Simétrico',
      statSubtitulo: 'Subida y bajada idéntica',
      badgeTitulo: 'Módem WiFi',
      badgeSubtitulo: 'Sin costo en comodato'
    },
    {
      tag: 'SERVICIOS DEDICADOS',
      tabLabel: 'Empresas',
      icono: 'pi pi-building',
      titleParte1: 'Conectividad crítica para',
      titleParte2: 'tu empresa',
      description: 'Enlaces dedicados simétricos 1:1, direccionamiento IP fija y soporte técnico preferencial vía NOC las 24 horas.',
      image: 'assets/principal/carrusel/trabajadores.png',
      statTitulo: 'SLA 99.8%',
      statSubtitulo: 'Disponibilidad garantizada',
      badgeTitulo: 'IP Fija Pública',
      badgeSubtitulo: 'Soporte NOC 24/7'
    },
    {
      tag: 'EXPANSIÓN DE RED',
      tabLabel: 'Cobertura',
      icono: 'pi pi-map',
      titleParte1: 'Nuestra red sigue',
      titleParte2: 'creciendo',
      description: 'Ampliamos continuamente nuestros anillos de fibra óptica. Consulta en nuestro mapa interactivo si tu calle ya está activa.',
      image: 'assets/principal/carrusel/emenetauto.png',
      statTitulo: 'Alta Densidad',
      statSubtitulo: 'Troncales de última milla',
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
    }, 7500);
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
