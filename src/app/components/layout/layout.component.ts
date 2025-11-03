import { AfterViewInit, ChangeDetectorRef, Component, HostListener, Inject, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { AccordionModule } from 'primeng/accordion';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { PreloaderService } from '../../services/preloader.service';
import { WebglLiquidComponent } from '../shared/webgl-liquid/webgl-liquid.component';
import { AccesibilidadComponent } from '../shared/accesibilidad/accesibilidad.component';
import { ChatBotComponent } from '../shared/chat-bot/chat-bot.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    MenubarModule, 
    CommonModule, 
    AccordionModule, 
    AnimateOnScrollModule, 
    ButtonModule, 
    DialogModule,
    RouterOutlet,
    RouterLink,
    WebglLiquidComponent,
    AccesibilidadComponent,
    ChatBotComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, AfterViewInit {
  items: MenuItem[] | undefined;
  actualYear: number;
  clases!:boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, protected  router: Router, public preloader: PreloaderService,
  private cdr: ChangeDetectorRef) {
    this.actualYear = new Date().getFullYear();
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.preloader.homePage$.subscribe((state) => {
        this.clases = state;
        this.cdr.detectChanges();
      });
    });
    this.items = [
      {
        label: 'Inicio',
        icon: 'pi pi-home',
        command: () => this.router.navigate(['/']),
      },
      {
        label: 'Planes',
        icon: 'pi pi-list',
        command: () => this.router.navigate(['/planes']),
      },
      {
        label: 'Test de velocidad',
        icon: 'pi pi-bolt',
        command: () => this.router.navigate(['/test-velocidad']),
      },
      {
        label: 'Contáctanos',
        icon: 'pi pi-envelope',
        command: () => this.router.navigate(['/contactanos']),
      },
      {
        label: 'Sobre nosotros',
        icon: 'pi pi-users',
        command: () => this.router.navigate(['/sobre-nosotros']),
      },
    ];
  }

 ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.ajustarContenidoSegunPantalla.bind(this));
    }
  }

  ngAfterViewInit(): void {
    this.router.events.subscribe(() => {
      window.scrollTo(0, 0);
    });
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.ajustarContenidoSegunPantalla(), 1000);
    }
    setTimeout(() => {
      this.preloader.hide();
    }, 1000);

  }

  // Cerrar menú móvil al hacer clic fuera
  @HostListener('document:click')
  onDocumentClick(): void {
    this.cerrarMenuMovilSiAbierto();
  }

  // Cerrar con tecla Escape
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cerrarMenuMovilSiAbierto();
  }

  private cerrarMenuMovilSiAbierto(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const root = document.querySelector('.p-menubar.p-component') as HTMLElement | null;
    if (!root) return;
    const btn = root.querySelector('.p-menubar-button') as HTMLButtonElement | null;
    if (!btn) return;
    const expanded = btn.getAttribute('aria-expanded');
    if (expanded === 'true') {
      btn.click();
    }
  }

  protected alternarContenido(event: MouseEvent): void {
    const icono = event.target as HTMLElement;
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

}
