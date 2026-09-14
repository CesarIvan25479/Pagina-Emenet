import { Component } from '@angular/core';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { PreloaderService } from '../../../services/preloader.service';
import { GalleriaModule } from 'primeng/galleria';

@Component({
  selector: 'app-sobre-nosotros',
  imports: [ButtonModule, GalleriaModule],
  styleUrl: "./sobre-nosotros.component.scss",
  templateUrl: './sobre-nosotros.component.html',
})
export class SobreNosotrosComponent {
  constructor(
    private preloader: PreloaderService,
    public router: Router
  ) {
    this.preloader.actualizarClases(true);
  }
  fotos = [
  {
    "url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80",
    "categoria": "Infraestructura",
    "titulo": "Centro de Datos y Racks",
    "descripcion": "Enrutadores y switches principales con gestión de tráfico en tiempo real."
  },
  {
    "url": "https://images.unsplash.com/photo-1520869562399-e772f142f422?auto=format&fit=crop&w=1200&q=80",
    "categoria": "Fibra Óptica",
    "titulo": "Despliegue y Conectividad",
    "descripcion": "Tendido de fibra para garantizar baja latencia y alta disponibilidad."
  },
  {
    "url": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    "categoria": "Telecomunicaciones",
    "titulo": "Torres y Enlaces Inalámbricos",
    "descripcion": "Estaciones base para cobertura de largo alcance en zonas urbanas y rurales."
  },
  {
    "url": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1200&q=80",
    "categoria": "Equipo Técnico",
    "titulo": "Soporte e Instalaciones",
    "descripcion": "Personal capacitado para mantenimiento correctivo y preventivo en sitio."
  },
  {
    "url": "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
    "categoria": "Atención al Cliente",
    "titulo": "Monitoreo y Centro de Soporte",
    "descripcion": "Supervisión continua de la red para resolver incidencias de inmediato."
  }
]

opcionesResponsivas: any[] = [
  {
    breakpoint: '1024px',
    numVisible: 4
  },
  {
    breakpoint: '768px',
    numVisible: 3
  },
  {
    breakpoint: '560px',
    numVisible: 2
  }
];
}
