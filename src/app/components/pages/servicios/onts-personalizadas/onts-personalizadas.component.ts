import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PreloaderService } from '../../../../services/preloader.service';

export interface OntModelOption {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  chipColor: string;
  wifiStandard: string;
  antennas: string;
  ports: string;
  basePriceMxn: number;
  featured?: boolean;
  specs: { label: string; value: string }[];
}

@Component({
  selector: 'app-onts-personalizadas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './onts-personalizadas.component.html',
  styleUrl: './onts-personalizadas.component.scss'
})
export class OntsPersonalizadasComponent implements OnInit, OnDestroy {
  contactForm!: FormGroup;

  // ===== ONT 3D interactiva =====
  ontRx = -12;
  ontRy = 165;
  ontDragging = false;
  ontSnap = false;
  private ontDragMoved = false;
  private ontLastX = 0;
  private ontLastY = 0;
  private ontTimers: any[] = [];

  ontState = {
    power: true,
    booting: false,
    fiber: true,
    wifi: true,
    wps: false,
    lan: [false, true, false, false] as boolean[]
  };

  get ontLeds(): Record<string, 'on' | 'off' | 'blink'> {
    const s = this.ontState;
    const p = s.power;
    return {
      pwr: p ? 'on' : 'off',
      pon: !p || !s.fiber ? 'off' : s.booting ? 'blink' : 'on',
      los: p && !s.fiber ? 'blink' : 'off',
      inet: p && s.fiber && !s.booting ? 'on' : 'off',
      lan: p && s.lan.some(l => l) ? 'on' : 'off',
      wlan: p && s.wifi && !s.booting ? 'on' : 'off',
      wps: p && s.wps ? 'blink' : 'off'
    };
  }

  get serigraphyHex(): string {
    const map = { azul: '#2563eb', verde: '#16a34a', negro: '#0f172a', blanco: '#ffffff' } as const;
    return map[this.serigraphyColor];
  }

  onOntSceneDown(e: PointerEvent): void {
    this.ontDragging = true;
    this.ontDragMoved = false;
    this.ontSnap = false;
    this.ontLastX = e.clientX;
    this.ontLastY = e.clientY;
  }

  @HostListener('window:pointermove', ['$event'])
  onOntPointerMove(e: PointerEvent): void {
    if (!this.ontDragging) return;
    const dx = e.clientX - this.ontLastX;
    const dy = e.clientY - this.ontLastY;
    if (Math.abs(dx) + Math.abs(dy) > 2) this.ontDragMoved = true;
    this.ontRy += dx * 0.6;
    this.ontRx = Math.max(-80, Math.min(80, this.ontRx - dy * 0.5));
    this.ontLastX = e.clientX;
    this.ontLastY = e.clientY;
  }

  @HostListener('window:pointerup')
  onOntPointerUp(): void {
    this.ontDragging = false;
    setTimeout(() => (this.ontDragMoved = false), 0);
  }

  setOntView(view: 'frente' | 'atras' | 'lado' | 'arriba'): void {
    this.ontSnap = true;
    const cur = Math.round(this.ontRy / 360) * 360;
    switch (view) {
      case 'frente': this.ontRx = -10; this.ontRy = cur - 0; break;
      case 'atras': this.ontRx = -10; this.ontRy = cur + 180; break;
      case 'lado': this.ontRx = -10; this.ontRy = cur - 80; break;
      case 'arriba': this.ontRx = -70; this.ontRy = cur - 10; break;
    }
  }

  private clearOntTimers(): void {
    this.ontTimers.forEach(t => clearTimeout(t));
    this.ontTimers = [];
  }

  private bootOnt(): void {
    this.clearOntTimers();
    this.ontState.booting = true;
    this.ontTimers.push(setTimeout(() => (this.ontState.booting = false), 2200));
  }

  toggleOntPower(): void {
    if (this.ontDragMoved) return;
    this.ontState.power = !this.ontState.power;
    this.clearOntTimers();
    this.ontState.booting = false;
    this.ontState.wps = false;
    if (this.ontState.power) this.bootOnt();
  }

  pressOntWps(): void {
    if (this.ontDragMoved || !this.ontState.power) return;
    this.ontState.wps = true;
    this.ontTimers.push(setTimeout(() => (this.ontState.wps = false), 4000));
  }

  toggleOntWifi(): void {
    if (this.ontDragMoved || !this.ontState.power) return;
    this.ontState.wifi = !this.ontState.wifi;
  }

  toggleOntFiber(): void {
    if (this.ontDragMoved) return;
    this.ontState.fiber = !this.ontState.fiber;
    if (this.ontState.fiber && this.ontState.power) this.bootOnt();
  }

  toggleOntLan(i: number): void {
    if (this.ontDragMoved) return;
    this.ontState.lan[i] = !this.ontState.lan[i];
  }

  resetOnt(): void {
    if (this.ontDragMoved || !this.ontState.power) return;
    this.clearOntTimers();
    this.ontState.power = false;
    this.ontState.wps = false;
    this.ontTimers.push(setTimeout(() => {
      this.ontState.power = true;
      this.bootOnt();
    }, 700));
  }

