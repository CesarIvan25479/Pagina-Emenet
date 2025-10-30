import { Component, ElementRef, OnDestroy, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Renderer, Program, Mesh, Color, Triangle, type OGLRenderingContext } from 'ogl';

@Component({
  selector: 'app-webgl-liquid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #container class="absolute inset-0 w-full h-full">
      <canvas #canvas class="w-full h-full"></canvas>
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
export class WebglLiquidComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private renderer!: Renderer;
  private gl!: OGLRenderingContext;
  private mesh!: Mesh;
  private animationFrameId: number = 0;
  private startTime: number = 0;

  // Configuration
  private color: [number, number, number] = [0.2, 0.5, 1.0]; // Light blue color (RGB: 51, 128, 255)
  private speed: number = 1.0;
  private amplitude: number = 0.1;
  private mouseReact: boolean = true;
  private mousePos = { x: 0.5, y: 0.5 };

  // Vertex Shader
  private readonly vert = `
    attribute vec2 uv;
    attribute vec2 position;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0, 1);
    }
  `;

  // Fragment Shader with improved animation and mouse interaction
  private readonly frag = `
    precision highp float;
    
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uResolution;
    uniform vec2 uMouse;
    uniform float uAmplitude;
    uniform float uSpeed;
    
    varying vec2 vUv;
    
    void main() {
      float mr = min(uResolution.x, uResolution.y);
      vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;
      
      // Apply mouse interaction
      uv += (uMouse - vec2(0.5)) * uAmplitude;
  
      float d = -uTime * 0.5 * uSpeed;
      float a = 0.0;
      for (float i = 0.0; i < 8.0; ++i) {
          a += cos(i - d - a * uv.x);
          d += sin(uv.y * i + a);
      }
      d += uTime * 0.5 * uSpeed;
      vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
      col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
      gl_FragColor = vec4(col, 1.0);
    }
  `;

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.mouseReact || !this.containerRef) return;
    
    const rect = this.containerRef.nativeElement.getBoundingClientRect();
    this.mousePos.x = (event.clientX - rect.left) / rect.width;
    this.mousePos.y = 1.0 - (event.clientY - rect.top) / rect.height;
    
    if (this.mesh?.program?.uniforms?.['uMouse']) {
      this.mesh.program.uniforms['uMouse'].value[0] = this.mousePos.x;
      this.mesh.program.uniforms['uMouse'].value[1] = this.mousePos.y;
    }
  }

  ngAfterViewInit() {
    this.initWebGL();
    this.setupResizeObserver();
    this.startAnimation();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private initWebGL() {
    if (!this.canvasRef) return;

    // Create renderer with the existing canvas
    this.renderer = new Renderer({
      canvas: this.canvasRef.nativeElement,
      width: this.containerRef.nativeElement.clientWidth,
      height: this.containerRef.nativeElement.clientHeight,
      dpr: window.devicePixelRatio,
      alpha: true
    });
    
    this.gl = this.renderer.gl;
    // Set background to white to match the React version
    this.gl.clearColor(1, 1, 1, 1);

    // Create geometry
    const geometry = new Triangle(this.gl);

    // Create program with shaders and uniforms
    const program = new Program(this.gl, {
      vertex: this.vert,
      fragment: this.frag,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...this.color) },
        uResolution: {
          value: [
            this.gl.canvas.width,
            this.gl.canvas.height,
            this.gl.canvas.width / this.gl.canvas.height
          ]
        },
        uMouse: { value: new Float32Array([this.mousePos.x, this.mousePos.y]) },
        uAmplitude: { value: this.amplitude },
        uSpeed: { value: this.speed }
      },
    });

    // Create mesh
    this.mesh = new Mesh(this.gl, { geometry, program });
    this.resize();
  }

  private resize = () => {
    if (!this.renderer || !this.containerRef) return;
    
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.renderer.setSize(width, height);
    
    if (this.mesh?.program?.uniforms?.['uResolution']) {
      this.mesh.program.uniforms['uResolution'].value = [
        width,
        height,
        width / height
      ];
    }
  }

  private startAnimation() {
    this.startTime = performance.now();
    const animate = (time: number) => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      if (this.mesh?.program?.uniforms?.['uTime']) {
        this.mesh.program.uniforms['uTime'].value = (time - this.startTime) * 0.001; // Convert to seconds
      }
      
      if (this.renderer) {
        this.renderer.render({ scene: this.mesh });
      }
    };
    
    animate(0);
  }

  private setupResizeObserver() {
    const resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
    
    if (this.containerRef.nativeElement) {
      resizeObserver.observe(this.containerRef.nativeElement);
    }
    
    // Store the observer for cleanup
    (this as any)._resizeObserver = resizeObserver;
  }

  private cleanup() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if ((this as any)._resizeObserver) {
      (this as any)._resizeObserver.disconnect();
    }
    
    if (this.gl) {
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  }
}
