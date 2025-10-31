import { Component, Input, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-text-scroll-reveal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container class="relative inline-block overflow-hidden">
      <span class="inline-block relative">
        <!-- Texto base (fondo) -->
        <span class="opacity-30">{{ text }}</span>
        
        <!-- Texto con gradiente (se revela) -->
        <span 
          class="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500"
          [style.transform]="isVisible ? 'translateY(0)' : 'translateY(100%)'"
          [style.opacity]="isVisible ? '1' : '0'"
          style="transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1), opacity 1s cubic-bezier(0.4, 0, 0.2, 1); display: inline-block;"
        >
          {{ text }}
        </span>
      </span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextScrollRevealComponent implements AfterViewInit {
  @Input() text: string = '';
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;
  
  isVisible = false;

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    // Usamos NgZone para ejecutar fuera del ciclo de detección de cambios de Angular
    this.zone.runOutsideAngular(() => {
      // Usamos setTimeout para asegurar que el navegador haya terminado de renderizar
      setTimeout(() => {
        this.zone.run(() => {
          this.isVisible = true;
          this.cdr.markForCheck();
        });
      }, 100);
    });
  }
}
