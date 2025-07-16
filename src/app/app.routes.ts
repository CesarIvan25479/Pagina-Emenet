import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { HomeComponent } from './components/pages/home/home.component';
import { PlanesComponent } from './components/pages/planes/planes.component';
import { FormasPagoComponent } from './components/pages/formas-pago/formas-pago.component';
import { NoEncontradoComponent } from './components/pages/no-encontrado/no-encontrado.component';
import { TestVelocidadComponent } from './components/pages/test-velocidad/test-velocidad.component';
import { SobreNosotrosComponent } from './components/pages/sobre-nosotros/sobre-nosotros.component';

export const routes: Routes = [{
  path: '', component: LayoutComponent,
  children: [
    { path: '', component: HomeComponent },
    { path: 'planes', component: PlanesComponent },
    { path: 'formas-de-pago', component: FormasPagoComponent },
    { path: 'test-velocidad', component: TestVelocidadComponent },
    { path: 'sobre-nosotros', component: SobreNosotrosComponent },
    { path: '**', component: NoEncontradoComponent }
  ]
}];