  focusIspInput(): void {
    this.setOntView('arriba');
    setTimeout(() => {
      const el = document.getElementById('ispNameHeroInput') as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 200);
  }

  ngOnDestroy(): void {
    this.clearOntTimers();
  }

  // Estado del Simulador Interactivo de ONT
  ispName: string = 'TU ISP FIBRA';
  selectedModelId: string = 'ac1200';
  chassisColor: 'blanco' | 'negro' = 'blanco';
  serigraphyColor: 'azul' | 'verde' | 'negro' | 'blanco' = 'azul';

  // Modelos
  models: OntModelOption[] = [
    {
      id: 'ac1200',
      name: 'XPON Dual-Band AC1200',
      subtitle: 'El caballo de batalla más vendido para despliegues FTTH residenciales.',
      badge: 'Más Vendido ⭐',
      chipColor: 'badge-emerald',
      wifiStandard: 'Wi-Fi 5 AC Dual Band (867 Mbps + 300 Mbps)',
      antennas: '4 Antenas Omnidireccionales de 5 dBi',
      ports: '1 Puerto GE + 3 Puertos FE + 1 Puerto Óptico SC/APC',
      basePriceMxn: 485,
      featured: true,
      specs: [
        { label: 'Frecuencias', value: '2.4 GHz & 5.0 GHz Simultáneos' },
        { label: 'Modos', value: 'Routing, Bridge, IPoE, PPPoE con VLAN' },
        { label: 'Gestión', value: 'TR-069, OMCI, Web GUI, Telnet' },
        { label: 'Compatibilidad OLT', value: 'Huawei, ZTE, VSOL, Fiberhome, BDCOM' },
        { label: 'Chipset', value: 'Realtek High Performance' }
      ]
    },
    {
      id: 'ax3000',
      name: 'GPON Wi-Fi 6 AX3000 Ultra',
      subtitle: 'Máxima velocidad para clientes corporativos, gamers y planes de 300+ Mbps.',
      badge: 'Wi-Fi 6 Next-Gen ⚡',
      chipColor: 'badge-cyan',
      wifiStandard: 'Wi-Fi 6 AX Dual Band (2402 Mbps + 574 Mbps)',
      antennas: '4 Antenas de Alta Ganancia 5 dBi con Beamforming',
      ports: '1 Puerto 2.5 Gbps + 3 Puertos GE + 1 SC/APC + 1 FXS VoIP',
      basePriceMxn: 790,
      featured: false,
      specs: [
        { label: 'Tecnología Wi-Fi', value: 'OFDMA + MU-MIMO + EasyMesh 2.0' },
        { label: 'Seguridad', value: 'WPA3 Personal / Enterprise' },
        { label: 'Telefonía', value: '1 Puerto FXS RJ11 para SIP / VoIP' },
        { label: 'Procesador', value: 'Dual-Core 1.2 GHz con acelerador NPU' },
        { label: 'Compatibilidad OLT', value: '100% Homologado OLT GPON/EPON' }
      ]
    },
    {
      id: 'single300',
      name: 'XPON Compact 300M',
      subtitle: 'Opción económica de entrada para planes básicos de internet rural o urbano.',
      badge: 'Económica 💡',
      chipColor: 'badge-blue',
      wifiStandard: 'Wi-Fi 4 2.4 GHz (300 Mbps)',
      antennas: '2 Antenas Omnidireccionales de 5 dBi',
      ports: '1 Puerto GE + 1 Puerto FE + 1 SC/APC',
      basePriceMxn: 320,
      featured: false,
      specs: [
        { label: 'Uso ideal', value: 'Planes de 20 a 80 Mbps' },
        { label: 'Modos', value: 'Bridge, Route, PPPoE' },
        { label: 'Gestión', value: 'TR-069, Web GUI Emenet' },
        { label: 'Chasis', value: 'Ultra compacto disipador' },
        { label: 'Compatibilidad OLT', value: 'Universal ITU-T G.984' }
      ]
    }
  ];

  orderQuantity: number = 100;
  unitPrice: number = 445;
  totalInvestment: number = 44500;
  discountPercentage: number = 8;
  freeSerigraphy: boolean = true;
  freePreconfig: boolean = false;
  freeCustomBoxes: boolean = false;

  // Estado del formulario y feedback
  formSubmitted: boolean = false;
  envioExitoso: boolean = false;

  constructor(
    private preloader: PreloaderService,
    protected router: Router,
    private fb: FormBuilder
  ) {
    this.contactForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      empresa: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9+\s\-()]{8,20}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      modeloInteres: ['ac1200', [Validators.required]],
      cantidadEstimada: [100, [Validators.required, Validators.min(10)]],
      comentarios: ['']
    });

    setTimeout(() => {
      this.preloader.hide();
    }, 500);
  }

  ngOnInit(): void {
    this.recalculateQuote();
  }

  get currentSelectedModel(): OntModelOption {
    return this.models.find(m => m.id === this.selectedModelId) || this.models[0];
  }

  get sanitizedSsid(): string {
    const clean = (this.ispName || 'TU_ISP')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 16);
    return `${clean}_5G_Fibra`;
  }

  get sanitizedDomain(): string {
    const clean = (this.ispName || 'tuisp')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return `admin.${clean || 'mired'}.mx`;
  }

  selectModel(modelId: string): void {
    this.selectedModelId = modelId;
    this.contactForm.patchValue({ modeloInteres: modelId });
    this.recalculateQuote();
  }

  setChassisColor(color: 'blanco' | 'negro'): void {
    this.chassisColor = color;
    if (color === 'negro' && this.serigraphyColor === 'negro') {
      this.serigraphyColor = 'blanco';
    } else if (color === 'blanco' && this.serigraphyColor === 'blanco') {
      this.serigraphyColor = 'azul';
    }
  }

  setSerigraphyColor(color: 'azul' | 'verde' | 'negro' | 'blanco'): void {
    this.serigraphyColor = color;
  }

  onQuantityChange(qty: number): void {
    this.orderQuantity = Math.max(20, Math.min(5000, Number(qty) || 50));
    this.contactForm.patchValue({ cantidadEstimada: this.orderQuantity });
    this.recalculateQuote();
  }

  recalculateQuote(): void {
    const model = this.currentSelectedModel;
    const qty = this.orderQuantity;
    const base = model.basePriceMxn;

    if (qty < 50) {
      this.discountPercentage = 0;
      this.freeSerigraphy = false;
      this.freePreconfig = false;
      this.freeCustomBoxes = false;
      this.unitPrice = base;
    } else if (qty < 100) {
      this.discountPercentage = 4;
      this.freeSerigraphy = false;
      this.freePreconfig = false;
      this.freeCustomBoxes = false;
      this.unitPrice = Math.round(base * 0.96);
    } else if (qty < 250) {
      this.discountPercentage = 8;
      this.freeSerigraphy = true;
      this.freePreconfig = false;
      this.freeCustomBoxes = false;
      this.unitPrice = Math.round(base * 0.92);
    } else if (qty < 500) {
      this.discountPercentage = 14;
      this.freeSerigraphy = true;
      this.freePreconfig = true;
      this.freeCustomBoxes = false;
      this.unitPrice = Math.round(base * 0.86);
    } else {
      this.discountPercentage = 22;
      this.freeSerigraphy = true;
      this.freePreconfig = true;
      this.freeCustomBoxes = true;
      this.unitPrice = Math.round(base * 0.78);
    }

    this.totalInvestment = this.unitPrice * qty;
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  volverAlInicio(): void {
    this.router.navigate(['/']);
  }

  solicitarMuestraDirecta(): void {
    this.scrollToSection('contacto');
  }

  abrirWhatsAppCotizacion(): void {
    const modelName = this.currentSelectedModel.name;
    const text = encodeURIComponent(
      `Hola Emenet / Digit-all, me interesa cotizar un lote de ${this.orderQuantity} ONTs Personalizadas:\n` +
      `• Modelo: ${modelName}\n` +
      `• Nombre del ISP: ${this.ispName}\n` +
      `• Color del Chasis: ${this.chassisColor}\n` +
      `• Inversión estimada: $${this.totalInvestment.toLocaleString('es-MX')} MXN\n` +
      `¿Me pueden brindar más información y los requisitos para la muestra de prueba?`
    );
    window.open(`https://api.whatsapp.com/send?phone=523315758066&text=${text}`, '_blank');
  }

  onFormSubmit(): void {
    this.formSubmitted = true;
    if (this.contactForm.invalid) {
      return;
    }

    const payload = {
      ...this.contactForm.value,
      ispNameSimulado: this.ispName,
      modeloElegido: this.currentSelectedModel.name,
      chassisColor: this.chassisColor,
      precioUnitarioEstimado: this.unitPrice,
      inversionEstimada: this.totalInvestment
    };

    console.log('Solicitud de cotización de ONTs registrada:', payload);

    const text = encodeURIComponent(
      `*Solicitud de Cotización ONTs Personalizadas - Digit-all / Emenet*\n\n` +
      `• *Contacto:* ${payload.nombre}\n` +
      `• *Empresa / ISP:* ${payload.empresa}\n` +
      `• *Teléfono:* ${payload.telefono}\n` +
      `• *Correo:* ${payload.correo}\n` +
      `• *Modelo Solicitado:* ${payload.modeloElegido}\n` +
      `• *Cantidad:* ${payload.cantidadEstimada} unidades\n` +
      `• *Comentarios:* ${payload.comentarios || 'Solicito muestra y cotización'}`
    );

    this.envioExitoso = true;

    setTimeout(() => {
      window.open(`https://api.whatsapp.com/send?phone=523315758066&text=${text}`, '_blank');
    }, 400);
  }
}