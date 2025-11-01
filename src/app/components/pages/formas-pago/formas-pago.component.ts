import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { PreloaderService } from '../../../services/preloader.service';
import { RollingTextComponent } from '../../shared/rolling-text/rolling-text.component';
@Component({
  selector: 'app-formas-pago',
  standalone: true,
  imports: [
    CommonModule,
    AnimateOnScrollModule,
    OverlayPanelModule,
    ToastModule,
    ButtonModule,
    RippleModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    RollingTextComponent,
  ],
  providers: [MessageService],
  templateUrl: './formas-pago.component.html',
  styleUrls: ['./formas-pago.component.scss'],
})
export class FormasPagoComponent {
  @ViewChild('dep') deposito!: OverlayPanel;
  @ViewChild('tran') transferencia!: OverlayPanel;
  @ViewChild('otros') otros!: OverlayPanel;
  @ViewChild('billpocket') billpocket!: OverlayPanel;
  cuentaCopiada: boolean = false;

  constructor(
    private preloader: PreloaderService,
    private messageService: MessageService
  ) {
    this.preloader.actualizarClases(true);
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

  protected toggleBillPocket(event: any): void {
    this.cuentaCopiada = false;
    this.billpocket.toggle(event);
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
