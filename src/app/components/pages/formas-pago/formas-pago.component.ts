import { Component, ViewChild } from '@angular/core';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { Popover, PopoverModule } from 'primeng/popover';

import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { PreloaderService } from '../../../services/preloader.service';
@Component({
  selector: 'app-formas-pago',
  imports: [
    AnimateOnScrollModule,
    PopoverModule,
    Popover,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
  ],
  templateUrl: './formas-pago.component.html',
})
export class FormasPagoComponent {
  @ViewChild('dep') deposito!: Popover;
  @ViewChild('tran') transferencia!: Popover;
  @ViewChild('otros') otros!: Popover;
  cuentaCopiada: boolean = false;

  constructor(private preloader: PreloaderService){
    this.preloader.actualizarClases(true)
  }

  protected toggleDeposito(event: any): void {
    this.cuentaCopiada = false;
    this.deposito.toggle(event);
  }

  protected toggleTransferencia(event: any): void {
    this.cuentaCopiada = false;
    this.transferencia.toggle(event);
  }

  protected toggleOtros(event: any): void {
    this.cuentaCopiada = false;
    this.otros.toggle(event);
  }
  protected abrirUbicacion(coordenadas: string): void {
    window.open(`https://google.es/maps?q=${coordenadas}`, '_blank');
  }
  protected copiarCuenta(infoCuenta: string): void {
    navigator.clipboard
      .writeText(infoCuenta)
      .then(() => this.cuentaCopiada = true)
      .catch((err) => console.error('Error al copiar el número de serie: ', err));
  }
}
