import { Component } from '@angular/core';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { PreloaderService } from '../../../services/preloader.service';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { SolicitudService } from '../../../services/solicitud.service';
import { firstValueFrom } from 'rxjs';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { PagarServicioService } from '../../../services/pagar-servicio.service';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DialogModule } from 'primeng/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { SkeletonModule } from 'primeng/skeleton';
import { EnviarMensajeService } from '../../../services/enviar-mensaje.service';
import { Router } from '@angular/router';
import { GenerarInvoiceService } from '../../../services/generar-invoice.service';
@Component({
  selector: 'app-pagar-servicio',
  imports: [
    AnimateOnScrollModule,
    IftaLabelModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    CommonModule,
    FormsModule,
    DividerModule,
    TagModule,
    InputGroupModule,
    InputGroupAddonModule,
    DialogModule,
    SkeletonModule,
],
  templateUrl: './pagar-servicio.component.html',
  styleUrl: './pagar-servicio.component.scss',
})
export class PagarServicioComponent {
  cliente: string = "";

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
  progreso!: boolean;
  progresoOrden!: boolean;
  errores: any = {
    dialog: false,
    mensaje: null
  };
  constructor(private preloader: PreloaderService,
    private pagarService: PagarServicioService,
    protected enviarService: EnviarMensajeService, private router: Router,
    private apiClients: SolicitudService, private fb: FormBuilder,
    private invoiceService: GenerarInvoiceService) {
    this.formInfo = fb.group({
      isUnique: [1, [Validators.required]],
      invoice: [null, [Validators.required]],
      cliente: [null, [Validators.required]],
      nombre: [null, [Validators.required]],
      apellido: [null, [Validators.required]],
      monto: [null, [Validators.required]],
      moneda: [null, [Validators.required]],
      // conexion: [true, [Validators.required]]
    });
    this.preloader.actualizarClases(true);
  }

  protected async buscar(): Promise<void>{
    try{
      this.progreso = true;
      const { cliente, servicios } = await firstValueFrom(this.apiClients.infoCliente(this.cliente));
      if(cliente.clasificacion === "BAJA"){
        this.errores = {
          dialog: true,
          mensaje: "Servicio cancelado, comunícate con nosotros para más información."
        };
        return;
      }

      const camaras = {
        precio: servicios.camaras ? servicios.camaras.precio : 0,
        cantidad: servicios.camaras ? servicios.camaras.canServicios : 0
      }

      const telefono = {
        precio: servicios.telefono ? servicios.telefono.precio : 0,
        cantidad: servicios.telefono ? servicios.telefono.canServicios : 0
      }

      const cuentasTv = {
        precio: servicios.cuentasTv ? servicios.cuentasTv.precio : 0,
        cantidad: servicios.cuentasTv ? servicios.cuentasTv.canServicios : 0
      }
      const costoMes = (camaras.precio * camaras.cantidad) +
      (cuentasTv.precio * cuentasTv.cantidad) +
      (telefono.precio * telefono.cantidad) +(servicios.internet.precio);

      const estadoCuenta = servicios.estadoCuenta;
      this.mesesPago = this.pagarService.generarMesesPendientes(estadoCuenta[estadoCuenta.length - 1].mensualidad, costoMes);
      // this.mesesPago = this.pagarService.generarMesesPendientes("ri", costoMes);
      this.pagoSeleccionados = this.mesesPago;
      if(this.mesesPago.length === 0){
        this.errores = {
          dialog: true,
          mensaje: "No es posible generar tu pago, por favor contáctanos para más información"
        };
        return;
      }
      this.calcularValores();
      const nombrePartes = cliente.nombre.split(" ");
      this.informacionPago = {
        ...this.informacionPago,
        cliente: cliente.cliente,
        invoice: this.invoiceService.generarInvoiceEncriptado(cliente.cliente, this.invoiceService.obtenerFechaActualFactura14()),
        nombre: nombrePartes[0],
        apellido: nombrePartes.length >= 3
          ? nombrePartes[nombrePartes.length - 2] + " " + nombrePartes[nombrePartes.length - 1]
          : nombrePartes.length === 2 ? nombrePartes[1] : nombrePartes[0],
        nombreOculto: this.pagarService.enmascararNombreLargo(cliente.nombre),
      }
    }catch(e){
      const mensaje = this.pagarService.codigosHttp(e as HttpErrorResponse);
      this.errores = {
        dialog: true,
        mensaje: mensaje
      };
    }finally{
      this.progreso = false;
    }
  }

  protected async linkPago(): Promise<void>{
    try{
      this.progresoOrden = true;
      this.formInfo.patchValue({...this.informacionPago})
      if(!this.formInfo.valid){
        this.errores = {
          dialog: true,
          mensaje: "No es posible generar tu pago, por favor contáctanos para más información"
        };
        return;
      }
      const { data } = await firstValueFrom(this.apiClients.generarLinkPago(this.formInfo.value));
      window.open(data.redirect_url)
    }catch(e){
      console.error(e)
      this.errores = {
        dialog: true,
        mensaje: "No es posible generar tu pago, por favor contáctanos para más información"
      };
    }finally{
      this.progresoOrden = false;
    }
  }


  calcularValores(){
    this.informacionPago.monto = this.pagoSeleccionados.reduce((suma: number, pago: any) => { return suma + pago.costo }, 0)
    this.informacionPago.invoice = this.calcularInvoice();
  }

  calcularInvoice(){
    const invoice = this.pagoSeleccionados.reduce((suma: string, pago: any) => {
        const mesanio = pago.mes.split(" ")
        return suma + mesanio[0]+"_"
    }, "");
    return invoice.slice(0,-1);
  }

  protected checkDesactivado(index: number): boolean {

    if (!this.mesesPago || this.mesesPago.length === 0) return true;
    if (!this.pagoSeleccionados || this.pagoSeleccionados.length === 0) {
      return index !== 0;
    }

    const nombresSeleccionados = this.pagoSeleccionados.map((m: any) => m.mes);

    const indicesSeleccionados = this.mesesPago
      .map((mes: any, i: number) => nombresSeleccionados.includes(mes.mes) ? i : -1)
      .filter((i: number) => i !== -1);

    if (indicesSeleccionados.length === 0) return index !== 0;

    const maxIndex = Math.max(...indicesSeleccionados);
    const esSeleccionado = nombresSeleccionados.includes(this.mesesPago[index].mes);

    if (esSeleccionado) {
      return index !== maxIndex;
    }

    return index !== maxIndex + 1;
  }
  protected formasPago(){
    this.router.navigate(['/formas-de-pago']);
  }
}

