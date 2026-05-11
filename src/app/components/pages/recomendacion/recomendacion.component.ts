import { CommonModule, } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, output, Output, SimpleChanges } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { UtilidadesService } from '../../../services/utilidades.service';

@Component({
  selector: 'app-recomendacion',
  imports: [
    FloatLabelModule,
    InputMaskModule,
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    ToggleButtonModule,
    InputNumberModule,
    AnimateOnScrollModule
  ],
  templateUrl: './recomendacion.component.html',
  // styleUrl: '../planes/planes.component.scss',
  styleUrls: ['./recomendacion.component.scss', '../planes/planes.component.scss']
})
export class RecomendacionComponent{
  formRecomendacion!: FormGroup;
  @Input() planes: any;
  @Output() enviarRecom = new EventEmitter<any>();
  @Output() codigoIft = new EventEmitter<any>();
  @Output() informacion = new EventEmitter<any>();
  @Output() observaciones = new EventEmitter<boolean>();
  planRecomendado: any;
  repetidor!: boolean;
  showForm: boolean = true;
  isLeaving: boolean = false;
  esResidencial: boolean = true

  constructor(fb: FormBuilder, protected utilidades: UtilidadesService) {
    this.formRecomendacion = fb.group({
      plantas: [null, [Validators.required]],
      habitaciones: [null, [Validators.required]],
      dispositivos: [null, [Validators.required]],
      contenido: [false, [Validators.required]],
    });
  }

  protected calcular() {
    if (this.dispositivos >= 15) {
      this.esResidencial = false;
      this.mostrarRecomedacion();
      return;
    }
    this.esResidencial = true;
    this.repetidor = this.necesitaRepetidor();
    this.planRecomendado = this.obtenerPlanBase(this.dispositivos);
    if(this.contenido){
      switch(this.planRecomendado.clave){
        case "PLAN100":
          this.planRecomendado = this.planes.find((plan: any) => plan.clave === 'PLAN200');
        break;
        case "PLAN200":
          this.planRecomendado = this.planes.find((plan: any) => plan.clave === 'PLAN300');
          break;
        case "PLAN300":
          this.planRecomendado = this.planes.find((plan: any) => plan.clave === 'PLAN500');
          break;
        case "PLAN500":
          this.esResidencial = false;
          break;
      }
    }
    this.mostrarRecomedacion();
  }

  private mostrarRecomedacion(){
    this.isLeaving = true;
    setTimeout(() => {
      this.showForm = false;

      if(this.esResidencial){
        setTimeout(() => {
          const cobertura = document.getElementById('cardRecomendado');
          if (cobertura) {
              window.scrollTo({
              top: cobertura.offsetTop + 20,
              behavior: 'smooth',
            });
          }
        },0)
      }

    }, 500);
  }

  protected necesitaRepetidor() {
    return this.plantas >= 2 || (this.plantas === 1 && this.habitaciones >= 3);
  }

  protected obtenerPlanBase(dispositivos: number):any{
    let planRecomendado;
    this.planes.forEach((plan: any) => {
      if (dispositivos >= plan.min && dispositivos <= plan.max) {
        planRecomendado = plan
      }
    });
    return planRecomendado;
  }

  protected llamarForm(){
    this.observaciones.emit(this.repetidor);
    this.enviarRecom.emit(this.planRecomendado);
  }

  protected colocarRuta(codigo: string){
    this.codigoIft.emit(codigo);
  }

  protected regresarForm(){
    this.showForm=true;
    this.isLeaving=false
    this.formRecomendacion.reset();
    this.formRecomendacion.patchValue({contenido: false})
  }

  get plantas(){
    return this.formRecomendacion.get('plantas')?.value;
  }

  get habitaciones(){
    return this.formRecomendacion.get('habitaciones')?.value;
  }

  get dispositivos(){
    return this.formRecomendacion.get('dispositivos')?.value;
  }

  get contenido(){
    return this.formRecomendacion.get("contenido")?.value;
  }
}
