import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-animated-chat-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animated-chat-icon.component.html',
  styleUrls: ['./animated-chat-icon.component.scss'],
  animations: [
    trigger('iconAnimation', [
      state('default', style({
        transform: 'rotate(0)'
      })),
      state('look-at', style({
        transform: 'rotate(0)'
      })),
      state('blink', style({
        transform: 'rotate(0)'
      })),
      state('wink', style({
        transform: 'rotate(0)'
      })),
      transition('* => default', [
        animate('0.8s ease-in-out', keyframes([
          style({ transform: 'rotate(0)', offset: 0 }),
          style({ transform: 'rotate(8deg)', offset: 0.4 }),
          style({ transform: 'rotate(-8deg)', offset: 0.6 }),
          style({ transform: 'rotate(2deg)', offset: 0.8 }),
          style({ transform: 'rotate(0)', offset: 1 })
        ]))
      ]),
      transition('* => blink', [
        style({ transformOrigin: 'center' }),
        animate('0.6s ease-in-out', keyframes([
          style({ transform: 'scaleY(1)', offset: 0 }),
          style({ transform: 'scaleY(0.5)', offset: 0.5 }),
          style({ transform: 'scaleY(1)', offset: 1 })
        ]))
      ])
    ]),
    trigger('eyeAnimation', [
      state('default', style({
        transform: 'scaleY(1)'
      })),
      state('blink', style({
        transform: 'scaleY(0.5)'
      })),
      state('wink', style({
        transform: 'scaleY(0.5)'
      })),
      transition('* <=> *', [
        animate('0.6s ease-in-out')
      ])
    ])
  ]
})
export class AnimatedChatIconComponent implements OnInit, OnDestroy {
  @Input() size: number = 24;
  @Input() color: string = 'currentColor';
  @Input() animateOnHover: boolean = true;
  
  animationState: 'default' | 'look-at' | 'blink' | 'wink' = 'default';
  private blinkInterval: any;
  private isHovered: boolean = false;
  private isBlinking: boolean = false;
  
  ngOnInit(): void {
    this.setupBlinking();
  }
  
  ngOnDestroy(): void {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
    }
  }
  
  private setupBlinking(): void {
    // Initial animation
    setTimeout(() => {
      this.animationState = 'default';
    }, 100);
    
    // Blink every 3-5 seconds
    this.blinkInterval = setInterval(() => {
      if (!this.animateOnHover && !this.isHovered) {
        this.triggerBlink();
      }
    }, 3000 + Math.random() * 2000);
  }

  onHover(): void {
    if (this.animateOnHover) {
      this.isHovered = true;
      this.animationState = 'look-at';
    }
  }

  onLeave(): void {
    if (this.animateOnHover) {
      this.isHovered = false;
      this.animationState = 'default';
    }
  }
  
  private triggerBlink(): void {
    // Randomly choose between blink and wink
    const blinkType = Math.random() > 0.7 ? 'wink' : 'blink';
    this.animationState = blinkType;
    
    // Reset to default after blink
    setTimeout(() => {
      if (!this.isHovered) {
        this.animationState = 'default';
      }
    }, 600);
  }
  
  getEyeState(eye: 'left' | 'right'): string {
    if (this.animationState === 'wink' && eye === 'right') {
      return 'default';
    }
    return this.animationState;
  }

  get eyeState(): string {
    return this.isBlinking ? 'blinking' : 'default';
  }
}
