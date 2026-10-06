import { Component, OnInit, ViewChild } from '@angular/core';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { DialogModule } from 'primeng/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { EnviarMensajeService } from '../../../services/enviar-mensaje.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { IftaLabelModule } from 'primeng/iftalabel';
import { PreloaderService } from '../../../services/preloader.service';
import { RecomendacionComponent } from '../../utility/recomendacion/recomendacion.component';
import { FormContrataComponent } from '../../utility/form-contrata/form-contrata.component';

@Component({
  selector: 'app-planes',
  imports: [
    CarouselModule,
    ButtonModule,
    TagModule,
    CommonModule,
    AnimateOnScrollModule,
    DialogModule,
    ConfirmDialogModule,
    RecomendacionComponent,
    FormContrataComponent
],
  providers: [ConfirmationService, MessageService],
  templateUrl: './planes.component.html',
  styleUrl: './planes.component.scss',
})
export class PlanesComponent {
  iftPlanes!: boolean;
  errorPdf!: boolean;
  modalContrata!: boolean;
  repetidor!: boolean;
  rutaPdfPlan!: SafeResourceUrl;
  archivo!: boolean;
  codigoSelect: string = '';
  @ViewChild(FormContrataComponent) contratacion!: FormContrataComponent;
    planes: any = [
    {
      clave: "CONECTA_INI",
      nombre: 'Plan Inicio',
      velocidad: "80 Mbps Asimétricos",
      precio: 250,
      codigoIFT: '3104521',
      min: 1, max: 3,
      caracteristicas: [
        {
          detalle: 'Perfil de uso',
          descripcion: 'Ideal para navegación básica, redes sociales y teletrabajo ligero'
        },
        {
          detalle: 'Equipamiento',
          descripcion: 'Módem óptico estándar de última generación en comodato'
        },
        {
          detalle: 'Soporte Técnico',
          descripcion: 'Asistencia remota a través de canales digitales calificados'
        },
        {
          detalle: 'Umbral de Red',
          descripcion: 'Entrega mínima garantizada de 40 Mbps en descarga'
        }
      ],
      documento: '2505493.jpg',
      archivo: false
    },
    {
      clave: "HOGAR_EST",
      nombre: 'Plan Bienestar',
      velocidad: "150 Mbps Simétricos",
      precio: 350,
      codigoIFT: '3104522',
      min: 4, max: 6,
      caracteristicas: [
        {
          detalle: 'Facturación transparente',
          descripcion: 'Tarifa congelada sin cargos ocultos ni plazos forzosos'
        },
        {
          detalle: 'Uso recomendado',
          descripcion: 'Excelente rendimiento para clases en línea y video en HD'
        },
        {
          detalle: 'Estabilidad de enlace',
          descripcion: 'Inmunidad total a interferencias climáticas o electromagnéticas'
        },
        {
          detalle: 'Umbral de Red',
          descripcion: 'Entrega mínima garantizada de 75 Mbps estables'
        }
      ],
      documento: '2505496.jpg',
      archivo: false
    },
    {
      clave: "FAMILIA_PRO",
      nombre: 'Plan Conectividad',
      velocidad: "250 Mbps Simétricos",
      precio: 450,
      codigoIFT: '3104523',
      min: 7, max: 9,
      caracteristicas: [
        {
          detalle: 'Multidispositivo',
          descripcion: 'Optimizado para conectar múltiples pantallas y consolas a la vez'
        },
        {
          detalle: 'Tecnología Dual',
          descripcion: 'Router inteligente que gestiona bandas de 2.4 GHz y 5 GHz automáticamente'
        },
        {
          detalle: 'Descargas Masivas',
          descripcion: 'Transferencia de datos pesados en pocos minutos sin degradar tu red'
        },
        {
          detalle: 'Umbral de Red',
          descripcion: 'Entrega mínima garantizada de 125 Mbps síncronos'
        }
      ],
      documento: '2505877.jpg',
      archivo: false
    },
    {
      clave: "ULTRA_STREAM",
      nombre: 'Plan Stream',
      velocidad: "450 Mbps Simétricos",
      precio: 550,
      codigoIFT: '3104524',
      min: 10, max: 12,
      caracteristicas: [
        {
          detalle: 'Calidad de Video',
          descripcion: 'Priorización de tráfico para plataformas de streaming en Ultra HD'
        },
        {
          detalle: 'Servicio Continuo',
          descripcion: 'Monitoreo preventivo del nodo para evitar caídas de señal'
        },
        {
          detalle: 'Seguridad Digital',
          descripcion: 'Protección básica integrada contra accesos no autorizados al router'
        },
        {
          detalle: 'Umbral de Red',
          descripcion: 'Entrega mínima garantizada de 225 Mbps bajo contrato'
        }
      ],
      documento: '2505890.jpg',
      archivo: false
    },
    {
      clave: "GAMING_LEAGUE",
      nombre: 'Plan Élite',
      velocidad: "700 Mbps Simétricos",
      precio: 800,
      codigoIFT: '3104525',
      min: 13, max: 16,
      caracteristicas: [
        {
          detalle: 'Canal Dedicado',
          descripcion: 'Rutas de red optimizadas hacia los principales servidores de videojuegos'
        },
        {
          detalle: 'Hardware Avanzado',
          descripcion: 'Router Wi-Fi 6 de alta densidad para máxima cobertura inalámbrica'
        },
        {
          detalle: 'Latencia Mínima',
          descripcion: 'Rediseñado para ofrecer los menores milisegundos posibles en la zona'
        },
        {
          detalle: 'Umbral de Red',
          descripcion: 'Entrega mínima garantizada de 400 Mbps simétricos'
        }
      ],
      documento: '2505890.jpg',
      archivo: false
    },
    {
      clave: "EMPRESA_PYME",
      nombre: 'Plan Oficinas',
      velocidad: "120 Mbps Dedicados",
      precio: 950,
      codigoIFT: '3104526',
      min: 1, max: 8,
      caracteristicas: [
        {
          detalle: 'Acuerdo de Servicio',
          descripcion: 'SLA del 99.5% de disponibilidad mensual garantizada'
        },
        {
          detalle: 'Voz sobre IP',
          descripcion: 'Ancho de banda reservado para telefonía corporativa nítida'
        },
        {
          detalle: 'Soporte Comercial',
          descripcion: 'Ejecutivo técnico asignado y respuesta en sitio en menos de 3 horas'
        },
        {
          detalle: 'Umbral de Red',
          descripcion: 'Entrega mínima garantizada de 110 Mbps simétricos'
        }
      ],
      documento: '2505493.jpg',
      archivo: false
    },
    {
      clave: "CORP_MAX",
      nombre: 'Plan Infraestructura',
      velocidad: "1200 Mbps Empresariales",
      precio: 1500,
      codigoIFT: '3104527',
      min: 17, max: 40,
      caracteristicas: [
        {
          detalle: 'Alta Densidad',
          descripcion: 'Soporta infraestructura interna, servidores en la nube y VPNs masivas'
        },
        {
          detalle: 'Direccionamiento',
          descripcion: 'Incluye un bloque de direcciones IP estáticas utilizables'
        },
        {
          detalle: 'Mantenimiento VIP',
          descripcion: 'Ventanas de mantenimiento programadas fuera del horario laboral'
        },
        {
          detalle: 'Umbral de Red',
          descripcion: 'Entrega mínima garantizada de 900 Mbps en canal dedicado'
        }
      ],
      documento: '2505496.jpg',
      archivo: false
    }
  ];


