import { Component, Input, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'letter-pullup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full text-center">
      <div class="inline-flex flex-wrap justify-center">
        <div *ngFor="let letter of letters; let i = index" class="inline-flex">
          <h1 
            class="letter-animate font-display font-bold tracking-[-0.02em] text-gray-900 dark:text-white text-4xl md:text-4xl drop-shadow-sm"
            [ngClass]="className"
            [style.animation-delay]="i * (delay || 0.05) + 's'"
          >
            <span *ngIf="letter === ' '" class="inline-block w-2">&nbsp;</span>
            <span *ngIf="letter !== ' '" class="inline-block">{{ letter }}</span>
          </h1>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes pullUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .letter-animate {
      display: inline-block;
      opacity: 0;
      animation: pullUp 0.4s cubic-bezier(0.16, 0.57, 0.3, 0.98) forwards;
      will-change: transform, opacity;
      transform: translateY(20px);
    }
    
    /* iOS-style smooth text rendering */
    :host {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `]
})
export class LetterPullupComponent {
  @Input() text: string = '';
  @Input() delay: number = 0.05;
  @Input() className: string = '';
  @Input() animate: boolean = true;

  // Animation is now handled by CSS

  get letters(): string[] {
    return this.text.split('');
  }
}
