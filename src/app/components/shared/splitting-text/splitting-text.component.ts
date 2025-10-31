import { Component, Input, OnInit } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { AnimationBuilder, style as animationStyle, animate as animationAnimate } from '@angular/animations';

@Component({
  selector: 'app-splitting-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splitting-text-wrapper">
      <span *ngFor="let char of text.split(''); let i = index"
            [style.animation-delay]="i * delay + 's'"
            class="char"
            [@charAnimation]>
        {{ char === ' ' ? '\u00A0' : char }}
      </span>
    </div>
  `,
  styles: [`
    .splitting-text-wrapper {
      display: inline-block;
      text-align: center;
      width: 100%;
    }
    
    .char {
      display: inline-block;
      opacity: 0;
      filter: blur(10px);
      animation: charIn 0.6s ease-out forwards;
    }
    
    @keyframes charIn {
      to {
        opacity: 1;
        filter: blur(0);
      }
    }
  `],
  animations: [
    trigger('charAnimation', [
      transition(':enter', [
        style({ opacity: 0, filter: 'blur(10px)' }),
        animate('0.6s ease-out', 
          style({ opacity: 1, filter: 'blur(0)' })
        )
      ])
    ])
  ]
})
export class SplittingTextComponent {
  @Input() text: string = '';
  @Input() className: string = '';
  @Input() delay: number = 0.03; // Slightly faster delay for better effect
  
  constructor() {}
}
