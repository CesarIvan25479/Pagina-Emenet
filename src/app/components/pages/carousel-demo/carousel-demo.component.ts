import { Component } from '@angular/core';
import { Carousel3dComponent } from '../../shared/carousel3d/carousel3d.component';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-carousel-demo',
  standalone: true,
  imports: [CommonModule, Carousel3dComponent, ButtonModule],
  template: `
    <div class="container mx-auto p-8">
      <h1 class="text-4xl font-bold mb-8 text-center">3D Carousel Demo</h1>
      
      <div class="mb-8">
        <h2 class="text-2xl font-semibold mb-4">Carousel with Sample Images</h2>
        <app-carousel3d 
          [items]="carouselItems"
          [width]="400"
          [height]="300"
          containerClass="border-2 border-gray-200 rounded-lg overflow-hidden"
        ></app-carousel3d>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 class="text-2xl font-semibold mb-4">How to Use</h2>
          <div class="prose max-w-none">
            <p class="mb-4">
              The 3D carousel is now ready to use in your application. Here's how to implement it:
            </p>
            <pre class="bg-gray-100 p-4 rounded-lg mb-4">
<code class="language-html">&lt;app-carousel3d 
  [items]="imageUrls"
  [width]="400"
  [height]="300"
  containerClass="your-custom-class"
  carouselClass="additional-styling"
&gt;&lt;/app-carousel3d&gt;</code>
            </pre>
            
            <h3 class="text-xl font-semibold mt-6 mb-2">Input Properties</h3>
            <ul class="list-disc pl-5 space-y-2">
              <li><code>items: string[]</code> - Array of image URLs to display in the carousel</li>
              <li><code>width: number</code> - Width of each carousel item in pixels</li>
              <li><code>height: number</code> - Height of each carousel item in pixels</li>
              <li><code>containerClass: string</code> - Additional CSS classes for the container</li>
              <li><code>carouselClass: string</code> - Additional CSS classes for the carousel track</li>
            </ul>
          </div>
        </div>
        
        <div>
          <h2 class="text-2xl font-semibold mb-4">Features</h2>
          <ul class="space-y-3">
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Responsive 3D carousel with smooth animations</span>
            </li>
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Touch and mouse drag support</span>
            </li>
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Automatic rotation when not interacting</span>
            </li>
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Fully customizable styling</span>
            </li>
            <li class="flex items-start">
              <svg class="h-6 w-6 text-green-500 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Optimized performance with Angular's change detection</span>
            </li>
          </ul>
          
          <div class="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 class="text-xl font-semibold mb-3">Implementation Notes</h3>
            <p class="mb-4">The carousel uses Three.js for 3D rendering and is optimized for performance. It runs animations outside of Angular's zone to prevent unnecessary change detection cycles.</p>
            <p>For best results, use images with consistent aspect ratios and preload them for smoother transitions.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      padding: 2rem 0;
    }
    
    .prose pre {
      background-color: #f3f4f6;
      border-radius: 0.5rem;
      padding: 1rem;
      overflow-x: auto;
    }
    
    .prose code {
      font-family: 'Fira Code', 'Courier New', monospace;
      font-size: 0.875rem;
      color: #1f2937;
    }
  `]
})
export class CarouselDemoComponent {
  // Sample image URLs for the demo
  carouselItems = [
    'https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/16245254/pexels-photo-16245254/free-photo-of-chatgpt-a-chatbot-for-your-website.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/1910236/pexels-photo-1910236.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/2832382/pexels-photo-2832382.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/2333293/pexels-photo-2333293.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/604684/pexels-photo-604684.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/3308588/pexels-photo-3308588.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/2860807/pexels-photo-2860807.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  ];
}
