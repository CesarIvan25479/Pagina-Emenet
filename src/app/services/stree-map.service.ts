import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StreeMapService {
  constructor(private http: HttpClient) {}

  buscarCoordenadas(datos: string): Observable<any> {
    const coordenadasRegex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
    if(!coordenadasRegex.test(datos)){
      datos += ', Estado de México, México';
    }
    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `format=json` +
      `&q=${encodeURIComponent(datos)}` +
      `&countrycodes=mx` +
      `&viewbox=-100.5,20.3,-98.5,18.5` +
      `&bounded=1` +
      `&limit=5`;

    //  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    //   datos
    // )}&bounded=1&viewbox=-118.601,32.718,-86.711,14.532`;

    return this.http.get<any>(url);
  }
}
