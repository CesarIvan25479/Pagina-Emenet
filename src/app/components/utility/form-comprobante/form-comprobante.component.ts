import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EnviarMensajeService } from '../../../services/enviar-mensaje.service';
import { CommonModule, DatePipe } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { InputMaskModule } from 'primeng/inputmask';
import { DialogModule } from 'primeng/dialog';
import { SolicitudService } from '../../../services/solicitud.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-form-comprobante',
  imports: [ReactiveFormsModule, CommonModule, CalendarModule, InputTextModule,
    InputNumberModule, ButtonModule, InputMaskModule, DialogModule
  ],
  providers: [DatePipe],
  templateUrl: './form-comprobante.component.html',
  styleUrl: './form-comprobante.component.scss'
})
export class FormComprobanteComponent implements OnChanges {
  subiendo: boolean = false;
  formaPagoSeleccionada: 'TRH' | 'DBH' = 'TRH';
  archivoComprobante: File | null = null;
  formComprobante!: FormGroup;

  @Input() cliente!: string;
  @Input() monto!: number;
  @Output() modalComprobante = new EventEmitter<boolean>();

  constructor(
    protected enviarService: EnviarMensajeService,
    protected apiPago: SolicitudService,
    protected datePipe: DatePipe,
    private fb: FormBuilder) {
    this.formComprobante = this.fb.group({
      cliente: [null, Validators.required],
      fechaPago: [new Date(), Validators.required],
      numOperacion: [null, Validators.required],
      telefono: [null, Validators.required],
      clave: ['TRH', Validators.required],
      monto: [null, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnChanges(): void {
      this.formComprobante.patchValue({
        cliente: this.cliente,
        monto: this.monto
      });
  }

  seleccionarFormaPago(tipo: 'TRH' | 'DBH'): void {
    this.formaPagoSeleccionada = tipo;
    this.formComprobante.patchValue({ formaPago: tipo });
  }

alSeleccionarArchivo(event: any): void {
  const file = event.target.files?.[0];
  if (file) {
    this.archivoComprobante = file;
  }
}

removerArchivo(): void {
  this.archivoComprobante = null;
}

protected  async enviarComprobante(): Promise<void> {
  if (this.formComprobante.invalid || !this.archivoComprobante) return;
  this.subiendo = true;
  const formData = new FormData();
  Object.keys(this.formComprobante.value).forEach(key => {
    formData.append(key, this.formComprobante.value[key]);
  });
  if (this.archivoComprobante) {
    formData.append('comprobante', this.archivoComprobante);
  }

  const fechaPago = this.datePipe.transform(this.formComprobante.get('fechaPago')?.value, 'yyyy-MM-dd');
  if (fechaPago) {
    formData.append('fechaPago', fechaPago);
  }

  try{
    const { folio } = await firstValueFrom(this.apiPago.pagosBanco(formData));
    this.formComprobante.reset();
    this.archivoComprobante = null;
    this.cliente = '';
    this.monto = 0;
    this.esExitoso = true;
    this.folioRegistro = folio;
  }catch(e: any){
    this.esExitoso = false;
    this.mensajeError = e.error.message
  }finally{
    this.mostrarResultadoDialog = true;
    this.subiendo = false;
  }
}
folioRegistro!: string;
mensajeError: string = ""
esExitoso!: boolean;
mostrarResultadoDialog!: boolean;
finalizar(){
this.modalComprobante.emit();
}

copiarFolio() {
  if (!this.folioRegistro) return;
  navigator.clipboard.writeText(this.folioRegistro);
}
}
