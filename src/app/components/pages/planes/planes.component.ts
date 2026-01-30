import { Component, OnInit } from '@angular/core';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { DialogModule } from 'primeng/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { StepperModule } from 'primeng/stepper';
import { EnviarMensajeService } from '../../../services/enviar-mensaje.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TextareaModule } from 'primeng/textarea';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { SolicitudService } from '../../../services/solicitud.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { IftaLabelModule } from 'primeng/iftalabel';
import { PreloaderService } from '../../../services/preloader.service';

@Component({
  selector: 'app-planes',
  imports: [
    CarouselModule,
    ButtonModule,
    TagModule,
    CommonModule,
    AnimateOnScrollModule,
    DialogModule,
    StepperModule,
    InputTextModule,
    PasswordModule,
    FloatLabelModule,
    ReactiveFormsModule,
    TextareaModule,
    InputMaskModule,
    InputNumberModule,
    ConfirmDialogModule,
    IftaLabelModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './planes.component.html',
  styleUrl: './planes.component.scss',
})
export class PlanesComponent {

  //Variables para mostrar PDF
  iftPlanes = false;
  errorPdf: boolean = false;
  rutaPdfPlan!: SafeResourceUrl;
  codigoSelect: string = '';

  planes: any = [
    {
      nombre: 'Plan 100 Megas',
      velocidad: "100 Mbps Simétricos",
      precio: 300,
      codigoIFT: '2370932',
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
      ]
    },
    {
      nombre: 'Plan 150 Megas',
      velocidad: "150 Mbps Simétricos",
      precio: 350,
      codigoIFT: '2371195',
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
          descripcion: 'Velocidad mínima asegurada de 75 Mbps'
        }
      ]
    },
    {
      nombre: 'Plan 200 Megas',
      velocidad: "200 Mbps Simétricos",
      precio: 400,
      codigoIFT: '2371194',
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
      ]
    },
    {
      nombre: 'Plan 250 Megas',
      velocidad: "250 Mbps Simétricos",
      precio: 450,
      codigoIFT: '2371196',
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
          descripcion: 'Velocidad mínima asegurada de 125 Mbps'
        }
      ]
    },
    {
      nombre: 'Plan 300 Megas',
      velocidad: "300 Mbps Simétricos",
      precio: 500,
      codigoIFT: '2371197',
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
      ]
    },
    {
      nombre: 'Plan 400 Megas',
      velocidad: "400 Mbps Simétricos",
      precio: 550,
      codigoIFT: '2371198',
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
          descripcion: 'Velocidad mínima asegurada de 200 Mbps'
        }
      ]
    },
    {
      nombre: 'Plan 500 Megas',
      velocidad: "500 Mbps Simétricos",
      precio: 600,
      codigoIFT: '2371199',
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
      ]
    },
  ];

  responsiveOptions: any;
  modalContrata: boolean = false;
  activeStep: number = 1;
  formContrato: FormGroup;
  modalEnviado: boolean = false;

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient,
    protected enviarMensajeService: EnviarMensajeService,
    private fb: FormBuilder,
    private apiSolicitud: SolicitudService,
    private confirmationService: ConfirmationService,
    private preloader: PreloaderService
  ) {
    this.preloader.actualizarClases(true);
    this.formContrato = fb.group({
      domicilio: this.fb.group({
        codigoPostal: ['', [Validators.required, Validators.minLength(5)]],
        colonia: ['', [Validators.required, Validators.maxLength(150)]],
        calle: ['', [Validators.required, Validators.maxLength(150)]],
        numeroExterior: [''],
        municipio: ['', [Validators.required, Validators.maxLength(150)]],
        referencias: ['', [Validators.required, Validators.minLength(25)]],
        coordenadas: [''],
      }),
      datosPersonales: this.fb.group({
        nombre: ['',[Validators.required,Validators.minLength(5),Validators.maxLength(150),],],
        correo: ['',[Validators.required, Validators.email, Validators.maxLength(150)],],
        telefono: ['',[Validators.required,Validators.minLength(10),Validators.maxLength(12),],],
        telefono2: [''],
      }),
      plan: this.fb.group({
        nombre: ['' ],
        clave: ['' ],
        precio: [''],
        tipoServicio: [''],
      }),
    });
    this.responsiveOptions = [
      {
        breakpoint: '1400px',
        numVisible: 4,
        numScroll: 3,
      },
      {
        breakpoint: '1199px',
        numVisible: 3,
        numScroll: 3,
      },
      {
        breakpoint: '936px',
        numVisible: 2,
        numScroll: 2,
      },
      {
        breakpoint: '600px',
        numVisible: 1,
        numScroll: 1,
      },
      {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1,
      },
    ];
  }

  protected colocarRuta(codigoIFT: string): void{
    const ruta = `assets/legales/planes/${codigoIFT}.pdf`;
    this.http.head(ruta, { observe: 'response' })
      .pipe(finalize(() => (this.iftPlanes = true)))
      .subscribe({
        next: () => {
          this.errorPdf = false;
          this.codigoSelect = codigoIFT;
          this.rutaPdfPlan =
          this.sanitizer.bypassSecurityTrustResourceUrl(ruta);
        },
        error: () => (this.errorPdf = true),
      });
  }
  protected paginaIFT(): void {
    window.open('https://tarifas.ift.org.mx/ift_visor/', '_blank');
  }

  protected formularioContrata(plan: any): void {
    const planSeleccionado = plan;
    this.modalContrata = true;
    this.activeStep = 1;
    const coordenadas = localStorage.getItem('coordenadasCobertura');
    const datosGuardados = localStorage.getItem('direccionCobertura');

    this.formContrato.patchValue({
      plan: {
        nombre: planSeleccionado.nombre,
        valocidad: planSeleccionado.valocidad,
        clave: planSeleccionado.codigoIFT,
        precio: planSeleccionado.precio,
        tipoServicio: "Residencial"
      },
    });
    if (datosGuardados) {
      const datos = JSON.parse(datosGuardados);
      const municipio = datos.town || datos.village || datos.city || datos.county || '';
      const colonia = datos.neighbourhood || datos.suburb ||datos.hamlet || '' || datos.village;
      const calle = datos.road || datos.street || '';
      const codigoPostal = datos.postcode || '';
      this.formContrato.patchValue({
        domicilio: {
          codigoPostal: codigoPostal,
          colonia: colonia,
          calle: calle,
          municipio: municipio,
          coordenadas: coordenadas,
        },
      });
    }
  }

  protected formularioInformacion(){
    this.formContrato.reset();
    this.modalContrata = true;
    this.activeStep = 1;
    this.formContrato.patchValue({
      plan: {
        tipoServicio: "Empresarial"
      },
    });
  }


  protected confirmaSolicitud(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Estás seguro de enviar tu solicitud de contratación?',
      header: 'Confirmar solicitud',
      closable: true,
      closeOnEscape: true,
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Aceptar',
        severity: 'contrast',
      },
      accept: () => this.enviarSolicitud(),
    });
  }

  protected enviarSolicitud(): void{
    if(!this.formContrato.valid){
      alert("No se pudo procesar la información, Inténtalo de nuevo");
      this.activeStep = 1;
      return;
    };
    this.apiSolicitud.enviarSolicitud(this.formContrato.value).subscribe({
      next: () => {
        this.activeStep = 1;
        this.formContrato.reset();
        localStorage.removeItem('coordenadasCobertura');
        localStorage.removeItem('direccionCobertura');
        this.modalContrata = false;
        this.modalEnviado = true;
      },
      error: (error) => {
        console.error(error.error)
        alert("No se pudo procesar la información, Inténtalo de nuevo")
      },
    });
  }
}
