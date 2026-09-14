import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { StepperModule } from 'primeng/stepper';
import { TextareaModule } from 'primeng/textarea';
import { SolicitudService } from '../../../services/solicitud.service';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-form-contrata',
  imports: [
    StepperModule,
    FloatLabelModule,
    ReactiveFormsModule,
    CommonModule,
    InputTextModule,
    PasswordModule,
    TextareaModule,
    InputMaskModule,
    InputNumberModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './form-contrata.component.html',
  styleUrl: './form-contrata.component.scss',
})
export class FormContrataComponent {
  activeStep: number = 1;
  formContrato: FormGroup;
  repetidor!: boolean;
  modalEnviado!: boolean;
  @Output() emitModa = new EventEmitter<boolean>();

  constructor(private fb: FormBuilder, private confirmationService: ConfirmationService,private apiSolicitud: SolicitudService){
    this.formContrato = fb.group({
      domicilio: this.fb.group({
        codigoPostal: [null, [Validators.required, Validators.minLength(5)]],
        colonia: [null, [Validators.required, Validators.maxLength(150)]],
        calle: [null, [Validators.required, Validators.maxLength(150)]],
        numeroExterior: [null],
        municipio: [null, [Validators.required, Validators.maxLength(150)]],
        referencias: [null, [Validators.required, Validators.minLength(25)]],
        coordenadas: [null],
      }),
      datosPersonales: this.fb.group({
        nombre: [null,[Validators.required,Validators.minLength(5),Validators.maxLength(150),],],
        correo: [null,[Validators.required, Validators.email, Validators.maxLength(150)],],
        telefono: [null,[Validators.required,Validators.minLength(10),Validators.maxLength(12),],],
        telefono2: [null],
      }),
      plan: this.fb.group({
        nombre: [null],
        clave: [null],
        precio: [null],
        tipoServicio: [null],
        observaciones: [null],
      }),
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

  folioSolicitud!: number;
  protected async enviarSolicitud(): Promise<void>{
    if(!this.formContrato.valid){
      alert("No se pudo procesar la información, Inténtalo de nuevo");
      this.activeStep = 1;
      return;
    };
    try{
      const response = await firstValueFrom(this.apiSolicitud.enviarSolicitud(this.formContrato.value));
      this.folioSolicitud = response.id;
      console.log(response)
      this.activeStep = 1;
      this.formContrato.reset();
      localStorage.removeItem('coordenadasCobertura');
      localStorage.removeItem('direccionCobertura');
      this.emitModa.emit(false)
      this.modalEnviado = true;
    }catch(error){
      console.error(error)
      alert("No se pudo procesar la información, Inténtalo de nuevo");
    }
  }

  public formularioContrata(plan: any): void {
    const planSeleccionado = plan;
    this.activeStep = 1;
    const coordenadas = localStorage.getItem('coordenadasCobertura');
    const datosGuardados = localStorage.getItem('direccionCobertura');

    this.formContrato.patchValue({
      plan: {
        nombre: planSeleccionado.nombre,
        valocidad: planSeleccionado.valocidad,
        clave: planSeleccionado.codigoIFT,
        precio: planSeleccionado.precio,
        tipoServicio: "Residencial",
        observaciones: this.repetidor ? "Ofrecer repetidor" : null
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

  public formularioInformacion(){
    this.formContrato.reset();
    this.activeStep = 1;
    this.formContrato.patchValue({
      plan: {
        tipoServicio: "Empresarial"
      },
    });
  }

  public ofrecerRepetidor(rep: boolean){
    this.repetidor =  rep;
  }

}
