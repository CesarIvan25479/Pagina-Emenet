import {
  Component,
  Input,
  Output,
  EventEmitter,
  Inject,
  PLATFORM_ID,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

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
export class StaggeredMenuComponent implements OnDestroy {
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

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    const raw = this.colors && this.colors.length ? this.colors : ['#3b82f6', '#166835'];
    this.processedColors = [...raw];
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
    if (!this.open) return;
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
    }
  }
}
