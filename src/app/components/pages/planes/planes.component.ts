import { Component, OnInit } from '@angular/core';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { DialogModule } from 'primeng/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-planes',
  imports: [
    CarouselModule,
    ButtonModule,
    TagModule,
    CommonModule,
    AnimateOnScrollModule,
    DialogModule,
  ],
  templateUrl: './planes.component.html',
  styleUrl: './planes.component.scss',
})
export class PlanesComponent implements OnInit {
  iftPlanes = false;
  errorPdf: boolean = false;
  rutaPdfPlan!: SafeResourceUrl;
  codigoSelect: string = "";

  responsiveOptions: any;
  planes: any = [
    {
      nombre: 'Plan 50 Megas',
      precio: 300.0,
      codigoIFT: 'IFT-1212059',
      caracteristicas: [
        {
          detalle: 'Dispositivos conectados',
          descripcion: '8 a 10',
        },
        {
          detalle: 'Estudio / trabajo simultáneo',
          descripcion: 'Hasta 3',
        },
        {
          detalle: 'Reproducción de video',
          descripcion: 'Alta calidad',
        },
        {
          detalle: 'Juego en línea',
          descripcion: 'Si',
          estilos: true,
        },
        {
          detalle: 'Transmisiones en vivo',
          descripcion: 'Si',
          estilos: true,
        },
      ],
    },
    {
      nombre: 'Plan 75 Megas',
      precio: 400.0,
      codigoIFT: '1212060',
      caracteristicas: [
        {
          detalle: 'Dispositivos conectados',
          descripcion: '8 a 12',
        },
        {
          detalle: 'Estudio / trabajo simultáneo',
          descripcion: 'Hasta 3',
        },
        {
          detalle: 'Reproducción de video',
          descripcion: 'Alta calidad',
        },
        {
          detalle: 'Juego en línea',
          descripcion: 'Si',
          estilos: true,
        },
        {
          detalle: 'Transmisiones en vivo',
          descripcion: 'Si',
          estilos: true,
        },
      ],
    },
    {
      nombre: 'Plan 100 Megas',
      precio: 500.0,
      codigoIFT: '1212059',
      caracteristicas: [
        {
          detalle: 'Dispositivos conectados',
          descripcion: '11 a 15',
        },
        {
          detalle: 'Estudio / trabajo simultáneo',
          descripcion: 'Hasta 5',
        },
        {
          detalle: 'Reproducción de video',
          descripcion: 'Alta calidad',
        },
        {
          detalle: 'Juego en línea',
          descripcion: 'Si',
          estilos: true,
        },
        {
          detalle: 'Transmisiones en vivo',
          descripcion: 'Si',
          estilos: true,
        },
      ],
    },
    {
      nombre: 'Plan 200 Megas',
      precio: 600.0,
      codigoIFT: 'IFT-1234',
      caracteristicas: [
        {
          detalle: 'Dispositivos conectados',
          descripcion: '16 a 20',
        },
        {
          detalle: 'Estudio / trabajo simultáneo',
          descripcion: '8',
        },
        {
          detalle: 'Reproducción de video',
          descripcion: '4K',
        },
        {
          detalle: 'Juego en línea',
          descripcion: 'Si',
          estilos: true,
        },
        {
          detalle: 'Transmisiones en vivo',
          descripcion: 'Si',
          estilos: true,
        },
      ],
    },
    {
      nombre: 'Plan 500 Megas',
      precio: 800.0,
      codigoIFT: 'IFT-1234',
      caracteristicas: [
        {
          detalle: 'Dispositivos conectados',
          descripcion: '21 a 25',
        },
        {
          detalle: 'Estudio / trabajo simultáneo',
          descripcion: '16',
        },
        {
          detalle: 'Reproducción de video',
          descripcion: '4K',
        },
        {
          detalle: 'Juego en línea',
          descripcion: 'Si',
          estilos: true,
        },
        {
          detalle: 'Transmisiones en vivo',
          descripcion: 'Si',
          estilos: true,
        },
      ],
    },
    {
      nombre: 'Plan 1000 Megas',
      precio: 1400.0,
      codigoIFT: 'IFT-1234',
      caracteristicas: [
        {
          detalle: 'Dispositivos conectados',
          descripcion: 'Más de 25',
        },
        {
          detalle: 'Estudio / trabajo simultáneo',
          descripcion: 'Más de 16',
        },
        {
          detalle: 'Reproducción de video',
          descripcion: '4K',
        },
        {
          detalle: 'Juego en línea',
          descripcion: 'Si',
          estilos: true,
        },
        {
          detalle: 'Transmisiones en vivo',
          descripcion: 'Si',
          estilos: true,
        },
      ],
    },
  ];

  constructor(private sanitizer: DomSanitizer, private http: HttpClient,) {}
  ngOnInit(): void {
    this.responsiveOptions = [
      {
        breakpoint: '1400px',
        numVisible: 4,
        numScroll: 1,
      },
      {
        breakpoint: '1199px',
        numVisible: 3,
        numScroll: 1,
      },
      {
        breakpoint: '767px',
        numVisible: 2,
        numScroll: 1,
      },
      {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1,
      },
    ];
  }

  colocarRuta(codigoIFT: string) {
    const ruta = `/legales/planes/${codigoIFT}.pdf`;
    this.http.head(ruta, { observe: 'response' }).pipe(
      finalize(() => this.iftPlanes = true)
    ).subscribe({
      next: () => {
        this.errorPdf = false;
        this.codigoSelect = codigoIFT;
        this.rutaPdfPlan = this.sanitizer.bypassSecurityTrustResourceUrl(ruta);
      },
      error: () => this.errorPdf = true,
    });
  }
  protected paginaIFT(): void {
    window.open('https://tarifas.ift.org.mx/ift_visor/', '_blank');
  }
}
