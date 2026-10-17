import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FeatureCollection, Geometry } from 'geojson';
import * as turf from '@turf/turf';
import { catchError, map, Observable, of } from 'rxjs';
import { GeolocationService } from './geolocation.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CoberturaService {
  private geojsonUrl = (environment as any).coberturaGeojsonUrl ||
    (environment.neurexaApiUrl ? environment.neurexaApiUrl.replace(/\/api\/?$/, '/uploads/cobertura.geojson') : 'https://demo.bot-back.emenet.mx/uploads/cobertura.geojson');

  constructor(private http: HttpClient, private geolocationService: GeolocationService) { }

  getGeojson(): Observable<FeatureCollection<Geometry>> {
    return this.http.get<FeatureCollection<Geometry>>(this.geojsonUrl);
  }

  async pointInCoverage(lat: number, lng: number): Promise<boolean> {
    const geojson = await this.getGeojson().toPromise();

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
