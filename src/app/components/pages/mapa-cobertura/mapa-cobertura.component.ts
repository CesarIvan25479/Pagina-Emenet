import {
  Component,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { GeoJsonObject } from 'geojson';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { StreeMapService } from '../../../services/stree-map.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { finalize } from 'rxjs';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { CoberturaService } from '../../../services/cobertura.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-mapa-cobertura',
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule, AnimateOnScrollModule],
  templateUrl: './mapa-cobertura.component.html',
  styleUrl: './mapa-cobertura.component.scss',
})
export class MapaCoberturaComponent  {
  cobertura!: boolean;
  verMensaje: boolean = false;
  resultadosBusqueda: any[] = [];
  busquedaActiva: boolean = false;
  errorBusqueda: boolean = false;
  progreso: boolean = false;
  formUbicacion!: FormGroup;

  private map: any;
  private L: any;


  constructor(
    private coberturaService: CoberturaService,
    private fb: FormBuilder,
    private apiStreet: StreeMapService,
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,) {
      this.formUbicacion = this.fb.group({
        ubicacion: [''],
        coordenadas: [''],
      });
  }

  protected buscarZonas(): void {
    if(this.progreso) return;
    this.progreso = true;
    this.verMensaje = false;
    this.apiStreet.buscarCoordenadas(this.formUbicacion.value.ubicacion).pipe(
      finalize(() => {
        this.busquedaActiva = true
        this.progreso = false;
      })
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

    this.verificarCobertura(ubicacion.lat, ubicacion.lon);
  }


  async verificarCobertura(lat: number, lon: number) {
    this.verMensaje = true;
    const dentro = await this.coberturaService.pointInCoverage(lat, lon);
    if (dentro) {
      this.cobertura = true;
    } else {
      this.cobertura = false;
    }
    setTimeout(() => {
      const cobertura = document.getElementById('mensaje-cobertura');
      if (cobertura) {
        window.scrollTo({
          top: cobertura.offsetTop - 480,
          behavior: 'smooth',
        });
      }
    }, 100);
  }

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      this.initMap();

      this.http.get<GeoJsonObject>('cobertura.geojson').subscribe((geojsonData) => {
          const capa = this.L.geoJSON(geojsonData).addTo(this.map);
          this.map.fitBounds(capa.getBounds());
      });
    }
  }

  private async initMap(): Promise<void> {
    this.map = this.L.map('map').setView([19.168945072391274, -99.4850132967743],10);
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'<a href="https://www.m-net.mx">Emenet Comunicacion</a> Cobertura-Emenet',
      maxZoom: 18,
    }).addTo(this.map);

    this.L.control.scale().addTo(this.map);
  }
}
