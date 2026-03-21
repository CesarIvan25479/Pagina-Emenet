import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SolicitudService {
  private apiUrl: string;
  private pagoUrl: string;
  constructor(private http: HttpClient) {
    this.apiUrl = environment.apiBaseUrl;
    this.pagoUrl = environment.pagoraliaUrl;
  }

  enviarSolicitud(datos: any): Observable<any>{
    return this.http.post<any>(`${this.apiUrl}/web-solicitud`, datos);
  }

  enviarCorreo(datos: any): Observable<any>{
    return this.http.post<any>(`${this.apiUrl}/clientes/correo/web`, datos);
  }

  infoCliente(cliente: string){
    const headers = this.getHeaders();
    const params = { conexion: true };
    return this.http.get<any>(`${this.apiUrl}/clientesV2/${cliente}`, { headers, params });
  }

  getHeaders(): HttpHeaders{
    const token = environment.tokenClients;
    return new HttpHeaders().set('Accept', 'application/json').set('x-web-key',token);
  }

  getHeadersPago(): HttpHeaders{
    const token = environment.tokenPagoralia;
    return new HttpHeaders()
            .set('Authorization', `Bearer ${token}`)
            .set('Accept', 'application/json');
  }
  generarLinkPago(datos: any): Observable<any>{
    const headers = this.getHeadersPago();
    return this.http.post<any>(`${this.pagoUrl}/v3/orders`, datos,  { headers });
  }



}
