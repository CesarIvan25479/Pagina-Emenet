import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreloaderService } from '../../../services/preloader.service';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-sobre-nosotros',
  standalone: true,
  imports: [
    CommonModule,
    CarouselModule,
    ButtonModule,
    AnimateOnScrollModule
  ],
  templateUrl: './sobre-nosotros.component.html',
  styleUrls: ['./sobre-nosotros.component.scss'],
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
      contenido: 'Llevamos 2 años con emenet y cero problemas. El servicio técnico es rápido y eficiente. La mejor cobertura en la zona.',
      calificacion: 4.8
    },
    {
      nombre: 'Carlos López',
      cargo: 'Taller Mecánico, Ixtlahuaca',
      contenido: 'Para nuestro taller era esencial una conexión estable para facturación electrónica. emenet nos ha dado ese servicio sin fallas.',
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
      contenido: 'Nuestro negocio depende de la conexión para el sistema de pedidos. Con emenet hemos tenido el mejor servicio en años.',
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
      breakpoint: '9999px',
      numVisible: 1,
      numScroll: 1
    },
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
  itemsPerPage = 1; // Mostrar solo un testimonio a la vez
  testimoniosVisibles: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(private preloader: PreloaderService) {
    this.preloader.actualizarClases(true);
  }

  ngOnInit() {
    this.updateVisibleTestimonials();
    
    // Cambiar testimonios cada 5 segundos
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


  updateVisibleTestimonials() {
    const startIndex = this.currentPage * this.itemsPerPage;
    this.testimoniosVisibles = this.testimonios.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage() {
    const totalPages = Math.ceil(this.testimonios.length / this.itemsPerPage);
    this.currentPage = (this.currentPage + 1) % totalPages;
    this.updateVisibleTestimonials();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updateVisibleTestimonials();
  }

  getStars(rating: number): boolean[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars: boolean[] = [];
    
    for (let i = 0; i < 5; i++) {
      stars.push(i < fullStars || (i === fullStars && hasHalfStar));
    }
    
    return stars;
  }
}
