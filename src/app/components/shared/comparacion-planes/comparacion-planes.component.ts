import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { TooltipModule } from "primeng/tooltip";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-comparacion-planes",
  standalone: true,
  imports: [CommonModule, ButtonModule, CheckboxModule, FormsModule, TooltipModule],
  templateUrl: "./comparacion-planes.component.html",
  styleUrl: "./comparacion-planes.component.scss",
})
export class ComparacionPlanesComponent {
  @Input() planes: any[] = [];
  @Output() contratar = new EventEmitter<any>();

  seleccionados = new Set<number>();
  aviso: string | null = null;

  get planesMostrados(): any[] {
    // Si hay selección, mostramos exactamente 2-3 planes.
    if (this.seleccionados.size > 0) {
      const indices = Array.from(this.seleccionados).sort((a, b) => a - b);
      // Si hay solo 1 seleccionado, intentamos completar a 2 con el siguiente disponible
      if (indices.length === 1) {
        const extra = this.buscarSiguienteNoSeleccionado(indices[0]);
        if (extra !== null) indices.push(extra);
        this.aviso = 'Selecciona al menos 2 y máximo 3 planes para comparar.';
      } else if (indices.length === 2) {
        this.aviso = null; // válido
      } else if (indices.length === 3) {
        this.aviso = null; // válido
      }
      return indices.map((i) => this.planes[i]);
    }
    // Sin selección: muestra 3 por defecto o los que haya.
    this.aviso = 'Selecciona 2 a 3 planes para una comparación personalizada.';
    return this.planes.slice(0, Math.min(3, this.planes.length));
  }

  getCaracteristicasUnicas() {
    const todasCaracteristicas = this.planes.flatMap(
      (plan: any) => plan.caracteristicas || [],
    );
    const unicas: any[] = [];
    const vistas = new Set<string>();

    for (const caracteristica of todasCaracteristicas) {
      if (caracteristica && !vistas.has(caracteristica.detalle)) {
        vistas.add(caracteristica.detalle);
        unicas.push(caracteristica);
      }
    }

    return unicas;
  }

  tieneCaracteristica(plan: any, nombreCaracteristica: string): boolean {
    return (plan.caracteristicas || []).some(
      (c: any) => c.detalle === nombreCaracteristica,
    );
  }

  toggleSeleccion(index: number, checked: boolean) {
    if (checked) {
      if (this.seleccionados.has(index)) return;
      if (this.seleccionados.size >= 3) {
        // No permitir más de 3
        this.aviso = 'Solo puedes comparar hasta 3 planes a la vez.';
        return;
      }
      this.seleccionados.add(index);
      this.aviso = null;
    } else {
      this.seleccionados.delete(index);
      if (this.seleccionados.size > 0 && this.seleccionados.size < 2) {
        this.aviso = 'Selecciona al menos 2 y máximo 3 planes para comparar.';
      } else {
        this.aviso = null;
      }
    }
  }

  onContratar(plan: any) {
    this.contratar.emit(plan);
  }

  // --- Métricas adicionales ---
  getVelocidadBajada(plan: any): number | null {
    if (plan?.velocidadBajada) return plan.velocidadBajada;
    // Intenta inferir desde nombre o características
    const fuentes = [plan?.nombre, ...(plan?.caracteristicas || []).map((c: any) => `${c.detalle} ${c.descripcion || ''}`)];
    for (const f of fuentes) {
      if (!f) continue;
      const m = String(f).match(/(\d{2,4})/);
      if (m) return Number(m[1]);
    }
    return null;
  }

  getVelocidadSubida(plan: any): number | null {
    if (plan?.velocidadSubida) return plan.velocidadSubida;
    // Si es simétrico, usar bajada
    const simetrico = (plan?.caracteristicas || []).some((c: any) => /simetr/i.test(c.detalle + ' ' + (c.descripcion || '')));
    const bajada = this.getVelocidadBajada(plan);
    return simetrico ? bajada : bajada; // si no hay dato, devolvemos mismo valor como estimación
  }

  getLatencia(plan: any): string {
    // Usar el valor exacto de latencia definido en el plan
    if (plan?.latencia) return plan.latencia;
    
    // Si no hay valor definido, calcular uno basado en la velocidad
    const v = this.getVelocidadBajada(plan) || 100;
    if (v >= 500) return '5-10 ms';
    if (v >= 300) return '8-15 ms';
    if (v >= 200) return '10-20 ms';
    return '15-25 ms';
  }

  tieneInstalacionGratis(plan: any): boolean {
    // Forzar habilitado como solicitado
    return true;
  }

  equipoIncluido(plan: any): boolean {
    // Forzar habilitado como solicitado
    return true;
  }

  soporte24x7(plan: any): boolean {
    // Forzar habilitado como solicitado
    return true;
  }

  // Badges
  esMejorValor(plan: any): boolean {
    if (!this.planes?.length) return false;
    const minPrecio = Math.min(...this.planes.map((p: any) => p.precio || Infinity));
    return plan?.precio === minPrecio;
  }

  esMasRapido(plan: any): boolean {
    if (!this.planes?.length) return false;
    const velocidades = this.planes.map((p: any) => this.getVelocidadBajada(p) || 0);
    const maxVel = Math.max(...velocidades);
    return (this.getVelocidadBajada(plan) || 0) === maxVel;
  }

  exportarComparacion(): void {
    window.print();
  }

  private buscarSiguienteNoSeleccionado(baseIndex: number): number | null {
    for (let i = 0; i < this.planes.length; i++) {
      if (!this.seleccionados.has(i) && i !== baseIndex) return i;
    }
    return null;
  }
}
