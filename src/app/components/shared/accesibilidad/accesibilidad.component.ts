import { Component, Inject, PLATFORM_ID } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { SidebarModule } from "primeng/sidebar";
import { TooltipModule } from "primeng/tooltip";

@Component({
  selector: "app-accesibilidad",
  standalone: true,
  imports: [CommonModule, ButtonModule, SidebarModule, TooltipModule],
  templateUrl: "./accesibilidad.component.html",
  styleUrl: "./accesibilidad.component.scss",
})
export class AccesibilidadComponent {
  panelVisible: boolean = false;

  // Estados de las herramientas
  tamanoTexto: number = 100; // Porcentaje
  escalaGrises: boolean = false;
  altoContraste: boolean = false;
  contrasteNegativo: boolean = false;
  fondoClaro: boolean = false;
  subrayarLinks: boolean = false;
  fuenteLegible: boolean = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  togglePanel() {
    this.panelVisible = !this.panelVisible;
  }

  // Aumentar tamaño de texto
  crecerTexto() {
    if (this.tamanoTexto < 150) {
      this.tamanoTexto += 10;
      this.aplicarTamanoTexto();
    }
  }

  // Reducir tamaño de texto
  reducirTexto() {
    if (this.tamanoTexto > 80) {
      this.tamanoTexto -= 10;
      this.aplicarTamanoTexto();
    }
  }

  private aplicarTamanoTexto() {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.style.fontSize = `${this.tamanoTexto}%`;
    }
  }

  // Escala de grises
  toggleEscalaGrises() {
    this.escalaGrises = !this.escalaGrises;
    if (isPlatformBrowser(this.platformId)) {
      if (this.escalaGrises) {
        document.documentElement.style.filter = "grayscale(100%)";
      } else {
        document.documentElement.style.filter = "none";
      }
    }
  }

  // Alto contraste
  toggleAltoContraste() {
    this.altoContraste = !this.altoContraste;
    if (isPlatformBrowser(this.platformId)) {
      if (this.altoContraste) {
        document.body.classList.add("alto-contraste");
      } else {
        document.body.classList.remove("alto-contraste");
      }
    }
  }

  // Contraste negativo
  toggleContrasteNegativo() {
    this.contrasteNegativo = !this.contrasteNegativo;
    if (isPlatformBrowser(this.platformId)) {
      if (this.contrasteNegativo) {
        document.documentElement.style.filter = "invert(1) hue-rotate(180deg)";
      } else {
        document.documentElement.style.filter = "none";
      }
    }
  }

  // Fondo claro
  toggleFondoClaro() {
    this.fondoClaro = !this.fondoClaro;
    if (isPlatformBrowser(this.platformId)) {
      if (this.fondoClaro) {
        document.body.classList.add("fondo-claro");
      } else {
        document.body.classList.remove("fondo-claro");
      }
    }
  }

  // Subrayar enlaces
  toggleSubrayarLinks() {
    this.subrayarLinks = !this.subrayarLinks;
    if (isPlatformBrowser(this.platformId)) {
      if (this.subrayarLinks) {
        document.body.classList.add("subrayar-links");
      } else {
        document.body.classList.remove("subrayar-links");
      }
    }
  }

  // Fuente legible
  toggleFuenteLegible() {
    this.fuenteLegible = !this.fuenteLegible;
    if (isPlatformBrowser(this.platformId)) {
      if (this.fuenteLegible) {
        document.body.classList.add("fuente-legible");
      } else {
        document.body.classList.remove("fuente-legible");
      }
    }
  }

  // Reiniciar todas las configuraciones
  reiniciar() {
    this.tamanoTexto = 100;
    this.escalaGrises = false;
    this.altoContraste = false;
    this.contrasteNegativo = false;
    this.fondoClaro = false;
    this.subrayarLinks = false;
    this.fuenteLegible = false;

    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.style.fontSize = "100%";
      document.documentElement.style.filter = "none";
      document.body.classList.remove(
        "alto-contraste",
        "fondo-claro",
        "subrayar-links",
        "fuente-legible"
      );
    }
  }
}
