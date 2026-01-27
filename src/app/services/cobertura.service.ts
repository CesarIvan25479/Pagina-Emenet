import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FeatureCollection, Geometry } from 'geojson';
import * as turf from '@turf/turf';
import { catchError, map, Observable, of } from 'rxjs';
import { GeolocationService } from './geolocation.service';

@Injectable({
  providedIn: 'root',
})
export class CoberturaService {
  private geojsonUrl = 'cobertura.geojson';

  constructor(private http: HttpClient, private geolocationService: GeolocationService) {}

  async pointInCoverage(lat: number, lng: number): Promise<boolean> {
    const geojson = await this.http
      .get<FeatureCollection<Geometry>>(this.geojsonUrl)
      .toPromise();

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
