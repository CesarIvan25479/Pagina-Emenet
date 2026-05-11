import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { ImageModule } from 'primeng/image';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { Router } from '@angular/router';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';

@Component({
  selector: 'app-faqs',
  imports: [ButtonModule, AccordionModule, ImageModule, CommonModule, TagModule, AnimateOnScrollModule],
  templateUrl: './faqs.component.html',
  styleUrl: './faqs.component.scss'
})
export class FaqsComponent {
  constructor(protected router: Router){

  }
  mostrarPuerto: boolean = true;
  mostrarayuda: boolean = true;
}
