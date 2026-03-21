import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { filter } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { PreloaderService } from '../../services/preloader.service';
import { DrawerModule } from 'primeng/drawer';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AccesibilidadService } from '../../services/accesibilidad.service';
import { EnviarMensajeService } from '../../services/enviar-mensaje.service';
import { SpeedDialModule } from 'primeng/speeddial';
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, MenubarModule, CommonModule, AccordionModule, AnimateOnScrollModule, ButtonModule, DialogModule,
    DrawerModule, ToggleSwitchModule, SpeedDialModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, AfterViewInit {
  items: MenuItem[] | undefined;
  actualYear: number;
  clases!:boolean;
  accesibilidad: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, protected  router: Router, public preloader: PreloaderService,
  private cdr: ChangeDetectorRef, private acceService: AccesibilidadService, public enviarService: EnviarMensajeService) {
    this.preloader.homePage$.subscribe((state) => {
      this.clases = state;
    });
    this.actualYear = new Date().getFullYear();
    this.items = [
      {
        label: 'Inicio',
        icon: 'pi pi-home',
        command: () => {
          this.router.navigate(['/']);
        }
      },
      {
        label: 'Planes',
        icon: 'pi pi-globe',
        command: () => {
          this.router.navigate(['/planes']);
        }
      },
      {
        label: 'Test de velocidad',
        icon: 'pi pi-cloud-download',
        command: () => {
          this.router.navigate(['/test-velocidad']);
        }
      },
      {
        label: 'Contáctanos',
        icon: 'pi pi-envelope',
        command: () => {
          // this.visibleContacto = true;
          this.router.navigate(["/contactanos"]);
        }
      },
      {
        label: 'Sobre nosotros',
        icon: 'pi pi-building',
        command: () => {
          this.router.navigate(["/sobre-nosotros"]);
        }
      },
      // {
      //   label: 'Formas de pago',
      //   icon: 'pi pi-credit-card',
      //   command: () => {
      //     this.router.navigate(['/formas-de-pago']);
      //   }
      // },
    ];
    this.menuDial = [
            {
                icon: 'pi pi-whatsapp',
                command: () => this.enviarService.enviarMensaje("Hola buen día", "7131334557")
            },
            {
                icon: 'pi pi-instagram',
                command: () => window.open('https://www.instagram.com/mnetandador?igsh=a2NybTRjYmNxcG01', '_blank')
            },
            {
                icon: 'pi pi-facebook',
                command: () => window.open('https://www.facebook.com/profile.php?id=100077917024450', '_blank')
            },
            {
                icon: 'pi pi-phone',
                command: () => this.enviarService.llamar('7131334557')
            },
        ];
  }

 ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.ajustarContenidoSegunPantalla.bind(this));
    }
  }

  ngAfterViewInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo(0, 0);
      });
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.ajustarContenidoSegunPantalla(), 1000);
    }
    setTimeout(() => {
      this.preloader.hide();
    }, 1000);

  }

  protected alternarContenido(event: Event): void {
    const icono = event.currentTarget as HTMLElement;
    icono.classList.toggle('girar');

    const contenedor = icono.closest('.bloque-alternar');
    if (!contenedor) return;

    const contenido = contenedor.querySelector('.alternar-contenido') as HTMLElement;
    if (!contenido) return;

    const estaExpandido = contenido.style.maxHeight && contenido.style.maxHeight !== '0px';

    if (estaExpandido) {
      contenido.style.maxHeight = '0';
    } else {
      contenido.style.maxHeight = contenido.scrollHeight + 'px';
    }
  }

  private ajustarContenidoSegunPantalla(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const contenidos = document.querySelectorAll<HTMLElement>('.alternar-contenido');
    contenidos.forEach((contenido) => {
      if (window.innerWidth >= 992) {
        contenido.style.maxHeight = contenido.scrollHeight + 'px';
      } else {
        contenido.style.maxHeight = '0';
      }
    });
  }

  opciones = [
    { texto: 'Crecer texto', icono: 'pi pi-plus', accion: () => this.acceService.incrementFont() },
    { texto: 'Reducir texto', icono: 'pi pi-minus', accion: () => this.acceService.decrementFont() },
    { texto: 'Escala de grises', icono: 'pi pi-palette', accion: () => this.acceService.grayScale() },
    { texto: 'Alto contraste', icono: 'pi pi-eye', accion: () => this.acceService.altContrast() },
    { texto: 'Contraste negativo', icono: 'pi pi-eye', accion: () => this.acceService.negativo() },
    { texto: 'Fondo claro', icono: 'pi pi-sun', accion: () => this.acceService.lightBackground() },
    { texto: 'Subrayar ligas', icono: 'pi pi-pencil', accion: () => this.acceService.underlineLinks() },
    { texto: 'Fuente legible', icono: 'pi pi-file-edit', accion: () => this.acceService.readableFont() },
    { texto: 'Reiniciar', icono: 'pi pi-refresh', accion: () => this.acceService.reiniciarValores() }
  ];

  menuDial: MenuItem[] | undefined;
  protected formasPago(){
    this.router.navigate(['/formas-de-pago']);
  }
  }
