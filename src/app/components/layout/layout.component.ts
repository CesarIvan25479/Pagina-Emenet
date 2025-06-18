import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, MenubarModule, CommonModule, AccordionModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  styles: [
    `
      //  ::ng-deep .p-menubar-start {
      //     order: 1;
      //   }
    `,
  ],
})
export class LayoutComponent implements OnInit, AfterViewInit {
  items: MenuItem[] | undefined;
  actualYear: number;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.actualYear = new Date().getFullYear();
    this.items = [
      {
        label: 'Inicio',
        icon: 'pi pi-home',
      },
      {
        label: 'Planes',
        icon: 'pi pi-home',
      },
      {
        label: 'Sobre Nosotros',
        icon: 'pi pi-home',
      },
      {
        label: 'Test de Velocidad',
        icon: 'pi pi-home',
      },
      {
        label: 'Contactanos',
        icon: 'pi pi-home',
      },
      // {
      //     label: 'Planes',
      //     icon: 'pi pi-search',
      //     badge: '3',
      //     items: [
      //         {
      //             label: 'Core',
      //             icon: 'pi pi-bolt',
      //             shortcut: '⌘+S',
      //         },
      //         {
      //             label: 'Blocks',
      //             icon: 'pi pi-server',
      //             shortcut: '⌘+B',
      //         },
      //         {
      //             separator: true,
      //         },
      //         {
      //             label: 'UI Kit',
      //             icon: 'pi pi-pencil',
      //             shortcut: '⌘+U',
      //         },
      //     ],
      // },
    ];
  }

 ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.ajustarContenidoSegunPantalla.bind(this));
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Espera un pequeño tiempo por seguridad para asegurar que el DOM esté listo
      setTimeout(() => this.ajustarContenidoSegunPantalla(), 1000);
    }
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
}
