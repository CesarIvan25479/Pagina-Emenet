import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rolling-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rolling-text" [ngClass]="className">
      <span class="char" *ngFor="let char of text.split(''); let i = index" 
            [style.animation-delay]="(i * delay) + 's'">
        {{ char === ' ' ? '\u00A0' : char }}
      </span>
    </div>
  `,
  styles: [`
    .rolling-text {
      display: inline-block;
      overflow: hidden;
    }
    
    .char {
      display: inline-block;
      transform: translateY(1em);
      opacity: 0;
      animation: rollIn 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      animation-delay: calc(var(--char-index) * 0.08s);
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      font-weight: 600;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      will-change: transform, opacity;
      text-rendering: optimizeLegibility;
      letter-spacing: 0.02em;
    }
    
    @keyframes rollIn {
      0% {
        transform: translateY(1em) rotateX(-90deg);
        opacity: 0;
        transform-origin: bottom;
      }
      60% {
        opacity: 1;
      }
      100% {
        transform: translateY(0) rotateX(0);
        opacity: 1;
        transform-origin: bottom;
      }
    }
  `]
})
export class RollingTextComponent {
  @Input() text: string = '';
  @Input() className: string = '';
  @Input() delay: number = 0.05;
}
