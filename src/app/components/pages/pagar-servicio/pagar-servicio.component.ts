
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';

// Servicios
import { PreloaderService } from '../../../services/preloader.service';
import { SolicitudService } from '../../../services/solicitud.service';
import { PagarServicioService } from '../../../services/pagar-servicio.service';
import { EnviarMensajeService } from '../../../services/enviar-mensaje.service';
import { GenerarInvoiceService } from '../../../services/generar-invoice.service';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';

@Component({
  selector: 'app-pagar-servicio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    SkeletonModule, AnimateOnScrollModule
  ],
  templateUrl: './pagar-servicio.component.html',
  styleUrl: './pagar-servicio.component.scss',
})
export class PagarServicioComponent {
  tipoBusqueda: 'cliente' | 'nombre' = 'cliente';

  cliente: string = '';
  busquedaNombre: string = '';
  clientesEncontrados: any[] = [];
  progresoBusquedaNombre: boolean = false;

  formInfo: FormGroup;
  informacionPago: any = {
    isUnique: 1,
    invoice: null,
    cliente: null,
    nombre: null,
    apellido: null,
    monto: 0,
    moneda: 'MXN',
    nombreOculto: null,
  };

  pagoSeleccionados: any = [];
  mesesPago: any = [];
  progreso: boolean = false;
  progresoOrden: boolean = false;
  errores: any = {
    dialog: false,
    mensaje: null,
  };

  constructor(
    private preloader: PreloaderService,
    private pagarService: PagarServicioService,
    protected enviarService: EnviarMensajeService,
    private router: Router,
    private apiClients: SolicitudService,
    private fb: FormBuilder,
    private invoiceService: GenerarInvoiceService
  ) {
    this.formInfo = this.fb.group({
      isUnique: [1, [Validators.required]],
      invoice: [null, [Validators.required]],
      cliente: [null, [Validators.required]],
      nombre: [null, [Validators.required]],
      apellido: [null, [Validators.required]],
      monto: [null, [Validators.required]],
      moneda: [null, [Validators.required]],
    });
    this.preloader.actualizarClases(true);
  }

  cambiarTipoBusqueda(tipo: 'cliente' | 'nombre') {
    this.tipoBusqueda = tipo;
    this.clientesEncontrados = [];
    this.limpiar();
  }

  async buscar(): Promise<void> {
    if (!this.cliente) return;
    try {
      this.progreso = true;
      const { cliente, servicios } = await firstValueFrom(this.apiClients.infoCliente(this.cliente));

      if (cliente.clasificacion === 'BAJA') {
        this.errores = {
          dialog: true,
          mensaje: 'Servicio cancelado, comunícate con nosotros para más información.',
        };
        return;
      }



      const camaras = {
        precio: servicios.camaras ? servicios.camaras.precio : 0,
        cantidad: servicios.camaras ? servicios.camaras.canServicios : 0,
      };

      const telefono = {
        precio: servicios.telefono ? servicios.telefono.precio : 0,
        cantidad: servicios.telefono ? servicios.telefono.canServicios : 0,
      };

      const cuentasTv = {
        precio: servicios.cuentasTv ? servicios.cuentasTv.precio : 0,
        cantidad: servicios.cuentasTv ? servicios.cuentasTv.canServicios : 0,
      };

      const costoMes =
        camaras.precio * camaras.cantidad +
        cuentasTv.precio * cuentasTv.cantidad +
        telefono.precio * telefono.cantidad +
        servicios.internet.precio;

      const estadoCuenta = servicios.estadoCuenta;
      this.mesesPago = this.pagarService.generarMesesPendientes(
        estadoCuenta.length === 0 ? '' : estadoCuenta[estadoCuenta.length - 1].mensualidad,
        costoMes, estadoCuenta.length
      );

      this.pagoSeleccionados = [...this.mesesPago];
      if (this.mesesPago.length === 0) {
        this.errores = {
          dialog: true,
          mensaje: 'No tienes mensualidades pendientes por liquidar.',
        };
        return;
      }

      this.calcularValores();
      const nombrePartes = cliente.nombre.split(' ');
      this.informacionPago = {
        ...this.informacionPago,
        cliente: cliente.cliente,
        invoice: this.invoiceService.generarInvoiceEncriptado(
          cliente.cliente,
          this.invoiceService.obtenerFechaActualFactura14()
        ),
        nombre: nombrePartes[0],
        apellido:
          nombrePartes.length >= 3
            ? nombrePartes[nombrePartes.length - 2] + ' ' + nombrePartes[nombrePartes.length - 1]
            : nombrePartes.length === 2
            ? nombrePartes[1]
            : nombrePartes[0],
        nombreOculto: this.pagarService.enmascararNombreLargo(cliente.nombre),
      };
    } catch (e) {
      const mensaje = this.pagarService.codigosHttp(e as HttpErrorResponse);
      this.errores = {
        dialog: true,
        mensaje: mensaje,
      };
    } finally {
      this.progreso = false;
    }
  }

