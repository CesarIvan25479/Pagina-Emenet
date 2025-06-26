import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StreeMapService {
  constructor(private http: HttpClient) {}

  buscarPorDatos(datos: string): Observable<any> {
    const coordenadasRegex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;
    if(!coordenadasRegex.test(datos)){
      datos += ', Estado de México, México';
      const url =
      `https://nominatim.openstreetmap.org/search?` +
      `format=json` +
      `&q=${encodeURIComponent(datos)}` +
      `&countrycodes=mx` +
      `&viewbox=-100.5,20.3,-98.5,18.5` +
      `&bounded=1` +
      `&limit=5`;
      return this.http.get<any>(url);
    }else{
      const coordenadas = datos.split(",")
      const url =
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${coordenadas[0].trim()}` +
      `&lon=${coordenadas[1].trim()}` +
      `&format=json` +
      `&limit=5`;
      return this.http.get<any>(url);
    }
  }



}
