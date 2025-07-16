import { AfterViewInit, Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapaCoberturaComponent } from '../mapa-cobertura/mapa-cobertura.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CarouselModule } from 'primeng/carousel';
import { Router } from '@angular/router';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { PreloaderService } from '../../../services/preloader.service';

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
    AnimateOnScrollModule
  ],
})
export class HomeComponent{
  constructor(public router: Router, private preloader: PreloaderService){}
  banners = [
    {
      title: 'Planes pensados para tu hogar',
      description: 'Desde $300 al mes, consulta disponibilidad en tu zona',
      image: 'assets/principal/trabajo.jpg',
    },
    {
      title: 'Internet de alta velocidad para tu hogar o negocio',
      description: 'Navega, juega, trabaja y conecta todo tu mundo',
      image: 'assets/principal/presentacion2.png',
    },
    {
      title: 'Cobertura en expansión',
      description: 'Consulta si ya contamos con cobertura en tu zona',
      image: 'assets/principal/cobertura.jpg',
    },
  ];

  public verCobertura(){
    const cobertura = document.getElementById('mapa-cobertura');
    if (cobertura) {
      window.scrollTo({
        top: cobertura.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  }

  // ngAfterViewInit(): void {
  //   console.log("se cancela")
  //   this.preloader.hide()
  // }

  // ngOnInit(): void {
  //   console.log("se iniciar")
  //   this.preloader.show();
  //   setTimeout(() => {
  //     this.preloader.hide()
  //   }, 2000);
  // }
}