  async buscarPorNombre(): Promise<void> {
    if (!this.busquedaNombre || this.busquedaNombre.trim().length < 3) {
      this.errores = {
        dialog: true,
        mensaje: 'Escribe al menos 3 caracteres para buscar por nombre.',
      };
      return;
    }

    try {
      this.progresoBusquedaNombre = true;
      const { clientes }  = await firstValueFrom(this.apiClients.busquedaClientes({nombre: this.busquedaNombre.trim()}));
      this.clientesEncontrados = clientes;
      if (this.clientesEncontrados.length === 0) {
        this.errores = {
          dialog: true,
          mensaje: 'No se encontraron clientes con ese nombre. Intenta con tu número de cliente.',
        };
      }
    } catch (e) {
      this.errores = {
        dialog: true,
        mensaje: 'No se encontraron coincidencias para ese nombre.',
      };
    } finally {
      this.progresoBusquedaNombre = false;
    }
  }

  seleccionarCliente(c: any) {
    this.cliente = c.cliente || c.numeroCliente;
    this.clientesEncontrados = [];
    this.tipoBusqueda = 'cliente';
    this.buscar();
  }

  toggleMes(mes: any, index: number) {
    if (this.checkDesactivado(index)) return;

    const existe = this.pagoSeleccionados.some((m: any) => m.mes === mes.mes);
    if (existe) {
      this.pagoSeleccionados = this.pagoSeleccionados.filter((m: any) => m.mes !== mes.mes);
    } else {
      this.pagoSeleccionados = [...this.pagoSeleccionados, mes];
    }
    this.calcularValores();
  }

  calcularValores() {
    this.informacionPago.monto = this.pagoSeleccionados.reduce(
      (suma: number, pago: any) => suma + pago.costo,
      0
    );
  }

  checkDesactivado(index: number): boolean {
    if (!this.mesesPago || this.mesesPago.length === 0) return true;
    if (!this.pagoSeleccionados || this.pagoSeleccionados.length === 0) {
      return index !== 0;
    }

    const nombresSeleccionados = this.pagoSeleccionados.map((m: any) => m.mes);
    const indicesSeleccionados = this.mesesPago
      .map((mes: any, i: number) => (nombresSeleccionados.includes(mes.mes) ? i : -1))
      .filter((i: number) => i !== -1);

    if (indicesSeleccionados.length === 0) return index !== 0;

    const maxIndex = Math.max(...indicesSeleccionados);
    const esSeleccionado = nombresSeleccionados.includes(this.mesesPago[index].mes);

    if (esSeleccionado) {
      return index !== maxIndex;
    }

    return index !== maxIndex + 1;
  }

  limpiar() {
    this.informacionPago = {
      isUnique: 1,
      invoice: null,
      cliente: null,
      nombre: null,
      apellido: null,
      monto: 0,
      moneda: 'MXN',
      nombreOculto: null,
    };
    this.pagoSeleccionados = [];
    this.mesesPago = [];
    this.cliente = '';
    this.busquedaNombre = '';
    this.clientesEncontrados = [];
  }

  async linkPago(): Promise<void> {
    try {
      this.progresoOrden = true;
      this.formInfo.patchValue({ ...this.informacionPago });
      if (!this.formInfo.valid) {
        this.errores = {
          dialog: true,
          mensaje: 'No es posible generar tu pago, por favor contáctanos.',
        };
        return;
      }

      const { data } = await firstValueFrom(this.apiClients.generarLinkPago(this.formInfo.value));
      window.open(data.redirect_url);
    } catch (e) {
      this.errores = {
        dialog: true,
        mensaje: 'Ocurrió un error al contactar la pasarela bancaria. Intenta de nuevo.',
      };
    } finally {
      this.progresoOrden = false;
    }
  }

  formasPago() {
    this.router.navigate(['/formas-de-pago']);
  }
}
