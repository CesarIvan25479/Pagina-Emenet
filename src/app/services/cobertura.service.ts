import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FeatureCollection, Geometry } from 'geojson';
import * as turf from '@turf/turf';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { GeolocationService } from './geolocation.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CoberturaService {
  private geojsonUrl = (environment as any).coberturaGeojsonUrl ||
    (environment.neurexaApiUrl ? environment.neurexaApiUrl.replace(/\/api\/?$/, '/uploads/cobertura.geojson') : 'https://bot-back.emenet.mx/uploads/cobertura.geojson');

  /** Flujo reactivo con la última versión de la cobertura en memoria */
  public coberturaData$ = new BehaviorSubject<FeatureCollection<Geometry> | null>(null);

  private ultimoHash: string = '';
  private pollingRef: any = null;
  private comprobando = false;

  constructor(private http: HttpClient, private geolocationService: GeolocationService) { }

  /**
   * Obtiene el GeoJSON actual. Con bypassCache agrega timestamp para evitar cache HTTP.
   */
  getGeojson(bypassCache = false): Observable<FeatureCollection<Geometry>> {
    const url = bypassCache ? `${this.geojsonUrl}?_t=${Date.now()}` : this.geojsonUrl;
    return this.http.get<FeatureCollection<Geometry>>(url);
  }

  /**
   * Inicia un sondeo periódico para detectar cambios en la cobertura en tiempo real.
   */
  iniciarSondeo(intervaloMs = 3000): void {
    if (typeof window === 'undefined') return;
    if (this.pollingRef) return;

    this.comprobarActualizaciones();

    this.pollingRef = setInterval(() => {
      this.comprobarActualizaciones();
    }, intervaloMs);
  }

  /**
   * Detiene el sondeo para liberar recursos.
   */
  detenerSondeo(): void {
    if (this.pollingRef) {
      clearInterval(this.pollingRef);
      this.pollingRef = null;
    }
  }

  /**
   * Comprueba si el GeoJSON cambió en el servidor. Si cambió, emite en coberturaData$.
   */
  public comprobarActualizaciones(): void {
    if (this.comprobando) return;
    this.comprobando = true;

    this.getGeojson(true).pipe(
      catchError((err) => {
        console.warn('[CoberturaService] Error al consultar cobertura en tiempo real:', err?.message || err);
        return of(null);
      })
    ).subscribe((data) => {
      this.comprobando = false;
      if (!data || !Array.isArray(data.features)) return;

      const nuevoHash = JSON.stringify(data.features);
      if (nuevoHash !== this.ultimoHash) {
        this.ultimoHash = nuevoHash;
        this.coberturaData$.next(data);
      }
    });
  }

  async pointInCoverage(lat: number, lng: number): Promise<boolean> {
    let geojson = this.coberturaData$.value;
    if (!geojson) {
      geojson = await this.getGeojson(true).toPromise() || null;
      if (geojson) {
        this.coberturaData$.next(geojson);
      }
    }

    if (!geojson || !geojson.features) {
      return false;
    }

    const point = turf.point([lng, lat]);

    for (const feature of geojson.features) {
      if (
        feature.geometry.type === 'Polygon' ||
        feature.geometry.type === 'MultiPolygon'
      ) {
        const polygon = turf.feature(feature.geometry);
        if (turf.booleanPointInPolygon(point, polygon)) {
          return true;
        }
      }
    }

    return false;
  }

  public buscarUbicacion(): Observable<string> {
    return this.geolocationService.getCurrentPosition().pipe(
      map((position: GeolocationPosition) =>
        `${position.coords.latitude},${position.coords.longitude}`
      ),
      catchError(() => of(''))
    );
  }
}
