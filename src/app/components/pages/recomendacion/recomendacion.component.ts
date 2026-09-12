import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { UtilidadesService } from '../../../services/utilidades.service';

@Component({
  selector: 'app-recomendacion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FloatLabelModule,
    InputTextModule,
    ButtonModule,
    ToggleButtonModule,
    AnimateOnScrollModule
  ],
  templateUrl: './recomendacion.component.html',
  styleUrls: ['./recomendacion.component.scss']
})
export class RecomendacionComponent {
  @Input() planes: any[] = [];
  @Output() enviarRecom = new EventEmitter<any>();
  @Output() codigoIft = new EventEmitter<any>();
  @Output() informacion = new EventEmitter<boolean>();
  @Output() observaciones = new EventEmitter<boolean>();

  formRecomendacion: FormGroup;
  planRecomendado: any;
  repetidor = false;
  showForm = true;
  isLeaving = false;
  esResidencial = true;

  constructor(private fb: FormBuilder, protected utilidades: UtilidadesService) {
    this.formRecomendacion = this.fb.group({
      plantas: [null, [Validators.required, Validators.min(1)]],
      habitaciones: [null, [Validators.required, Validators.min(1)]],
      dispositivos: [null, [Validators.required, Validators.min(1)]],
      contenido: [false, [Validators.required]],
    });
  }

  protected calcular(): void {
    if (this.dispositivos >= 15) {
      this.esResidencial = false;
      this.mostrarRecomendacion();
      return;
    }

    this.esResidencial = true;
    this.repetidor = this.necesitaRepetidor();
    this.planRecomendado = this.obtenerPlanBase(this.dispositivos);

    if (this.contenido && this.planRecomendado) {
      switch (this.planRecomendado.clave) {
        case 'PLAN100':
          this.planRecomendado = this.planes.find((p) => p.clave === 'PLAN200');
          break;
        case 'PLAN200':
          this.planRecomendado = this.planes.find((p) => p.clave === 'PLAN300');
          break;
        case 'PLAN300':
          this.planRecomendado = this.planes.find((p) => p.clave === 'PLAN500');
          break;
        case 'PLAN500':
          this.esResidencial = false;
          break;
      }
    }

    this.mostrarRecomendacion();
  }

  private mostrarRecomendacion(): void {
    this.isLeaving = true;
    setTimeout(() => {
      this.showForm = false;
      if (this.esResidencial) {
        setTimeout(() => {
          const card = document.getElementById('cardRecomendado');
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }, 400);
  }

  protected necesitaRepetidor(): boolean {
    return this.plantas >= 2 || (this.plantas === 1 && this.habitaciones >= 3);
  }

  protected obtenerPlanBase(dispositivos: number): any {
    return this.planes.find((p) => dispositivos >= p.min && dispositivos <= p.max) || this.planes[0];
  }

  protected llamarForm(): void {
    this.observaciones.emit(this.repetidor);
    this.enviarRecom.emit(this.planRecomendado);
  }

  protected colocarRuta(plan: any): void {
    this.codigoIft.emit(plan);
  }

  protected regresarForm(): void {
    this.showForm = true;
    this.isLeaving = false;
    this.formRecomendacion.reset({ contenido: false });
  }

  get plantas(): number {
    return this.formRecomendacion.get('plantas')?.value || 1;
  }

  get habitaciones(): number {
    return this.formRecomendacion.get('habitaciones')?.value || 1;
  }

  get dispositivos(): number {
    return this.formRecomendacion.get('dispositivos')?.value || 1;
  }

  get contenido(): boolean {
    return !!this.formRecomendacion.get('contenido')?.value;
  }
}
