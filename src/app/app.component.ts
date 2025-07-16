import { AfterViewInit, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InputMaskModule } from 'primeng/inputmask';
import { ButtonModule } from 'primeng/button';
import { PreloaderService } from './services/preloader.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InputMaskModule, ButtonModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent{
  loading = true;

  constructor(private preloader: PreloaderService) {}

  ngOnInit(): void {
    this.preloader.loading$.subscribe((state) => {
      this.loading = state;
    });
  }
}
