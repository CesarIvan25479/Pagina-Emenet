import { AfterViewInit, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InputMaskModule } from 'primeng/inputmask';
import { ButtonModule } from 'primeng/button';
import { PreloaderService } from './services/preloader.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InputMaskModule, ButtonModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  loading = true;

  constructor(private preloader: PreloaderService) { }

  ngOnInit(): void {
    this.preloader.loading$.subscribe((state) => {
      this.loading = state;

    });
    inicializarAdaptacionMovil();
  }
}
export function inicializarAdaptacionMovil(): () => void {
  if (typeof window === 'undefined') {
    return () => { };
  }

  const setAppVh = () => {
    try {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const vh = Number(viewportHeight) * 0.01;
      document.documentElement.style.setProperty('--app-vh', `${vh}px`);
    } catch (_) { }
  };

  setAppVh();

  try {
    window.visualViewport?.addEventListener?.('resize', setAppVh);
    window.visualViewport?.addEventListener?.('scroll', setAppVh);
  } catch (_) { }

  window.addEventListener('resize', setAppVh);
  window.addEventListener('orientationchange', setAppVh);

  return () => {
    try {
      window.visualViewport?.removeEventListener?.('resize', setAppVh);
      window.visualViewport?.removeEventListener?.('scroll', setAppVh);
    } catch (_) { }
    window.removeEventListener('resize', setAppVh);
    window.removeEventListener('orientationchange', setAppVh);
  };
}
