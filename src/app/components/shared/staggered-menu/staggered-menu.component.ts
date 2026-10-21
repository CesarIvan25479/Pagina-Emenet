import {
  Component,
  Input,
  Output,
  EventEmitter,
  Inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface StaggeredMenuItem {
  label: string;
  link: string;
  ariaLabel?: string;
  external?: boolean;
}

export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}

@Component({
  selector: 'app-staggered-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './staggered-menu.component.html',
  styleUrl: './staggered-menu.component.scss'
})
export class StaggeredMenuComponent implements OnInit, OnDestroy {
  @Input() position: 'left' | 'right' = 'right';
  @Input() colors: string[] = ['#3b82f6', '#166835'];
  @Input() items: StaggeredMenuItem[] = [];
  @Input() socialItems: StaggeredMenuSocialItem[] = [];
  @Input() displaySocials: boolean = true;
  @Input() displayItemNumbering: boolean = true;
  @Input() className: string = '';
  @Input() logoUrl: string = 'assets/emenetLogoN.svg';
  @Input() menuButtonColor: string = '#1e293b';
  @Input() openMenuButtonColor: string = '#1e293b';
  @Input() changeMenuColorOnOpen: boolean = true;
  @Input() accentColor: string = '#166835';

  @Output() menuOpen = new EventEmitter<void>();
  @Output() menuClose = new EventEmitter<void>();

  open: boolean = false;
  processedColors: string[] = [];
  private isBrowser: boolean = false;
  private routerSub?: Subscription;
  private mediaQueryList?: MediaQueryList;
  private mediaQueryHandler?: (e: MediaQueryListEvent | MediaQueryList) => void;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.isBrowser) return;
    // Si la pantalla alcanza o supera el breakpoint de escritorio (lg: >= 992px), cerrar el menú móvil y liberar el scroll
    if (this.open && window.innerWidth >= 992) {
      this.closeMenu();
    }
  }

  ngOnInit(): void {
    const raw = this.colors && this.colors.length ? this.colors : ['#3b82f6', '#166835'];
    this.processedColors = [...raw];

    if (this.isBrowser) {
      // 1. Monitorear cambios en modo de visualización móvil/escritorio (útil con DevTools)
      try {
        this.mediaQueryList = window.matchMedia('(min-width: 992px)');
        this.mediaQueryHandler = (e: MediaQueryListEvent | MediaQueryList) => {
          if (e.matches && this.open) {
            this.closeMenu();
          }
        };
        if (this.mediaQueryList.addEventListener) {
          this.mediaQueryList.addEventListener('change', this.mediaQueryHandler);
        } else {
          (this.mediaQueryList as any).addListener(this.mediaQueryHandler);
        }
      } catch {
        // Ignorar si matchMedia no está disponible
      }

      // 2. Cerrar el menú si el usuario navega a otra ruta
      this.routerSub = this.router.events
        .pipe(filter((event) => event instanceof NavigationStart))
        .subscribe(() => {
          if (this.open) {
            this.closeMenu();
          }
        });
    }
  }

  toggleMenu(): void {
    if (this.open) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu(): void {
    if (this.open) return;
    this.open = true;
    this.menuOpen.emit();
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
    this.cdr.detectChanges();
  }

  closeMenu(): void {
    if (!this.open) {
      if (this.isBrowser && document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
      }
      return;
    }
    this.open = false;
    this.menuClose.emit();
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
    this.cdr.detectChanges();
  }

  onItemClick(item: StaggeredMenuItem, event?: Event): void {
    event?.preventDefault();
    this.closeMenu();
    if (item.link) {
      if (item.external || item.link.startsWith('http')) {
        window.open(item.link, '_blank');
      } else {
        this.router.navigate([item.link]);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      document.body.style.overflow = '';
      if (this.mediaQueryList && this.mediaQueryHandler) {
        if (this.mediaQueryList.removeEventListener) {
          this.mediaQueryList.removeEventListener('change', this.mediaQueryHandler);
        } else {
          (this.mediaQueryList as any).removeListener(this.mediaQueryHandler);
        }
      }
    }
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }
}
