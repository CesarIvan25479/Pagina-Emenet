import {
  AfterViewInit,
  Component,
  Inject,
  OnChanges,
  PLATFORM_ID,
  SimpleChanges,
  Input,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GeoJsonObject } from 'geojson';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { StreeMapService } from '../../../services/stree-map.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
@Component({
  selector: 'app-mapa-cobertura',
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule],
  templateUrl: './mapa-cobertura.component.html',
  styleUrl: './mapa-cobertura.component.scss',
})
export class MapaCoberturaComponent  {

  resultadosBusqueda: any[] = [];
  busquedaActiva: boolean = false;
  errorBusqueda: boolean = false;
  formUbicacion!: FormGroup;

  private map: any;
  private L: any;


  constructor(
    private fb: FormBuilder,
    private apiStreet: StreeMapService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,) {
      this.formUbicacion = this.fb.group({
        ubicacion: [''],
        coordenadas: [''],
      });
  }

  protected buscarZonas(): void {
    this.apiStreet.buscarCoordenadas(this.formUbicacion.value.ubicacion).pipe(
      finalize(() => this.busquedaActiva = true)
    ).subscribe({
      next: (response) => {
          this.resultadosBusqueda = response;
          this.errorBusqueda = false;
        },error: () => this.errorBusqueda = true,
      });
  }

  private marcadorActual: any = null;
    protected seleccionUbicacion(index: number) {
    const ubicacion = this.resultadosBusqueda[index];
    if (!this.map) return;
    if (this.marcadorActual) {
      this.map.removeLayer(this.marcadorActual);
    }

    this.marcadorActual = this.L.marker([ubicacion.lat, ubicacion.lon])
      .addTo(this.map)
      .bindPopup(`<strong>Ubicación Seleccionada</strong><br>${ubicacion.display_name ||
        'Dirección no disponible'}
      `)
      .openPopup();

    this.map.setView([ubicacion.lat, ubicacion.lon], 15);
  }

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      this.initMap(this.L);

      this.http.get<GeoJsonObject>('cobertura.geojson').subscribe((geojsonData) => {
          const capa = this.L.geoJSON(geojsonData).addTo(this.map);
          this.map.fitBounds(capa.getBounds());
      });
    }
  }

  private async initMap(L: any): Promise<void> {
    this.map = L.map('map').setView([19.168945072391274, -99.4850132967743],10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'<a href="https://www.m-net.mx">Emenet Comunicacion</a> Cobertura-Emenet',
      maxZoom: 18,
    }).addTo(this.map);

    L.control.scale().addTo(this.map);
    console.log(this.map)
  }
}
