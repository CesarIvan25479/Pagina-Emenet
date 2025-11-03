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
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ComparacionPlanesComponent } from '../../shared/comparacion-planes/comparacion-planes.component';
import { RollingTextComponent } from '../../shared/rolling-text/rolling-text.component';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [
    CommonModule,
    CarouselModule,
    ButtonModule,
    TagModule,
    AnimateOnScrollModule,
    DialogModule,
    StepperModule,
    InputTextModule,
    PasswordModule,
    FloatLabelModule,
    TextareaModule,
    InputMaskModule,
    InputNumberModule,
    ConfirmDialogModule,
    FormsModule,
    ReactiveFormsModule,
    IftaLabelModule,
    RouterModule,
    ComparacionPlanesComponent,
    RollingTextComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './planes.component.html',
  styleUrl: './planes.component.scss',
})
export class PlanesComponent {
  // (Métodos de comparación ahora residen en el componente reusable)

  //Variables para mostrar PDF
  iftPlanes = false;
  errorPdf: boolean = false;
  rutaPdfPlan!: SafeResourceUrl;
  codigoSelect: string = '';

  planes: any = [
    {
      nombre: 'Plan 100 Megas',
      precio: 300.0,
      velocidadBajada: 100,
      velocidadSubida: 100,
      latencia: '15-25 ms',
      instalacionGratis: true,
      equipoIncluido: true,
      soporte24_7: true,
      dispositivosConectados: 10,
      caracteristicas: [
        {
          detalle: 'Velocidad 100 Mbps',
          descripcion: 'Ideal para navegación básica y redes sociales',
        },
        {
          detalle: 'Internet simétrico',
          descripcion: '100 Mbps de subida para compartir contenido sin esperas',
        },
        {
          detalle: 'Hasta 10 dispositivos',
          descripcion: 'Perfecto para 2-3 personas en el hogar',
        },
        {
          detalle: 'Soporte prioritario',
          descripcion: 'Atención personalizada para resolver tus dudas',
        },
      ]
    },
    {
      nombre: 'Plan 200 Megas',
      precio: 400.0,
      velocidadBajada: 200,
      velocidadSubida: 200,
      latencia: '10-20 ms',
      instalacionGratis: true,
      equipoIncluido: true,
      soporte24_7: true,
      dispositivosConectados: 15,
      caracteristicas: [
        {
          detalle: 'Velocidad 200 Mbps',
          descripcion: 'Perfecto para streaming en HD y videollamadas',
        },
        {
          detalle: 'Baja latencia',
          descripcion: '10-20ms para gaming y videoconferencias sin cortes',
        },
        {
          detalle: 'Hasta 15 dispositivos',
          descripcion: 'Ideal para hogares con múltiples usuarios',
        },
        {
          detalle: 'Router emenet',
          descripcion: 'Equipo de última generación incluido',
        },
      ]
    },
    {
      nombre: 'Plan 300 Megas',
      precio: 500.0,
      velocidadBajada: 300,
      velocidadSubida: 300,
      latencia: '8-15 ms',
      instalacionGratis: true,
      equipoIncluido: true,
      soporte24_7: true,
      dispositivosConectados: 20,
      caracteristicas: [
        {
          detalle: 'Velocidad 300 Mbps',
          descripcion: 'Experiencia premium para streaming 4K y gaming en línea',
        },
        {
          detalle: 'Ultra baja latencia',
          descripcion: '8-15ms para respuesta instantánea en tiempo real',
        },
        {
          detalle: 'Hasta 20 dispositivos',
          descripcion: 'Ideal para hogares con muchos dispositivos conectados',
        },
        {
          detalle: 'Soporte premium 24/7',
          descripcion: 'Asistencia prioritaria en cualquier momento',
        },
      ]
    },
    {
      nombre: 'Plan 500 Megas',
      precio: 600.0,
      velocidadBajada: 500,
      velocidadSubida: 500,
      latencia: '5-10 ms',
      instalacionGratis: true,
      equipoIncluido: true,
      soporte24_7: true,
      dispositivosConectados: 30,
      caracteristicas: [
        {
          detalle: 'Velocidad 500 Mbps',
          descripcion: 'La máxima velocidad para usuarios exigentes y teletrabajo',
        },
        {
          detalle: 'Latencia mínima',
          descripcion: '5-10ms para la mejor experiencia en tiempo real',
        },
        {
          detalle: 'Hasta 30 dispositivos',
          descripcion: 'Conexión estable para toda la familia y dispositivos inteligentes',
        },
        {
          detalle: 'Router emenet',
          descripcion: 'Equipo de última generación incluido',
        },
      ]
    },
    // {
    //   nombre: 'Plan 500 Megas',
    //   precio: 800.0,
    //   codigoIFT: 'IFT-1234',
    //   caracteristicas: [
    //     {
    //       detalle: 'Conexión por fibra óptica',
    //       descripcion: 'Tecnología de última generación para una conexión más rápida.',
    //     },
    //     {
    //       detalle: 'Datos ilimitados',
    //       descripcion: 'Sujeto a política de uso justo',
    //     },
    //     {
    //       detalle: 'Internet simetrico',
    //       descripcion: '500 Mbps de bajada y subiad',
    //     },
    //   ],
    // },
    // {
    //   nombre: 'Plan 1000 Megas',
    //   precio: 1400.0,
    //   codigoIFT: 'IFT-1234',
    //   caracteristicas: [
    //     {
    //       detalle: 'Conexión por fibra óptica',
    //       descripcion: 'Tecnología de última generación para una conexión más rápida.',
    //     },
    //     {
    //       detalle: 'Datos ilimitados',
    //       descripcion: 'Sujeto a política de uso justo',
    //     },
    //     {
    //       detalle: 'Internet simetrico',
    //       descripcion: '1000 Mbps de bajada y subida',
    //     },
    //   ],
    // },
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
    private preloader: PreloaderService,
    private route: ActivatedRoute
  ) {
    this.preloader.actualizarClases(true);

    // Abrir modal empresarial si viene desde el chatbot con ?modal=empresariales
    this.route.queryParams.subscribe((params) => {
      if (params && params['modal'] === 'empresariales') {
        setTimeout(() => this.formularioInformacion(), 300);
      }
    });
    
    // Respaldo: si existe marca en localStorage, abrir modal empresarial
    try {
      const abrir = localStorage.getItem('abrirModalEmpresarial');
      if (abrir === '1') {
        setTimeout(() => {
          this.formularioInformacion();
          localStorage.removeItem('abrirModalEmpresarial');
        }, 300);
      }
    } catch {}
    
    // Verificar si hay un plan seleccionado desde el chat
    const planChat = localStorage.getItem('planSeleccionadoChat');
    if (planChat) {
      try {
        const planSeleccionado = JSON.parse(planChat);
        // Buscar el plan completo en la lista de planes
        const planCompleto = this.planes.find((p: any) => p.nombre === planSeleccionado.nombre);
        if (planCompleto) {
          setTimeout(() => {
            this.formularioContrata(planCompleto);
            localStorage.removeItem('planSeleccionadoChat');
          }, 500);
        }
      } catch (e) {
        console.error('Error al procesar plan del chat:', e);
        localStorage.removeItem('planSeleccionadoChat');
      }
    }
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
        numScroll: 1,
      },
      {
        breakpoint: '1199px',
        numVisible: 3,
        numScroll: 1,
      },
      {
        breakpoint: '767px',
        numVisible: 2,
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
        clave: planSeleccionado.nombre,
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
