import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AccesibilidadService {

  constructor() { }

  public incrementFont() {
    const html = document.documentElement;
    const currentSize = parseFloat(getComputedStyle(html).fontSize);
    if(currentSize<=20){
      const newSize = currentSize + 1;
      html.style.fontSize = `${newSize}px`;
    }

  }
  public decrementFont(){
    const html = document.documentElement;
    const currentSize = parseFloat(getComputedStyle(html).fontSize);
    if(currentSize>=12){
      const newSize = currentSize - 1;
      html.style.fontSize = `${newSize}px`;
    }
  }

  public grayScale() {
    const html = document.documentElement;
    const current = html.style.filter;
    html.style.filter = current === "grayscale(100%)" ? "none" : "grayscale(100%)";
  }

  public altContrast(){
    const html = document.documentElement;
    const current = html.style.filter;
    html.style.filter = current === "contrast(300%)" ? "none" : "contrast(300%)" ;
  }

  public negativo(){
    const html = document.documentElement;
    const current = html.style.filter;
    html.style.filter = current === "invert(100%)" ? "none" : "invert(100%)" ;
  }

  public lightBackground() {
    const body = document.body;
    const isLight = body.classList.contains('bg-light-mode');

    if (isLight) {
      body.classList.remove('bg-light-mode');
    } else {
      body.classList.add('bg-light-mode');
    }
  }

  public underlineLinks() {
    const body = document.body;
    body.classList.toggle('underline-links');
  }

  public readableFont() {
    const body = document.body;
    body.classList.toggle('readable-font');
  }

  public reiniciarValores(){
    const body = document.body;
    const html = document.documentElement;
    html.style.fontSize = `16px`;
    html.style.filter = "";
    body.classList.remove('bg-light-mode');
    body.classList.remove('underline-links');
    body.classList.remove('readable-font');
  }


}
