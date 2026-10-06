import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { RatingModule } from 'primeng/rating';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';

import { MapaCoberturaComponent } from '../../utility/mapa-cobertura/mapa-cobertura.component';
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
      tag: 'Presentación ISP',
      tabLabel: 'Nosotros',
      icono: 'pi pi-home',
      titleParte1: 'Conectamos tu mundo con la tecnología',
      titleParte2: 'más avanzada del mercado',
      description: 'Somos tu proveedor local de confianza, llevando internet de ultra alta velocidad, televisión y telefonía a donde otros no llegan.',
      image: 'template/muestra.jpg',
      statTitulo: 'Infraestructura Propia',
      statSubtitulo: 'Red de última generación con respaldo continuo',
      badgeTitulo: 'Tu Aliado Digital',
      badgeSubtitulo: 'Soporte técnico certificado y atención humana 100% local'
    },
    {
      tag: 'Internet por fibra óptica para tu hogar',
      tabLabel: 'Fibra óptica',
      icono: 'pi pi-globe',
      titleParte1: 'Servicio de internet en',
      titleParte2: 'tu domicilio',
      description: 'Conoce nuestros planes de internet y disfruta de una conexión estable y rápida para tu hogar.',
      image: 'template/instalacion.png',
      statTitulo: 'Conexión a través de fibra óptica',
      statSubtitulo: 'alta velocidad y estabilidad',
      badgeTitulo: 'Navegación ilimitada',
      badgeSubtitulo: 'Sin límites de descarga ni velocidad'
    },
    {
      tag: 'Servicio de telefonía IP',
      tabLabel: 'Telefonía',
      icono: 'pi pi-phone',
      titleParte1: 'Telefonía IP avanzada para tu',
      titleParte2: 'empresa o servicios de voz en la nube',
      description: 'Comunicación corporativa flexible, escalable y de alta definición para tu negocio.',
      image: 'template/muestra1.webp',
      statTitulo: 'Conmutador Virtual',
      statSubtitulo: 'Llamadas simultáneas sin saturar tu línea',
      badgeTitulo: 'Telefonía Inteligente',
      badgeSubtitulo: 'Reduce costos y conecta a tus sucursales en una sola red'
    },
    {
      tag: 'Servicio inalámbrico',
      tabLabel: 'Inalámbrico',
      icono: 'pi pi-wifi',
      titleParte1: 'Internet inalámbrico por',
      titleParte2: 'antena microondas de alta capacidad',
      description: 'Conexión estable, ideal para zonas con difícil acceso a fibra.',
      image: 'template/muestra2.jpg',
      statTitulo: 'Enlace Dedicado',
      statSubtitulo: 'Antena receptora de última generación',
      badgeTitulo: 'Máxima Cobertura',
      badgeSubtitulo: 'Llegamos a donde otros no pueden con tecnología punto a punto'
    },
    {
      tag: 'Televisión',
      tabLabel: 'Televisión',
      icono: 'pi pi-desktop',
      titleParte1: 'La mejor televisión digital para',
      titleParte2: 'toda tu familia',
      description: 'Disfruta de canales en alta definición, deportes en vivo y contenido exclusivo para todos los gustos.',
      image: 'template/muestra3.jpg',
      statTitulo: 'Más de 100 Canales',
      statSubtitulo: 'Señal digital con calidad HD y 4K',
      badgeTitulo: 'Entretenimiento Total',
      badgeSubtitulo: 'Pausa, retrocede y disfruta de tu programación favorita cuando quieras'
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
