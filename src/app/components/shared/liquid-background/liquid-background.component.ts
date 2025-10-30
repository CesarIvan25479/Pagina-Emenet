import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-liquid-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="absolute inset-0 overflow-hidden" #liquidContainer>
      <canvas #liquidCanvas class="w-full h-full"></canvas>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class LiquidBackgroundComponent implements OnInit, OnDestroy {
  @ViewChild('liquidCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private time = 0;
  
  // Liquid effect parameters
  private readonly DOTS_AMOUNT = 3;
  private readonly DOTS_RADIUS = 0.5;
  private readonly DOTS_SPEED = 0.2;
  private readonly DISTANCE = 80;
  
  private dots: { x: number; y: number; xm: number; ym: number; }[] = [];

  ngOnInit() {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.initCanvas();
    this.initDots();
    this.animate();
    
    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
  }

  private initCanvas() {
    this.resizeCanvas();
  }

  private resizeCanvas = () => {
    const container = this.canvas.parentElement!;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }

  private initDots() {
    this.dots = [];
    for (let i = 0; i < this.DOTS_AMOUNT; i++) {
      this.dots.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        xm: Math.random() * 2 - 1,
        ym: Math.random() * 2 - 1
      });
    }
  }

  private handleResize = () => {
    this.resizeCanvas();
    this.initDots();
  }

  private animate = () => {
    this.time += this.DOTS_SPEED;
    this.updateDots();
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.animate);
  }

  private updateDots() {
    this.dots.forEach(dot => {
      dot.x += dot.xm;
      dot.y += dot.ym;

      if (dot.x > this.canvas.width + this.DISTANCE) dot.x = 0;
      if (dot.x < -this.DISTANCE) dot.x = this.canvas.width;
      if (dot.y > this.canvas.height + this.DISTANCE) dot.y = 0;
      if (dot.y < -this.DISTANCE) dot.y = this.canvas.height;
    });
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw connections between dots
    for (let i = 0; i < this.dots.length; i++) {
      for (let j = i + 1; j < this.dots.length; j++) {
        const dot1 = this.dots[i];
        const dot2 = this.dots[j];
        const dist = Math.hypot(dot2.x - dot1.x, dot2.y - dot1.y);
        
        if (dist < this.DISTANCE) {
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(0, 150, 255, ${1 - dist / this.DISTANCE})`;
          this.ctx.lineWidth = 1.5;
          this.ctx.moveTo(dot1.x, dot1.y);
          this.ctx.lineTo(dot2.x, dot2.y);
          this.ctx.stroke();
        }
      }
    }
    
    // Draw dots
    this.dots.forEach(dot => {
      this.ctx.beginPath();
      this.ctx.fillStyle = 'rgba(0, 150, 255, 0.6)';
      this.ctx.arc(dot.x, dot.y, this.DOTS_RADIUS, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }
}
