import { CommonModule, NgFor, NgClass } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild, NgZone, AfterViewInit, inject } from '@angular/core';
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from './css3d-renderer';

@Component({
  selector: 'app-carousel3d',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #carouselContainer class="w-full h-[60vh] relative" [ngClass]="containerClass">
      <div 
        class="absolute top-[40%] translate-y-[-50%] left-0 w-full h-[80%] z-[100]"
        [ngClass]="carouselClass"
        (mousedown)="onDragStart($event)"
        (mouseup)="onDragEnd()"
        (mouseleave)="onDragEnd()"
        (mousemove)="onMouseMove($event)"
        (touchstart)="onTouchStart($event)"
        (touchend)="onDragEnd()"
        (touchmove)="onTouchMove($event)"
      ></div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class Carousel3dComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('carouselContainer') carouselContainer!: ElementRef<HTMLDivElement>;
  
  @Input() items: string[] = [];
  @Input() carouselClass: string = '';
  @Input() containerClass: string = '';
  @Input() width: number = 450;
  @Input() height: number = 600;

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(50, 1, 1, 5000);
  private renderer!: CSS3DRenderer;
  private carousel = new THREE.Object3D();
  private radius = 750;
  private ngZone = inject(NgZone);
  private isDragging = false;
  private startX = 0;
  private currentX = 0;
  private sensitivity = 0.0025;
  private animationId: number | null = null;
  private targetRotation = 0;
  private currentRotation = 0;
  private animationSpeed = 0.005;
  private itemsLoaded = false;

  ngOnInit() {
    // Initialize the component
  }

  ngAfterViewInit() {
    // Wait for the view to be initialized before setting up Three.js
    setTimeout(() => {
      this.initThree();
      this.animate();
      this.itemsLoaded = true;
    });
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private initThree() {
    if (!this.carouselContainer) return;

    try {
      // Setup renderer
      this.renderer = new CSS3DRenderer();
      const width = this.carouselContainer.nativeElement.clientWidth;
      const height = this.carouselContainer.nativeElement.clientHeight;

      this.renderer.setSize(width, height);
      this.carouselContainer.nativeElement.appendChild(this.renderer.domElement);

      // Camera setup
      this.camera.position.z = 550;
      this.camera.position.y = 70;

      // Add carousel to scene
      this.scene.add(this.carousel);

      // Add items
      this.items.forEach((image, index) => {
        const element = document.createElement('div');
        element.style.width = `${this.width}px`;
        element.style.height = `${this.height}px`;
        element.classList.add('rounded-lg');
        element.style.backgroundImage = `url(${image})`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
        element.style.borderRadius = '0.5rem';
        element.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';

        const object = new CSS3DObject(element);
        const angle = (index / this.items.length) * Math.PI * 2;
        object.position.setFromSphericalCoords(
          this.radius,
          Math.PI / 2,
          angle
        );
        object.lookAt(this.carousel.position);

        this.carousel.add(object);
      });

      // Initial rotation
      this.carousel.rotation.x = THREE.MathUtils.degToRad(20);

      // Handle window resize
      this.onWindowResize();
      window.addEventListener('resize', this.onWindowResize.bind(this));
    } catch (error) {
      console.error('Error initializing 3D carousel:', error);
    }
  }

  private animate() {
    this.ngZone.runOutsideAngular(() => {
      this.animationId = requestAnimationFrame(() => this.animate());
      
      // Smooth rotation
      if (!this.isDragging) {
        this.targetRotation += this.animationSpeed;
      }
      
      this.currentRotation += (this.targetRotation - this.currentRotation) * 0.05;
      this.carousel.rotation.y = this.currentRotation;
      
      if (this.renderer) {
        this.renderer.render(this.scene, this.camera);
      }
    });
  }

  onDragStart(event: MouseEvent | TouchEvent) {
    this.isDragging = true;
    this.startX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    this.currentX = this.startX;
  }

  onDragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.handleDrag(event.clientX);
  }

  onTouchStart(event: TouchEvent) {
    this.onDragStart(event);
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;
    event.preventDefault();
    this.handleDrag(event.touches[0].clientX);
  }

  private handleDrag(clientX: number) {
    const deltaX = clientX - this.currentX;
    this.currentX = clientX;
    this.targetRotation += -deltaX * this.sensitivity;
  }

  @HostListener('window:resize')
  private onWindowResize() {
    if (!this.carouselContainer?.nativeElement || !this.renderer) return;

    const width = this.carouselContainer.nativeElement.clientWidth;
    const height = this.carouselContainer.nativeElement.clientHeight;

    this.radius = width / 3;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private cleanup() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.carouselContainer?.nativeElement && this.renderer?.domElement) {
      try {
        this.carouselContainer.nativeElement.removeChild(this.renderer.domElement);
      } catch (e) {
        // Element might already be removed
      }
    }
    
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  // Add this method to handle item updates
  @Input() set carouselItems(items: string[]) {
    if (items && items.length > 0) {
      this.items = items;
      if (this.itemsLoaded) {
        // Reinitialize if items change after initial load
        this.cleanup();
        this.initThree();
      }
    }
  }
}
