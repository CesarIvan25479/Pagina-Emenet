import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnviarMensajeService {

  constructor() { }
  public enviarMensaje(mensaje: string): void{
    window.location.href = `whatsapp://send?phone=+527291792524&text=${encodeURIComponent(mensaje)}`
  }
  public llamar(telefono: string):void{
    window.location.href = `tel:${telefono}`;
  }
}
