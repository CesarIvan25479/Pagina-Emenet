import { Component, ViewChild, OnInit, AfterViewInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { Popover, PopoverModule } from 'primeng/popover';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PreloaderService } from '../../../services/preloader.service';
import { MapaSucursalComponent } from '../../utility/mapa-sucursal/mapa-sucursal.component';

@Component({
  selector: 'app-formas-pago',
  standalone: true,
  imports: [
    CommonModule,
    AnimateOnScrollModule,
    PopoverModule,
    Popover,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    MapaSucursalComponent,
    RouterLink
  ],
  templateUrl: './formas-pago.component.html',
  styleUrl: './formas-pago.component.scss',
})
export class FormasPagoComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dep') deposito!: Popover;
  @ViewChild('tran') transferencia!: Popover;
  @ViewChild('otros') otros!: Popover;
  cuentaCopiada: boolean = false;
  private routeSub?: Subscription;

  constructor(
    private preloader: PreloaderService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.preloader.actualizarClases(true);
  }

  ngOnInit(): void {
    this.routeSub = this.route.fragment.subscribe((fragment) => {
      if (fragment === 'pago-presencial' || fragment === 'sucursales' || fragment === 'pago-presencial-sucursal') {
        this.scrollearAPresencial();
      }
    });
  }

  ngAfterViewInit(): void {
    const fragment = this.route.snapshot.fragment;
    if (fragment === 'pago-presencial' || fragment === 'sucursales' || fragment === 'pago-presencial-sucursal') {
      this.scrollearAPresencial();
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private scrollearAPresencial(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      const el = document.getElementById('pago-presencial-sucursal');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 350);
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
      .then(() => (this.cuentaCopiada = true))
      .catch((err) => console.error('Error al copiar: ', err));
  }

  protected formasPago() {
    this.router.navigate(['/pagar-servicio']);
  }
}
