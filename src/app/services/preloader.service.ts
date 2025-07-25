import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PreloaderService {
  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  show() {
    this.loadingSubject.next(true);
  }

  hide() {
    this.loadingSubject.next(false);
  }
  constructor() {}

  public homePage = new BehaviorSubject<boolean>(false);
  homePage$ = this.homePage.asObservable();
  actualizarClases(valor: boolean){
    this.homePage.next(valor)
  }

}
