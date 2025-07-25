import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SolicitudService {
  private apiUrl: string;
  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiBaseUrl;
  }

  enviarSolicitud(datos: any): Observable<any>{
    return this.http.post<any>(`${this.apiUrl}/web-solicitud`, datos);
  }

  enviarCorreo(datos: any): Observable<any>{
    return this.http.post<any>(`${this.apiUrl}/clientes/correo/web`, datos);
  }
}
