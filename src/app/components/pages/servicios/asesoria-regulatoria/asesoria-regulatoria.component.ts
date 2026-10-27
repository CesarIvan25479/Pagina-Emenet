import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PreloaderService } from '../../../../services/preloader.service';

export interface RegulatoryScenario {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  riskLevel: 'ALTO RIESGO' | 'RIESGO CRÍTICO' | 'RIESGO MEDIO' | 'CUMPLIMIENTO' | 'INICIO SEGURO';
  riskType: 'danger' | 'critical' | 'warning' | 'info' | 'success';
  riskPenalty: string;
  legalBasis: string;
  solucionEmenet: string;
  tiempoEstimado: string;
  pasos: string[];
  beneficioClave: string;
}

export interface RegulatoryServiceCard {
  id: string;
  entidad: 'CRT' | 'PROFECO' | 'CFE' | 'IAR';
  badge: string;
  title: string;
  icon?: string;
  description?: string;
  destacado?: boolean;
}

@Component({
  selector: 'app-asesoria-regulatoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './asesoria-regulatoria.component.html',
  styleUrl: './asesoria-regulatoria.component.scss'
})
export class AsesoriaRegulatoriaComponent implements OnInit {
  contactForm!: FormGroup;
  formSubmitted = false;
  envioExitoso = false;

  // ===== Simulador y Semáforo Regulatorio =====
  selectedScenarioId: string = 'wisp_sin_concesion';

  scenarios: RegulatoryScenario[] = [
    {
      id: 'wisp_sin_concesion',
      badge: 'Escenario Crítico #1',
      title: 'Opero Red WISP o Fibra sin Concesión Única',
      subtitle: 'Comercialización de acceso a internet sin título habilitante formal de la CRT',
      riskLevel: 'ALTO RIESGO',
      riskType: 'danger',
      riskPenalty: 'Multas de hasta el 4% al 10% de los ingresos acumulables o decomiso definitivo de infraestructura (torres, enlaces, routers).',
      legalBasis: 'Arts. 66, 289 y 298 de la Ley Federal de Telecomunicaciones y Radiodifusión (LFTR)',
      solucionEmenet: 'Tramitación llave en mano de la Concesión Única para Uso Comercial. Preparamos el proyecto técnico-económico, memoria descriptiva de red y expediente legal.',
      tiempoEstimado: '60 a 90 días hábiles',
      pasos: [
        'Diagnóstico topológico de frecuencias y capacidad de red',
        'Elaboración de memoria técnica y carpeta financiera avalada',
        'Gestión integral ante oficialía de partes de la CRT hasta resolución'
      ],
      beneficioClave: 'Operación 100% blindada contra visitas de inspección y decomisos'
    },
    {
      id: 'fibra_posteria_cfe',
      badge: 'Escenario Crítico #2',
      title: 'Tiendo Fibra Óptica en Postes CFE sin Contrato',
      subtitle: 'Despliegue aéreo en infraestructura pasiva de CFE Distribución sin convenio',
      riskLevel: 'RIESGO CRÍTICO',
      riskType: 'critical',
      riskPenalty: 'Corte forzoso y retiro inmediato del cableado de fibra, retención de herrajes y cobro retroactivo punitivo de rentas.',
      legalBasis: 'Disposiciones de la CRE y Lineamientos de Acceso a Infraestructura Pasiva CFE TEIT / CFE Distribución',
      solucionEmenet: 'Censo y georreferenciación de postes, dictamen mecánico de carga, proyecto ejecutivo de postería y suscripción del Convenio de Arrendamiento con CFE.',
      tiempoEstimado: '30 a 45 días hábiles',
      pasos: [
        'Levantamiento fotográfico y georreferenciado de cada poste utilizado',
        'Cálculo de cargas mecánicas y entrega de planos ejecutivos',
        'Negociación de contrato y regularización de pagos ante CFE'
      ],
      beneficioClave: 'Evita cortes intempestivos que dejen sin servicio a tus abonados'
    },
    {
      id: 'sin_profeco_rpc',
      badge: 'Escenario Operativo #3',
      title: 'Cobro a Clientes sin Contrato Registrado en PROFECO',
      subtitle: 'Venta de paquetes residenciales o comerciales sin Contrato de Adhesión avalado',
      riskLevel: 'RIESGO MEDIO',
      riskType: 'warning',
      riskPenalty: 'Multas acumulativas de PROFECO por usuario inconforme, suspensiones cautelares de cobranza y sellos de advertencia.',
      legalBasis: 'Arts. 65, 86 y 128 de la Ley Federal de Protección al Consumidor y NOM-184-SCFI-2018',
      solucionEmenet: 'Redacción personalizada del Contrato de Adhesión, Carta de Derechos Mínimos y Código de Prácticas Comerciales con registro exitoso en el RPC de PROFECO.',
      tiempoEstimado: '20 a 30 días hábiles',
      pasos: [
        'Adaptación de cláusulas a tus políticas de corte, cobro y soporte',
        'Registro digital ante la Dirección General de Contratos de Adhesión de PROFECO',
        'Entrega de plantillas de cobranza y contratos listos para firma de clientes'
      ],
      beneficioClave: 'Protección legal total ante quejas o disputas de consumidores'
    },
    {
      id: 'concesion_cumplimiento',
      badge: 'Mantenimiento Legal #4',
      title: 'Tengo Concesión pero adeudo Reportes Anuales CRT',
      subtitle: 'Obligaciones periódicas no reportadas (SIER, SEI, tarifas en RPP)',
      riskLevel: 'CUMPLIMIENTO',
      riskType: 'info',
      riskPenalty: 'Procedimiento de pérdida o revocación de la concesión y sanciones por incumplimiento de entrega de información estadística.',
      legalBasis: 'Lineamientos de Información Estadística y Registro de Tarifas en el RPP de la CRT',
      solucionEmenet: 'Póliza de Regularización y Mantenimiento Regulatorio. Subimos tus reportes trimestrales en el SIER, actualizamos tus tarifas en el RPP y acreditamos pagos de derechos.',
      tiempoEstimado: '10 a 15 días hábiles',
      pasos: [
        'Auditoría y conciliación de obligaciones pendientes con la CRT',
        'Generación y carga de reportes en plataformas SIER y SEI',
        'Emisión de constancia oficial de concesión al corriente'
      ],
      beneficioClave: 'Mantén tu Concesión Única con calificación impecable ante la autoridad'
    },
    {
      id: 'nuevo_isp_legal',
      badge: 'Emprendimiento #5',
      title: 'Quiero Fundar mi ISP o Revender Enlaces Legalmente',
      subtitle: 'Nuevo proyecto de telecomunicaciones con figura jurídica constituida y blindada',
      riskLevel: 'INICIO SEGURO',
      riskType: 'success',
      riskPenalty: 'Cero riesgos. Empieza con la figura jurídica correcta desde el día uno y accede a financiamientos o créditos gubernamentales.',
      legalBasis: 'Ley Federal de Telecomunicaciones y Radiodifusión (LFTR)',
      solucionEmenet: 'Estructuración integral de telecomunicaciones: asesoría corporativa, obtención de Concesión Única o Autorización de Comercializadora y contratos de mayoreo.',
      tiempoEstimado: '45 a 60 días hábiles',
      pasos: [
        'Análisis de viabilidad técnica y elección del título idóneo',
        'Armado del expediente técnico y societario ante la CRT',
        'Lanzamiento operativo con respaldo legal garantizado'
      ],
      beneficioClave: 'Certeza jurídica para atraer inversión y crecer sin miedo a revisiones'
    }
  ];

