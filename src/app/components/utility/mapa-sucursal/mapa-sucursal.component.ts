import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, Inject, PLATFORM_ID } from '@angular/core';
import { icon, Icon } from 'leaflet';
import { CoberturaService } from '../../../services/cobertura.service';

@Component({
  selector: 'app-mapa-sucursal',
  imports: [],
  templateUrl: './mapa-sucursal.component.html',
  styleUrl: "./mapa-sucursal.component.scss"
})
export class MapaSucursalComponent implements AfterViewInit{
  private map: any;
  private marcadorActual: any = null;
  private L: any;

  datos: any = [
    {
      id: 8,
      coordenadas: "19.3987652119447, -99.12220830840747",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 9,
      coordenadas: "19.604011354670686, -99.19491769831315",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 10,
      coordenadas: "19.20783684388808, -98.99645371472899",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 11,
      coordenadas: "19.41566879389297, -98.77317169331795",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 12,
      coordenadas: "19.764910052860547, -99.35834762176434",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 13,
      coordenadas: "19.489705987372275, -98.7935332525523",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 14,
      coordenadas: "19.343191523853022, -98.60526178499654",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 15,
      coordenadas: "19.012721542215093, -99.38825962071276",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 16,
      coordenadas: "19.90136725674565, -98.84188711354774",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 1,
      coordenadas: "19.022003107609862, -98.97160159911479",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 2,
      coordenadas: "18.993794553117418, -98.94073742058352",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 4,
      coordenadas: "19.11826518194245, -99.06522291733464",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 5,
      coordenadas: "19.52796306203343, -99.37900869623083",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 6,
      coordenadas: "19.603576266102145, -98.44691064981636",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 7,
      coordenadas: "19.89019453879622, -99.37386465375538",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },
    {
      id: 3,
      coordenadas: "19.060067571470928, -99.13443922453823",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "logo-gen.png"
    },

  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private coberturaService: CoberturaService,){}

  async ngAfterViewInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
          const leafletModule = await import('leaflet');
          this.L = leafletModule.default || leafletModule;

          setTimeout(() => {
            this.initMap();
          }, 1000);
        }
      }

private initMap(): void {
    this.map = this.L.map('map').setView([19.168945072391274, -99.4850132967743], 13);

    this.capaRoadmap = this.L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      attribution: 'emenet comunicaciones'
    });
     this.capaSatelite = this.L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      attribution: 'emenet comunicaciones'
    });
    const etiquetas = this.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{ maxZoom: 18,});
    // const sateliteEtiquetas = this.L.layerGroup([this.capaSatelite]);
    this.capaActual = "satellite_labels";
    this.capaSatelite.addTo(this.map);
    this.map.attributionControl.setPrefix('<img src="assets/mexico.png" width="20px" style="vertical-align: middle;"/>');
    delete (Icon.Default.prototype as any)._getIconUrl;
      Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });
    const baseMaps = {
      'Mapa': this.capaRoadmap,
      // 'Satélite': satelite,
      'Satélite Etiquetas': this.capaSatelite,
    };
    // this.L.control.layers(baseMaps).addTo(this.map);
    this.L.control.scale().addTo(this.map);


    this.datos.forEach((punto: any) => {
      const coords = punto.coordenadas;
      const [lat, lng] = coords.split(',').map((x: string) => parseFloat(x));
      this.marcadorActual = this.L.marker([lat, lng],{
        icon: this.L.icon({
        iconUrl: 'assets/leaflet/' + punto.icon,
        iconSize: [30, 40], // tamaño del icono
        iconAnchor: [15, 40], // punto de anclaje (la punta del marcador)
        popupAnchor: [0, -40], // donde aparece el popup relativo al icono
        shadowUrl: 'assets/leaflet/marker-shadow.png', // opcional
        shadowSize: [41, 41],
        shadowAnchor: [13, 41],
      })}).addTo(this.map).bindPopup(`
        <div style="font-family: 'Segoe UI', Roboto, sans-serif; min-width: 220px; padding: 4px;">
          <div style="border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; margin-bottom: 8px;">
            <h3 style="margin: 0 0 2px 0; color: #1e293b; font-size: 16px; font-weight: 600;">
              ${punto.nombre}
            </h3>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px; color: #64748b; font-size: 13px;">
            <div style="display: flex; align-items: flex-start; gap: 6px;">
              <span>📍</span>
              <span style="line-height: 1.3;">${punto.direccion || 'Dirección no disponible'}</span>
            </div>
          </div>
          <div style="margin-top: 12px;">
            <button
              style="width: 100%; background-color: #15803d; color: white; border: none; padding: 6px 12px;
              border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.2s;"
              id="btn-${punto.id}">
              Como llegar →
            </button>
          </div>
        </div>`).openPopup();
      this.map.setView([lat, lng], 13);
      this.marcadorActual.on('popupopen', () => {
        const btn = document.getElementById(`btn-${punto.id}`);
        if (btn) {
            btn.addEventListener('click', () => {
              window.open('https://www.google.es/maps?q=' + lat + ','+lng,'_blank');
            });
          }
        });
    });



  }

  protected colocarUbicacion(){
    this.coberturaService.buscarUbicacion().subscribe(coords => {
      if(coords != '19.18261479532001, -99.46594011562901'){
        const [lat, lng] = coords.split(',').map((x: string) => parseFloat(x));
        this.marcadorActual = this.L.marker([lat, lng],{
          icon: this.L.icon({
          iconUrl: '/assets/leaflet/usuario.png',
          iconSize: [30, 40], // tamaño del icono
          iconAnchor: [15, 40], // punto de anclaje (la punta del marcador)
          popupAnchor: [0, -40], // donde aparece el popup relativo al icono
          shadowUrl: 'assets/leaflet/marker-shadow.png', // opcional
          shadowSize: [41, 41],
          shadowAnchor: [13, 41],
          })}).addTo(this.map).bindPopup(`<strong>Ubicación actual</strong>`).openPopup();
          this.map.setView([lat, lng], 13);
        }
    });
  }
  private capaRoadmap!: L.TileLayer;
  public capaActual: 'roadmap' | 'satellite_labels' = 'roadmap';
  private capaSatelite!: L.TileLayer;
  private markersLayer?: L.LayerGroup; // Capa donde van mismarcadores
  // Toggle rápido para el botón
  public alternarCapa(event: MouseEvent): void {
    event.stopPropagation();
    this.cambiarCapa(this.capaActual === 'roadmap' ? 'satellite_labels' : 'roadmap');
  }
  public cambiarCapa(tipo: 'roadmap' | 'satellite_labels'): void {
    if (!this.map || this.capaActual === tipo) return;
    this.capaActual = tipo;

    if (tipo === 'satellite_labels') {
      if (this.capaRoadmap && this.map.hasLayer(this.capaRoadmap)) {
        this.map.removeLayer(this.capaRoadmap);
      }
      if (this.capaSatelite) {
        this.capaSatelite.addTo(this.map);
      }
    } else {
      if (this.capaSatelite && this.map.hasLayer(this.capaSatelite)) {
        this.map.removeLayer(this.capaSatelite);
      }
      if (this.capaRoadmap) {
        this.capaRoadmap.addTo(this.map);
      }
    }
    if (this.markersLayer) {
      this.markersLayer.eachLayer((layer: any) => {
        if (typeof layer.bringToFront === 'function') {
          layer.bringToFront();
        }
      });
    }
  }
}
