import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { icon } from 'leaflet';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';

@Component({
  selector: 'app-mobile',
  imports: [AnimateOnScrollModule, CommonModule],
  templateUrl: './mobile.component.html',
  styleUrl: './mobile.components.scss'
})
export class MobileComponent {
  telefonia: any = [
    {
      titulo: "Cobertura Nacional",
      descripcion: "Disfruta de una amplia cobertura nacional con velocidad y estabilidad.",
      icon: "pi-map",
    },
    {
      titulo: "Comparte internet",
      descripcion: "Comparte tus datos con otros dispositivos cercanos.",
      icon: "pi-wifi",
    },
    {
      titulo: "Conserva tu número",
      descripcion: "Trámite de portabilidad fácil en menos de 48 horas habiles.",
      icon: "pi-mobile",
    },
    {
      titulo: "Sin plazos forzosos",
      descripcion: "Libre de cambiar de paquete o cancelar cuando quieras.",
      icon: "pi-sync"
    },
    {
      titulo: "Gigas de regalo",
      descripcion: "Recibe el doble de datos al portar tu numero.",
      icon: "pi-gift"
    }
  ];
  abrirMobile(){
    window.open('https://mobile.emenet.mx', '_blank')
  }
}
