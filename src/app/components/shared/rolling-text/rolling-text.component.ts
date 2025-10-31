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
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      will-change: transform, opacity;
    }
    
    @keyframes rollIn {
      0% {
        transform: translateY(1em) scale(0.95);
        opacity: 0;
        filter: blur(2px);
      }
      30% {
        opacity: 0.6;
        filter: blur(1px);
      }
      70% {
        transform: translateY(-0.1em);
      }
      100% {
        transform: translateY(0) scale(1);
        opacity: 1;
        filter: blur(0);
      }
    }
  `]
})
export class RollingTextComponent {
  @Input() text: string = '';
  @Input() className: string = '';
  @Input() delay: number = 0.05;
}
