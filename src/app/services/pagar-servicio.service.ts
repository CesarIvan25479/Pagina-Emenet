import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PagarServicioService {

  constructor() { }


  generarMesesPendientes(ultimoPagoStr: string, costoMes: number) {
    const mesesMap: { [key: string]: number } = {
        'ENE': 0, 'FEB': 1, 'MAR': 2, 'ABR': 3, 'MAY': 4, 'JUN': 5,
        'JUL': 6, 'AGO': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DIC': 11
    };
    const mesesNombres = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

    const partes = ultimoPagoStr.split(' ');

    if(!(partes[0].toUpperCase() in mesesMap)){
      return [];
    }
    const mesUltimo = mesesMap[partes[0].toUpperCase()];
    const anioUltimo = parseInt(partes[1]);

    let fechaCursor = new Date(anioUltimo, mesUltimo + 1, 1);
    const fechaActual = new Date();
    const primerDiaMesActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);

    const pendientes = [];

    while (fechaCursor <= primerDiaMesActual) {
        pendientes.push({
            mes: `${mesesNombres[fechaCursor.getMonth()]} ${fechaCursor.getFullYear()}`,
            costo: costoMes
        });
        fechaCursor.setMonth(fechaCursor.getMonth() + 1);
    }

    if (pendientes.length === 0) {
        pendientes.push({
            mes: `${mesesNombres[fechaCursor.getMonth()]} ${fechaCursor.getFullYear()}`,
            costo: costoMes
        });
    }

    return pendientes;
  }

  public ocultarFinal(cadena: string, numCaracteres: number) {
    return cadena.slice(0, -numCaracteres) + '*'.repeat(numCaracteres);
  }

  enmascararNombreLargo(nombreCompleto: string): string {
    if (!nombreCompleto) return '-';

    const palabras = nombreCompleto.trim().toUpperCase().split(/\s+/);
    if (palabras.length === 1) {
        const p = palabras[0];
        if (p.length <= 6) return p;
        return `${p.substring(0, 4)}***${p.slice(-3)}`;
    }

    const primera = palabras[0];
    const penultima = palabras.length > 2 ? palabras[palabras.length - 2] : '';
    const ultima = palabras[palabras.length - 1];
    const pieza1 = primera.substring(0, 4); // Primeros 4 de la primera
    const pieza2 = penultima ? penultima.substring(0, 3) : ''; // Primeros 3 de la penúltima
    const pieza3 = ultima.slice(-3); // Últimos 3 de la última
    const separador = "*****";

    if (palabras.length === 2) {
        return `${pieza1}${separador}${pieza3}`;
    }
    return `${pieza1}${separador}${pieza2}${separador}${pieza3}`;
}

  public codigosHttp(error: any) {
        switch (error.status) {
            case 404:
                return "No se encontró información del cliente"

            case 401:
            case 403:
              return "No tienes autorización para realizar la búsqueda"

            case 500:
            default:
              return "No es posible realizar la búsqueda, inténtalo más tarde"
        }
    }

}
