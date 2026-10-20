import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PreloaderService } from '../../../../services/preloader.service';

@Component({
  selector: 'app-eisp',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './eisp.component.html',
  styleUrl: './eisp.component.scss'
})
export class EispComponent implements OnInit {
  contactForm!: FormGroup;
  activeScreen: 'olt' | 'dashboard' = 'olt';

  subscriberCount: number = 500;
  estimatedPrice: number = 950;

  coreFeatures = [
    {
      title: 'Aprovisionamiento OLT',
      desc: 'Detección automática de ONUs desautorizadas y creación de perfil de velocidad con 1 clic.',
      icon: 'pi-server',
      badge: 'Huawei • ZTE • VSOL'
    },
    {
      title: 'Telemetría Óptica Rx/Tx',
      desc: 'Monitoreo de niveles en dBm por puerto y abonado para prevención inmediata de degradación.',
      icon: 'pi-chart-line',
      badge: 'Niveles en Tiempo Real'
    },
    {
      title: 'Control RouterOS',
      desc: 'Cortes y reconexiones automáticas en MikroTik al confirmar pago sin intervención humana.',
      icon: 'pi-bolt',
      badge: 'Reconexión < 2 seg'
    },
    {
      title: 'Almacén & Cuadrillas',
      desc: 'Trazabilidad de bobinas y equipos asignados a técnicos, control de asistencias y órdenes de servicio.',
      icon: 'pi-box',
      badge: 'Operación Integral'
    }
  ];

  constructor(
    private preloader: PreloaderService,
    protected router: Router,
    private fb: FormBuilder
  ) {
    this.contactForm = this.fb.group({
      nombre: ['', [Validators.required]],
      empresa: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      correo: ['', [Validators.email]]
    });

    this.calculatePrice();

    setTimeout(() => {
      this.preloader.hide();
    }, 600);
  }

  ngOnInit(): void {}

  calculatePrice(): void {
    if (this.subscriberCount <= 300) {
      this.estimatedPrice = 750;
    } else if (this.subscriberCount <= 1000) {
      this.estimatedPrice = 750 + Math.round((this.subscriberCount - 300) * 0.9);
    } else if (this.subscriberCount <= 3000) {
      this.estimatedPrice = 1380 + Math.round((this.subscriberCount - 1000) * 0.6);
    } else {
      this.estimatedPrice = 2580 + Math.round((this.subscriberCount - 3000) * 0.4);
    }
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onFormSubmit(): void {
    if (this.contactForm.valid) {
      console.log('Lead registrado en stand:', {
        ...this.contactForm.value,
        abonadosCalculados: this.subscriberCount,
        precioEstimado: this.estimatedPrice
      });
    }
  }
}
