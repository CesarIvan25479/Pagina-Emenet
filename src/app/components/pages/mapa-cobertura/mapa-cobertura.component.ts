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
import { EnviarMensajeService } from '../../../services/enviar-mensaje.service';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-mapa-cobertura',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    AnimateOnScrollModule,
    DialogModule
  ],
  templateUrl: './mapa-cobertura.component.html',
  styleUrl: './mapa-cobertura.component.scss',
})
export class MapaCoberturaComponent {
  cobertura!: boolean;
  verMensaje: boolean = false;
  resultadosBusqueda: any[] = [];
  busquedaActiva: boolean = false;
  errorBusqueda: boolean = false;
  progreso: boolean = false;
  formUbicacion!: FormGroup;
  marcadorSeleccionado: any = null;

  private map: any;
  private marcadorActual: any = null;
  private L: any;

  constructor(
    private coberturaService: CoberturaService,
    private fb: FormBuilder,
    private apiStreet: StreeMapService,
    protected enviarMensajeService: EnviarMensajeService,
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {
    this.formUbicacion = this.fb.group({
      ubicacion: [''],
      coordenadas: [''],
    });
  }

  protected buscarZonas(): void {
    if (this.progreso) return;
    this.progreso = true;
    this.verMensaje = false;

    this.apiStreet.buscarPorDatos(this.formUbicacion.value.ubicacion)
      .pipe(finalize(() => {
        this.busquedaActiva = true;
        this.progreso = false;
      }))
      .subscribe({
        next: (response) => {
          if(Array.isArray(response)){
            this.resultadosBusqueda = response;
          }else{
            this.resultadosBusqueda = [response];
          }

          this.errorBusqueda = false;
        },
        error: () => this.errorBusqueda = true,
      });
  }

  protected seleccionUbicacion(index: number) {
    const ubicacion = this.resultadosBusqueda[index];
    const direccion = ubicacion.address;
    if(direccion){
       localStorage.setItem('direccionCobertura', JSON.stringify(direccion));
       localStorage.setItem('coordenadasCobertura', `${ubicacion.lat},${ubicacion.lon}`);
    }
    if (!this.map || !this.L) return;

    if (this.marcadorActual) {
      this.map.removeLayer(this.marcadorActual);
    }

    this.marcadorActual = this.L.marker([ubicacion.lat, ubicacion.lon])
      .addTo(this.map)
      .bindPopup(`
        <strong>Ubicación Seleccionada</strong><br>
        ${ubicacion.display_name || 'Dirección no disponible'}
      `)
      .openPopup();

    this.map.setView([ubicacion.lat, ubicacion.lon], 15);
    this.verificarCobertura(ubicacion.lat, ubicacion.lon);
  }

  async verificarCobertura(lat: number, lon: number) {
    const dentro = await this.coberturaService.pointInCoverage(lat, lon);
    this.cobertura = dentro;
    this.verMensaje = true;
    // setTimeout(() => {
    //   const cobertura = document.getElementById('mensaje-cobertura');
    //   if (cobertura) {
    //     window.scrollTo({
    //       top: cobertura.offsetTop - 480,
    //       behavior: 'smooth',
    //     });
    //   }
    // }, 100);
  }

 async ngAfterViewInit(): Promise<void> {
  if (isPlatformBrowser(this.platformId)) {
    const leafletModule = await import('leaflet');
    this.L = leafletModule.default || leafletModule;

    setTimeout(() => {
      this.initMap();

      this.http.get<GeoJsonObject>('cobertura.geojson').subscribe((geojsonData) => {
        const capa = this.L.geoJSON(geojsonData).addTo(this.map);
        this.map.fitBounds(capa.getBounds());
      });

      this.map.invalidateSize();
    }, 1000); // intenta con 300ms
  }
}

  private initMap(): void {
    this.map = this.L.map('map').setView([19.168945072391274, -99.4850132967743], 10);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '<a href="https://emenet.mx">Emenet</a> Cobertura',
      maxZoom: 18,
    }).addTo(this.map);

    this.L.control.scale().addTo(this.map);
    // Agrega el listener aquí:
  this.map.on('click', (e: any) => {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    this.seleccionarPuntoMapa(lat, lon);
  });
  }


  seleccionarPuntoMapa(lat: number, lon: number) {
    if (this.progreso) return;
    this.progreso = true;
    this.verMensaje = false;
    if (this.marcadorSeleccionado) this.map.removeLayer(this.marcadorSeleccionado);

    this.apiStreet.buscarPorDatos(`${lat},${lon}`)
      .pipe(finalize(() => {
        this.busquedaActiva = true;
        this.progreso = false;
      }))
      .subscribe({
        next: (response) => {
          this.resultadosBusqueda = [response];
          this.seleccionUbicacion(0);
          this.errorBusqueda = false;
        },
        error: () => this.errorBusqueda = true,
      });
}
}
