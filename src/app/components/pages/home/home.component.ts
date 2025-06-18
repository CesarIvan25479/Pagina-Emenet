import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapaCoberturaComponent } from '../mapa-cobertura/mapa-cobertura.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CarouselModule } from 'primeng/carousel';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    MapaCoberturaComponent,
    CarouselModule,
  ],
})
export class HomeComponent {
  banners = [
    {
      title: 'Internet de alta velocidad para tu hogar o negocio',
      description:
        'Navega sin interrupciones, juega, trabaja y conecta todo tu mundo',
      image: '/presentacion2.png',
    },
    {
      title: 'Conexión estable y rápida en todo momento',
      description: 'Planes accesibles para ti y tu familia',
      image: '/trabajo.jpg',
    },
  ];
}