  responsivePlanesOptions = [
    { breakpoint: '1280px', numVisible: 3, numScroll: 1 },
    { breakpoint: '992px', numVisible: 2, numScroll: 1 },
    { breakpoint: '576px', numVisible: 1, numScroll: 1 }
  ];

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    protected enviarMensajeService: EnviarMensajeService,
    private preloader: PreloaderService
  ) {
    this.preloader.actualizarClases(true);
  }
  protected colocarRuta(plan: any): void{
    if(!plan.archivo) {
      this.errorPdf = false;
      this.iftPlanes = true
      this.codigoSelect = plan.codigoIFT;
      this.rutaPdfPlan = `assets/legales/planes/${plan.documento}`;
      this.archivo = false;
    };
    const ruta = `assets/legales/planes/${plan.documento}`;
    this.http.head(ruta, { observe: 'response' })
      .pipe(finalize(() => (this.iftPlanes = true)))
      .subscribe({
      next: () => {
        this.errorPdf = false;
        this.codigoSelect = plan.codigoIFT;
        this.rutaPdfPlan =
        this.sanitizer.bypassSecurityTrustResourceUrl(ruta);
        this.archivo = true;
      },error: () => (this.errorPdf = true),
    });
  }
  protected paginaIFT(): void {
    window.open('https://tarifas.ift.org.mx/ift_visor/', '_blank');
  }
}
