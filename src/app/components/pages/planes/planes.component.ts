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
      nombre: 'Plan 50 Megas',
      precio: 300.0,
      codigoIFT: 'IFT-1212059',
      caracteristicas: [
        {
          detalle: 'Conexión por fibra óptica',
          descripcion: '',
        },
        {
          detalle: 'Datos ilimitados',
          descripcion: '',
        },
        {
          detalle: '50 Mbps de descarga y bajada',
          descripcion: '',
        },
      ],
    },
    {
      nombre: 'Plan 75 Megas',
      precio: 400.0,
      codigoIFT: '1212060',
      caracteristicas: [
        {
          detalle: 'Conexión por fibra óptica',
          descripcion: '',
        },
        {
          detalle: 'Datos ilimitados',
          descripcion: '',
        },
        {
          detalle: '75 Mbps de descarga y bajada',
          descripcion: '',
        },
      ],
    },
    {
      nombre: 'Plan 100 Megas',
      precio: 500.0,
      codigoIFT: '1212059',
      caracteristicas: [
        {
          detalle: 'Conexión por fibra óptica',
          descripcion: '',
        },
        {
          detalle: 'Datos ilimitados',
          descripcion: '',
        },
        {
          detalle: '100 Mbps de descarga y bajada',
          descripcion: '',
        },
      ],
    },
    {
      nombre: 'Plan 200 Megas',
      precio: 600.0,
      codigoIFT: 'IFT-1234',
      caracteristicas: [
        {
          detalle: 'Conexión por fibra óptica',
          descripcion: '',
        },
        {
          detalle: 'Datos ilimitados',
          descripcion: '',
        },
        {
          detalle: '200 Mbps de descarga y bajada',
          descripcion: '',
        },
      ],
    },
    {
      nombre: 'Plan 500 Megas',
      precio: 800.0,
      codigoIFT: 'IFT-1234',
      caracteristicas: [
        {
          detalle: 'Conexión por fibra óptica',
          descripcion: '',
        },
        {
          detalle: 'Datos ilimitados',
          descripcion: '',
        },
        {
          detalle: '500 Mbps de descarga y bajada',
          descripcion: '',
        },
      ],
    },
    {
      nombre: 'Plan 1000 Megas',
      precio: 1400.0,
      codigoIFT: 'IFT-1234',
      caracteristicas: [
        {
          detalle: 'Conexión por fibra óptica',
          descripcion: '',
        },
        {
          detalle: 'Datos ilimitados',
          descripcion: '',
        },
        {
          detalle: '1000 Mbps de descarga y bajada',
          descripcion: '',
        },
      ],
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
    private confirmationService: ConfirmationService
  ) {
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
        nombre: ['', Validators.required],
        clave: ['', Validators.required],
        precio: ['', Validators.required],
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
        clave: planSeleccionado.codigoIFT,
        precio: planSeleccionado.precio,
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
        severity: 'info',
      },
      accept: () => this.enviarSolicitud(),
    });
  }

  protected enviarSolicitud(): void{
    this.apiSolicitud.enviarSolicitud(this.formContrato.value).subscribe({
      next: (response) => {
        this.activeStep = 1;
        this.formContrato.reset();
        localStorage.removeItem('coordenadasCobertura');
        localStorage.removeItem('direccionCobertura');
        this.modalContrata = false;
        this.modalEnviado = true;
      },
      error: (error) => {
        console.error(error)
        alert("No se pudo procesar la información, Intentalo de nuevo")
      },
    });
  }
}
