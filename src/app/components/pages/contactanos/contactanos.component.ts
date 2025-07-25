import { Component } from '@angular/core';
import { PreloaderService } from '../../../services/preloader.service';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { InputMaskModule } from 'primeng/inputmask';
import { CommonModule } from '@angular/common';
import { SolicitudService } from '../../../services/solicitud.service';
import { finalize } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { EnviarMensajeService } from '../../../services/enviar-mensaje.service';

@Component({
  selector: 'app-contactanos',
  imports: [InputTextModule, TextareaModule, ButtonModule, FloatLabelModule,
    DialogModule,
    ReactiveFormsModule, InputMaskModule, CommonModule],
  templateUrl: './contactanos.component.html',
  styleUrl: './contactanos.component.scss'
})
export class ContactanosComponent {
  formContacto: FormGroup;
  progreso!: boolean;
  visibleEnviado!: boolean;
  constructor(private preloader: PreloaderService, private fb: FormBuilder,
    private apiSolicitud: SolicitudService,
    public enviarService: EnviarMensajeService
  ){
    preloader.actualizarClases(true);
    this.formContacto = fb.group({
      nombre: ["", [Validators.required]],
      telefono: ["", [Validators.required]],
      correo: ["", [Validators.required, Validators.email]],
      mensaje: ["", [Validators.required, Validators.minLength(25)]],
    });
  }
  enviarInfo(){
    if(!this.formContacto.valid) return;
    this.progreso = true;
    this.apiSolicitud.enviarCorreo(this.formContacto.value).pipe(
      finalize(() => this.progreso = false)
    ).subscribe({
      next: () => {
        this.visibleEnviado = true;
        this.formContacto.reset()
      },error: (error) => {
        console.error(error)
        alert("No se pudo procesar la información, Intentalo de nuevo")
      }
    });
  }
}
