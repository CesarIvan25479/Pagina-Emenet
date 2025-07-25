import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnviarMensajeService {

  constructor() { }
  public enviarMensaje(mensaje: string, numero: string): void{
    window.location.href = `whatsapp://send?phone=+52${numero}&text=${encodeURIComponent(mensaje)}`
  }
  public llamar(telefono: string):void{
    window.location.href = `tel:${telefono}`;
  }
  // public correo(correo: string){
  //   console.log(correo)
  //    window.open(`mailto:${correo}`, '_self');
  // }
}
