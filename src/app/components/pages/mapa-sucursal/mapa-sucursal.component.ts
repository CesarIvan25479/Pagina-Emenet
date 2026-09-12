import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, Inject, PLATFORM_ID } from '@angular/core';
import { icon, Icon } from 'leaflet';
import { CoberturaService } from '../../../services/cobertura.service';

@Component({
  selector: 'app-mapa-sucursal',
  imports: [],
  templateUrl: './mapa-sucursal.component.html',
})
export class MapaSucursalComponent implements AfterViewInit{
  private map: any;
  private marcadorActual: any = null;
  private L: any;

  datos: any = [
    {
      id: 8,
      coordenadas: "19.108112, -99.415473",
      nombre: "MISCELANEA EMILIANO ZAPATA",
      direccion: "Tienda autorizada de cobro",
      icon: "sucursal.png"
    },
    {
      id: 9,
      coordenadas: "19.060891, -99.548006",
      nombre: "NUDO TEC, SAN FRANCISCO TEPEXOXUCA",
      direccion: "Tienda autorizada de cobro",
      icon: "sucursal.png"
    },
    {
      id: 10,
      coordenadas: "19.050507, -99.532070",
      nombre: "LIN TEC, JOQUICINGO",
      direccion: "Tienda autorizada de cobro",
      icon: "sucursal.png"
    },
    {
      id: 11,
      coordenadas: "19.016676, -99.467296",
      nombre: "MISCELANEA EL PARAPENTE, TEZONTEPEC",
      direccion: "Tienda autorizada de cobro",
      icon: "sucursal.png"
    },
    {
      id: 12,
      coordenadas: "19.016676, -99.467296",
      nombre: "SUPER FARMACIA VALLOP, TEZONTEPEC",
      direccion: "Tienda autorizada de cobro",
      icon: "sucursal.png"
    },
    {
      id: 13,
      coordenadas: "19.061052499548577, -99.3833953339904",
      nombre: "FARMACIA VIDA Y SALUD, SANTA MARTHA",
      direccion: "Tienda autorizada de cobro",
      icon: "sucursal.png"
    },
    {
      id: 14,
      coordenadas: "18.996443371293303, -99.5038336261191",
      nombre: "SUPER FARMACIA VALLOP, SAN SIMON",
      direccion: "Tienda autorizada de cobro",
      icon: "sucursal.png"
    },
    {
      id: 15,
      coordenadas: "19.012721542215093, -99.38825962071276",
      nombre: "HOSPICEL",
      direccion: "Tienda autorizada de cobro",
      icon: "sucursal.png"
    },
    {
      id: 16,
      coordenadas: "19.180092331319333, -99.41442929649246",
      nombre: "MATERIAS PRIMAS SAN JUAN",
      direccion: "Tienda autorizada de cobro",
      icon: "sucursal.png"
    },
    {
      id: 1,
      coordenadas: "19.16324032490373, -99.480276395764",
      nombre: "Almoloya del Río",
      direccion: "Av. Gustavo Baz 40, Almoloya del Río Edo. México C.P. 52540",
      icon: "sucursal_emenet.png"
    },
    {
      id: 2,
      coordenadas: "19.158940, -99.488024",
      nombre: "Almoloya del Río",
      direccion: "Dr. Gustavo Baz Prada Ote. no. 4, Almoloya del Río Edo. México C.P. 52540",
      icon: "sucursal_emenet.png"
    },
    {
      id: 4,
      coordenadas: "18.991444, -99.421189",
      nombre: "Santa Mónica",
      direccion: "Galeana 27, Ocuilan Edo. México C.P. 52485",
      icon: "sucursal_emenet.png"
    },
    {
      id: 5,
      coordenadas: "19.263672508852594, -99.48463854903666",
      nombre: "San Pedro Cholula",
      direccion: "Cjon. Benito Juárez 11, Ocoyoacac Edo. México C.P. 52757",
      icon: "sucursal_emenet.png"
    },
    {
      id: 6,
      coordenadas: "19.56921690264074, -99.75608044465764",
      nombre: "Ixtlahuaca",
      direccion: "",
      icon: "sucursal_emenet.png"
    },
    {
      id: 7,
      coordenadas: "18.963449369322475, -99.59602967259809",
      nombre: "Tenancingo",
      direccion: "Moctezuma Pte. 500 Centro, Tenancingo de Degollado Edo. México C.P. 52400",
      icon: "sucursal_emenet.png"
    },
    {
      id: 3,
      coordenadas: "19.181709, -99.466801",
      nombre: "Santiago Tianguistenco",
      direccion: "Andador Carlos Hank #304, Tianguistenco Edo. México C.P. 52650",
      icon: "sucursal_emenet.png"
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

    const mapa = this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: 'ispemenet',maxZoom: 18,});
    const satelite = this.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{ attribution: 'emenet comunicaciones', maxZoom: 18,});
    const etiquetas = this.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{ maxZoom: 18,});
    const sateliteEtiquetas = this.L.layerGroup([satelite, etiquetas]);
    sateliteEtiquetas.addTo(this.map);
    this.map.attributionControl.setPrefix('<img src="assets/mexico.png" width="20px" style="vertical-align: middle;"/>');
    delete (Icon.Default.prototype as any)._getIconUrl;
      Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });
    const baseMaps = {
      'Mapa': mapa,
      'Satélite': satelite,
      'Satélite Etiquetas': sateliteEtiquetas,
    };
    this.L.control.layers(baseMaps).addTo(this.map);
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
              style="width: 100%; background-color: #2563eb; color: white; border: none; padding: 6px 12px;
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

}
