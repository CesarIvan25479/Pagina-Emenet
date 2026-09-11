import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputMaskModule } from 'primeng/inputmask';
import { DialogModule } from 'primeng/dialog';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';

import { PreloaderService } from '../../../services/preloader.service';
import { SolicitudService } from '../../../services/solicitud.service';
import { EnviarMensajeService } from '../../../services/enviar-mensaje.service';

@Component({
  selector: 'app-contactanos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    FloatLabelModule,
    InputMaskModule,
    DialogModule,
    AnimateOnScrollModule
  ],
  templateUrl: './contactanos.component.html',
  styleUrl: './contactanos.component.scss'
})
export class ContactanosComponent {
  formContacto: FormGroup;
  progreso = false;
  visibleEnviado = false;

  constructor(
    private preloader: PreloaderService,
    private fb: FormBuilder,
    private apiSolicitud: SolicitudService,
    public enviarService: EnviarMensajeService,
    public router: Router
  ) {
    this.preloader.actualizarClases(true);

    this.formContacto = this.fb.group({
      nombre: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      mensaje: ['', [Validators.required, Validators.minLength(25)]]
    });
  }

  enviarInfo(): void {
    if (this.formContacto.invalid || this.progreso) return;

    this.progreso = true;
    this.apiSolicitud.enviarCorreo(this.formContacto.value).pipe(
      finalize(() => (this.progreso = false))
    ).subscribe({
      next: () => {
        this.visibleEnviado = true;
        this.formContacto.reset();
        this.formContacto.markAsPristine();
        this.formContacto.markAsUntouched();
      },
      error: (error) => {
        console.error('Error al enviar correo:', error);
        alert('No se pudo procesar la información. Por favor, inténtalo de nuevo.');
      }
    });
  }
}
