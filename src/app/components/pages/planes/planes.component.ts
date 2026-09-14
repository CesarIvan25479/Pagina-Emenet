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
      clave: "PLAN100",
      nombre: 'Plan 100 Megas',
      velocidad: "100 Mbps Simétricos",
      precio: 300,
      codigoIFT: '2505493',
      min: 1, max: 4,
      caracteristicas: [
        {
          detalle: 'Esquema de pago',
          descripcion: 'Mensualidad fija por adelantado'
        },
        {
          detalle: 'Conexión por fibra óptica',
          descripcion: 'Infraestructura de fibra óptica (sujeto a disponibilidad y cobertura)'
        },
        {
          detalle: 'Datos ilimitados',
          descripcion: 'Sujeto a política de uso justo'
        },
        {
          detalle: 'Garantía de Servicio',
          descripcion: 'Velocidad mínima asegurada de 50 Mbps'
        }
      ],
      documento: '2505493.jpg',
      archivo: false
    },
    {
      clave: "PLAN200",
      nombre: 'Plan 200 Megas',
      velocidad: "200 Mbps Simétricos",
      precio: 400,
      codigoIFT: '2505496',
      min: 5, max: 7,
      caracteristicas: [
        {
          detalle: 'Esquema de pago',
          descripcion: 'Mensualidad fija por adelantado'
        },
        {
          detalle: 'Conexión por fibra óptica',
          descripcion: 'Infraestructura de fibra óptica (sujeto a disponibilidad y cobertura)'
        },
        {
          detalle: 'Datos ilimitados',
          descripcion: 'Sujeto a política de uso justo'
        },
        {
          detalle: 'Garantía de Servicio',
          descripcion: 'Velocidad mínima asegurada de 100 Mbps'
        }
      ],
      documento: '2505496.jpg',
      archivo: false
    },
    {
      clave: "PLAN300",
      nombre: 'Plan 300 Megas',
      velocidad: "300 Mbps Simétricos",
      precio: 500,
      codigoIFT: '2505877',
      min: 8, max: 10,
      caracteristicas: [
        {
          detalle: 'Esquema de pago',
          descripcion: 'Mensualidad fija por adelantado'
        },
        {
          detalle: 'Conexión por fibra óptica',
          descripcion: 'Infraestructura de fibra óptica (sujeto a disponibilidad y cobertura)'
        },
        {
          detalle: 'Datos ilimitados',
          descripcion: 'Sujeto a política de uso justo'
        },
        {
          detalle: 'Garantía de Servicio',
          descripcion: 'Velocidad mínima asegurada de 150 Mbps'
        }
      ],
      documento: '2505877.jpg',
      archivo: false
    },
    {
      clave: "PLAN500",
      nombre: 'Plan 500 Megas',
      velocidad: "500 Mbps Simétricos",
      precio: 600,
      codigoIFT: '2505890',
      min: 11, max: 14,
      caracteristicas: [
        {
          detalle: 'Esquema de pago',
          descripcion: 'Mensualidad fija por adelantado'
        },
        {
          detalle: 'Conexión por fibra óptica',
          descripcion: 'Infraestructura de fibra óptica (sujeto a disponibilidad y cobertura)'
        },
        {
          detalle: 'Datos ilimitados',
          descripcion: 'Sujeto a política de uso justo'
        },
        {
          detalle: 'Garantía de Servicio',
          descripcion: 'Velocidad mínima asegurada de 250 Mbps'
        }
      ],
      documento: '2505890.jpg',
      archivo: false
    },
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
