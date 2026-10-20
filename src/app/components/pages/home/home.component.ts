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
import { inicializarAdaptacionMovil } from '../../../app.component';

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
  btnPrimary?: string;
  btnSecondary?: string;
  actionPrimary?: () => void;
  actionSecondary?: () => void;
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
  private cleanupAdaptacionMovil?: () => void;

  banners: BannerShowcase[] = [
    {
      tag: 'Sistema de administración ISP',
      tabLabel: 'e-isp & Neurexa',
      icono: 'pi pi-bolt',
      titleParte1: 'Administración integral de tu ISP con',
      titleParte2: 'automatización en tiempo real',
      description: 'Controla clientes, cortes y reconexiones automáticas, MikroTik, OLTs y monitoreo de red desde un solo lugar. Con e-isp y Neurexa.ai, tu soporte técnico, cobranza y atención 24/7 operan en diferentes canales.',
      image: 'template/eisp.png',
      statTitulo: 'Control Total de Red y Clientes',
      statSubtitulo: 'Gestión MikroTik, OLTs y cortes automáticos',
      badgeTitulo: 'Atención 24/7 Multicanal',
      badgeSubtitulo: 'Autogestión de pagos, reconexión inmediata y soporte autónomo',
      btnPrimary: "Conocer mas",
      btnSecondary: 'Planes Internet',
      actionPrimary: () => this.router.navigate(['servicios/e-isp']),
      actionSecondary: () => this.router.navigate(['/planes'])
    },
    {
      tag: 'Ingeniería y Configuración de Redes',
      tabLabel: 'Wisp e ISP',
      icono: 'pi pi-server',
      titleParte1: '¡Configuramos tu OLT y',
      titleParte2: 'optimizamos tu infraestructura de red!',
      description: 'Especialistas en diseño e implementación de redes FTTx, WISP y enlaces híbridos punto a punto y multipunto. Soporte y aprovisionamiento multimarca: Huawei, ZTE, MikroTik, Cisco, V-SOL, FiberHome, Ubiquiti, Arista y TP-Link.',
      image: 'template/configOlt.png',
      statTitulo: 'Despliegue FTTx & WISP',
      statSubtitulo: 'Diseño de redes híbridas y radioenlaces punto a punto',
      badgeTitulo: 'Compatibilidad Multimarca',
      badgeSubtitulo: 'Configuración de OLTs, switches y routers de alta gama',
      btnPrimary: "Conocer mas",
      btnSecondary: 'Planes Internet',
      actionPrimary: () => this.router.navigate(['servicios/isp']),
      actionSecondary: () => this.router.navigate(['/planes'])
    },
    {
      tag: 'Conectividad Empresarial y Carrier',
      tabLabel: 'Dedicados',
      icono: 'pi pi-map-marker',
      titleParte1: 'Enlaces dedicados y cruces fronterizos con',
      titleParte2: 'interconexión directa a Datacenters y Nube',
      description: 'Cobertura nacional en ciudades clave (CDMX, Guadalajara, Monterrey, Querétaro, Toluca, Tijuana) con cruces transfronterizos San Diego–Tijuana y Laredo–Monterrey. Conexión de baja latencia hacia Datacenters.',
      image: 'template/enlacesDedicados.png',
      statTitulo: 'Cruces Transfronterizos',
      statSubtitulo: 'San Diego–Tijuana y Laredo–Monterrey con baja latencia',
      badgeTitulo: 'Red Nacional e Interconexión',
      badgeSubtitulo: 'Salida directa a Datacenters, McAllen y almacenamiento en la nube',
      btnPrimary: "Conocer mas",
      btnSecondary: 'Planes Internet',
      actionPrimary: () => this.router.navigate(['servicios/isp']),
      actionSecondary: () => this.router.navigate(['/planes'])
    },
    {
      tag: 'Equipamiento e Identidad ISP',
      tabLabel: 'ONTs',
      icono: 'pi pi-wifi',
      titleParte1: 'ONTs y routers personalizados',
      titleParte2: 'con la marca de tu empresa',
      description: 'Fortalece la identidad de tu ISP con equipos serigrafiados con tu propio logotipo, firmware a la medida y presentación profesional para la instalación directa en el domicilio de tus clientes.',
      image: 'template/ont_web.png',
      statTitulo: 'ONTs con Marca Propia',
      statSubtitulo: 'Equipos serigrafiados con el logotipo de tu ISP',
      badgeTitulo: 'Identidad Corporativa',
      badgeSubtitulo: 'Presentación exclusiva en cada instalación de cliente',
      btnPrimary: "Conocer mas",
      btnSecondary: 'Planes Internet',
      actionPrimary: () => this.router.navigate(['servicios/ont-personalizadas']),
      actionSecondary: () => this.router.navigate(['/planes'])
    },
    {
      tag: 'Regulación y Cumplimiento Normativo',
      tabLabel: 'Gestión Regulatoria',
      icono: 'pi pi-shield',
      titleParte1: 'Cumplimiento normativo y regularización',
      titleParte2: 'para la operación de tu empresa de telecomunicaciones',
      description: 'Te asesoramos y gestionamos el cumplimiento de requisitos ante PROFECO, CFE, IAR México y CRT para garantizar una operación legal, segura y sin interrupciones en tu infraestructura WISP o ISP.',
      image: 'template/asesoria.png',
      statTitulo: 'Operación y Regularización',
      statSubtitulo: 'Cumplimiento legal de requisitos y normativas vigentes',
      badgeTitulo: 'Gestión Regulatoria',
      badgeSubtitulo: 'Trámites y convenios ante PROFECO, CFE, IAR México y CRT',
      btnPrimary: "Conocer mas",
      btnSecondary: 'Planes Internet',
      actionPrimary: () => this.router.navigate(['servicios/asesoria-regulatoria']),
      actionSecondary: () => this.router.navigate(['/planes'])
    },
    {
      tag: 'Seguridad y Protección Técnica',
      tabLabel: 'Seguridad',
      icono: 'pi pi-shield',
      titleParte1: 'Equipo de seguridad industrial',
      titleParte2: 'para personal técnico de tu ISP',
      description: 'Protege a tus cuadrillas en campo e instalaciones con equipo de protección personal certificado. Guantes de seguridad de alta durabilidad ELBETA y calzado dieléctrico DUTY GEAR diseñados para trabajos de planta externa, torres y tendido de fibra óptica.',
      image: 'template/seguridad.png',
      statTitulo: 'Protección Certificada',
      statSubtitulo: 'Guantes ELBETA y botas DUTY GEAR para trabajo pesado.',
      badgeTitulo: 'Seguridad en Campo',
      badgeSubtitulo: 'Equipamiento indispensable para cuadrillas e instalaciones ISP.',
      btnPrimary: "Conocer mas",
      btnSecondary: 'Planes Internet',
      actionPrimary: () => this.router.navigate(['servicios/equipo-seguridad']),
      actionSecondary: () => this.router.navigate(['/planes'])
    }
  ];

  ejecutarAccion(accion?: () => void): void {
    if (accion) {
      accion();
    }
  }

  testimonios = [
    {
      nombre: 'Usuario 1',
      comentario: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Officiis sed labore suscipit praesentium aliquam accusantium optio deleniti, doloremque quos nihil quia corporis hic? Iusto nisi dolores totam rem fugiat consequuntur!',
      rating: 5
    },
    {
      nombre: 'Usuario 2',
      comentario: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Officiis sed labore suscipit praesentium aliquam accusantium optio deleniti, doloremque quos nihil quia',
      rating: 5
    },
    {
      nombre: 'Usuario 3',
      comentario: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.  dolores totam rem fugiat consequuntur!',
      rating: 5
    },
    {
      nombre: 'Usuario 4',
      comentario: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. ',
      rating: 5
    },
    {
      nombre: 'Usuario 5',
      comentario: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Officiis sed labore suscipit praesentium aliquam accusantium optio deleniti, doloremque quos nihil quia corporis hic? Iusto nisi',
      rating: 5
    },
    {
      nombre: 'Usuario 6',
      comentario: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Officiis sed labore suscipit praesentium ',
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
    this.cleanupAdaptacionMovil = inicializarAdaptacionMovil();
    this.iniciarRotacionAutomatica();
    this.desordenarTestimonios();

  }

  ngOnDestroy(): void {
    this.detenerRotacionAutomatica();
    if (this.cleanupAdaptacionMovil) {
      this.cleanupAdaptacionMovil();
    }
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
    }, 10000);
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

  private desordenarTestimonios(): void {
    for (let i = this.testimonios.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.testimonios[i], this.testimonios[j]] = [this.testimonios[j], this.testimonios[i]];
    }
  }
}