  // ===== Calculadora / Cotizador Interactivo =====
  tipoRed: 'wisp' | 'ftth' | 'hibrida' | 'comercializadora' = 'ftth';
  numAbonados: number = 350;

  tramitesSeleccionados = {
    concesionIft: true,
    convenioCfe: true,
    contratoProfeco: true,
    polizaAnual: false
  };

  inversionEstimada: number = 0;
  ahorroMultas: number = 0;
  tiempoTotalResolucion: string = '45 - 60 días hábiles';

  // ===== Catálogo de Servicios Regulatorios =====
  servicios: RegulatoryServiceCard[] = [
    {
      id: 'concesion-unica',
      entidad: 'CRT',
      badge: 'Trámite Estrella',
      title: 'Concesión Única para Uso Comercial',
      icon: 'pi-id-card',
      destacado: true
    },
    {
      id: 'convenio-cfe',
      entidad: 'CFE',
      badge: 'Infraestructura Pasiva',
      title: 'Convenio de Postería y Ductos CFE',
      icon: 'pi-bolt',
      destacado: true
    },
    {
      id: 'contratos-profeco',
      entidad: 'PROFECO',
      badge: 'Protección Comercial',
      title: 'Contrato de Adhesión & Registro RPC',
      icon: 'pi-shield'
    },
    {
      id: 'reportes-sier',
      entidad: 'CRT',
      badge: 'Cumplimiento Continuo',
      title: 'Gestión Anual y Trimestral SIER / SEI',
      icon: 'pi-chart-line'
    },
    {
      id: 'defensa-juridica',
      entidad: 'CRT',
      badge: 'Defensa Especializada',
      title: 'Atención a Inspecciones y Requerimientos',
      icon: 'pi-briefcase'
    },
    {
      id: 'comercializadora-virtual',
      entidad: 'CRT',
      badge: 'Nueva Figura',
      title: 'Autorización de Comercializadora',
      icon: 'pi-globe'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private preloader: PreloaderService
  ) {
    this.contactForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      empresa: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9+\s\-()]{8,20}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      servicioInteres: ['concesion-unica', [Validators.required]],
      numAbonadosForm: [350, [Validators.required, Validators.min(10)]],
      comentarios: ['']
    });

    setTimeout(() => {
      this.preloader.hide();
    }, 400);
  }

  ngOnInit(): void {
    this.recalculateRegulatoryQuote();
  }

  get currentScenario(): RegulatoryScenario {
    return this.scenarios.find(s => s.id === this.selectedScenarioId) || this.scenarios[0];
  }

  selectScenario(scenarioId: string): void {
    this.selectedScenarioId = scenarioId;
  }

  setTipoRed(tipo: 'wisp' | 'ftth' | 'hibrida' | 'comercializadora'): void {
    this.tipoRed = tipo;
    if (tipo === 'wisp') {
      this.tramitesSeleccionados.convenioCfe = false;
    } else if (tipo === 'ftth') {
      this.tramitesSeleccionados.convenioCfe = true;
    }
    this.recalculateRegulatoryQuote();
  }

  onAbonadosChange(val: number): void {
    this.numAbonados = Number(val);
    this.contactForm.patchValue({ numAbonadosForm: this.numAbonados });
    this.recalculateRegulatoryQuote();
  }

  toggleTramite(tramiteKey: 'concesionIft' | 'convenioCfe' | 'contratoProfeco' | 'polizaAnual'): void {
    this.tramitesSeleccionados[tramiteKey] = !this.tramitesSeleccionados[tramiteKey];
    this.recalculateRegulatoryQuote();
  }

  recalculateRegulatoryQuote(): void {
    let base = 0;
    let diasMin = 20;
    let diasMax = 30;

    if (this.tramitesSeleccionados.concesionIft) {
      base += 38000;
      diasMax = Math.max(diasMax, 75);
    }

    if (this.tramitesSeleccionados.convenioCfe) {
      const cfeBase = 18000 + Math.min(25000, Math.round(this.numAbonados * 15));
      base += cfeBase;
      diasMax = Math.max(diasMax, 45);
    }

    if (this.tramitesSeleccionados.contratoProfeco) {
      base += 12500;
      diasMax = Math.max(diasMax, 30);
    }

    if (this.tramitesSeleccionados.polizaAnual) {
      base += 16000;
    }

    const activos = Object.values(this.tramitesSeleccionados).filter(Boolean).length;
    let factor = 1.0;
    if (activos >= 3) {
      factor = 0.85;
    } else if (activos === 2) {
      factor = 0.92;
    }

    this.inversionEstimada = Math.round(base * factor);

    const factorRiesgo = this.tipoRed === 'ftth' ? 850 : 620;
    this.ahorroMultas = Math.round(180000 + (this.numAbonados * factorRiesgo));

    if (activos === 0) {
      this.tiempoTotalResolucion = 'Selecciona al menos un trámite';
    } else {
      this.tiempoTotalResolucion = `${diasMin} a ${diasMax} días hábiles`;
    }
  }

  selectService(servicioId: string): void {
    this.contactForm.patchValue({ servicioInteres: servicioId });
    this.scrollToSection('contacto');
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

  abrirWhatsAppCotizacion(): void {
    const listadoTramites: string[] = [];
    if (this.tramitesSeleccionados.concesionIft) listadoTramites.push('Concesión Única Comercial CRT');
    if (this.tramitesSeleccionados.convenioCfe) listadoTramites.push('Convenio de Postería CFE');
    if (this.tramitesSeleccionados.contratoProfeco) listadoTramites.push('Contrato de Adhesión PROFECO');
    if (this.tramitesSeleccionados.polizaAnual) listadoTramites.push('Póliza de Cumplimiento Anual');

    const text = encodeURIComponent(
      `Hola Emenet Legal, me interesa una Asesoría y Cotización Regulatoria para mi red:\n` +
      `• Tipo de Red: ${this.tipoRed.toUpperCase()}\n` +
      `• Número de abonados: ~${this.numAbonados}\n` +
      `• Trámites solicitados: ${listadoTramites.join(', ') || 'Diagnóstico integral'}\n` +
      `• Inversión estimada: $${this.inversionEstimada.toLocaleString('es-MX')} MXN\n` +
      `• Situación actual: ${this.currentScenario.title}\n\n` +
      `¿Me pueden brindar una primera sesión de diagnóstico y los requisitos necesarios?`
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
      tipoRed: this.tipoRed,
      situacionActual: this.currentScenario.title,
      inversionEstimada: this.inversionEstimada
    };

    console.log('Solicitud de Asesoría Regulatoria registrada:', payload);

    const text = encodeURIComponent(
      `*Solicitud de Asesoría Regulatoria - Emenet Legal*\n\n` +
      `• *Contacto:* ${payload.nombre}\n` +
      `• *Empresa / ISP:* ${payload.empresa}\n` +
      `• *WhatsApp:* ${payload.telefono}\n` +
      `• *Correo:* ${payload.correo}\n` +
      `• *Servicio:* ${payload.servicioInteres}\n` +
      `• *Tipo de Red:* ${payload.tipoRed}\n` +
      `• *Abonados:* ${payload.numAbonadosForm}\n` +
      `• *Situación:* ${payload.situacionActual}\n` +
      `• *Comentarios:* ${payload.comentarios || 'Solicito diagnóstico regulatorio gratuito'}`
    );

    this.envioExitoso = true;

    setTimeout(() => {
      window.open(`https://api.whatsapp.com/send?phone=523315758066&text=${text}`, '_blank');
    }, 400);
  }
}
