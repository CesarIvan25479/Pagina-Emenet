import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreloaderService } from '../../../services/preloader.service';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { TextScrollRevealComponent } from '../../shared/text-scroll-reveal/text-scroll-reveal.component';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-sobre-nosotros',
  standalone: true,
  animations: [
    trigger('fadeInOut', [
      state('in', style({ 
        opacity: 1,
        height: '*',
        overflow: 'hidden'
      })),
      state('out', style({ 
        opacity: 0,
        height: '*',
        overflow: 'hidden'
      })),
      transition('in <=> out', [
        animate('300ms ease-in-out')
      ])
    ])
  ],
  imports: [
    CommonModule,
    AnimateOnScrollModule,
    CarouselModule,
    ButtonModule
  ],
  host: { '[@fadeInOut]': '' },
  templateUrl: './sobre-nosotros.component.html',
})
export class SobreNosotrosComponent implements OnInit, OnDestroy {
  testimonios: any[] = [
    {
      nombre: 'Juan Pérez',
      cargo: 'Cafetería El Mirador, Almoloya del Río',
      contenido: 'Excelente servicio de internet en nuestra cafetería. Los clientes siempre preguntan por la conexión rápida y estable. ¡Muy recomendable!',
      calificacion: 4.5
    },
    {
      nombre: 'María Sánchez',
      cargo: 'Tienda de Abarrotes, Santiago Tianguistenco',
      contenido: 'Llevamos 2 años con EMENET y cero problemas. El servicio técnico es rápido y eficiente. La mejor cobertura en la zona.',
      calificacion: 4.8
    },
    {
      nombre: 'Carlos López',
      cargo: 'Taller Mecánico, Ixtlahuaca',
      contenido: 'Para nuestro taller era esencial una conexión estable para facturación electrónica. EMENET nos ha dado ese servicio sin fallas.',
      calificacion: 4.7
    },
    {
      nombre: 'Ana Martínez',
      cargo: 'Farmacia Santa Mónica',
      contenido: 'La instalación de las cámaras de seguridad y el servicio de internet han sido impecables. Atención personalizada y precios justos.',
      calificacion: 5
    },
    {
      nombre: 'Roberto García',
      cargo: 'Restaurante La Cholula',
      contenido: 'Nuestro negocio depende de la conexión para el sistema de pedidos. Con EMENET hemos tenido el mejor servicio en años.',
      calificacion: 4.9
    },
    {
      nombre: 'Luisa Fernández',
      cargo: 'Papelería El Ahuehuete',
      contenido: 'Excelente atención al cliente y servicio técnico. Nos resolvieron una incidencia en menos de 2 horas. ¡Muy profesionales!',
      calificacion: 4.6
    }
  ];

  responsiveOptions: any[] = [
    {
      breakpoint: '1024px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '768px',
      numVisible: 1,
      numScroll: 1
    },
    {
      breakpoint: '560px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  currentPage = 0;
  itemsPerPage = 3;
  private destroy$ = new Subject<void>();
  testimoniosVisibles: any[] = [];
  animationState = 'in';

  constructor(private preloader: PreloaderService) {
    this.preloader.actualizarClases(true);
  }

  ngOnInit() {
    this.updateVisibleTestimonials();
    
    // Cambiar página cada 5 segundos
    interval(5000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.nextPage();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getPageIndices() {
    return Array(Math.ceil(this.testimonios.length / this.itemsPerPage)).fill(0).map((x, i) => i);
  }

  nextPage() {
    this.animationState = 'out';
    setTimeout(() => {
      this.currentPage = (this.currentPage + 1) % Math.ceil(this.testimonios.length / this.itemsPerPage);
      this.updateVisibleTestimonials();
      this.animationState = 'in';
    }, 150);
  }

  goToPage(page: number) {
    this.animationState = 'out';
    setTimeout(() => {
      this.currentPage = page;
      this.updateVisibleTestimonials();
      this.animationState = 'in';
    }, 150);
  }

  updateVisibleTestimonials() {
    const startIndex = this.currentPage * this.itemsPerPage;
    this.testimoniosVisibles = this.testimonios.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getStars(rating: number): { full: boolean, half: boolean }[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    
    // Estrellas completas
    for (let i = 0; i < fullStars; i++) {
      stars.push({ full: true, half: false });
    }
    
    // Media estrella si es necesario
    if (hasHalfStar) {
      stars.push({ full: false, half: true });
    }
    
    // Estrellas vacías para completar 5
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push({ full: false, half: false });
    }
    
    return stars;
  }
}
