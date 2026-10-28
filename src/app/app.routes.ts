import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { HomeComponent } from './components/pages/home/home.component';
import { PlanesComponent } from './components/pages/planes/planes.component';
import { FormasPagoComponent } from './components/pages/formas-pago/formas-pago.component';
import { TestVelocidadComponent } from './components/pages/test-velocidad/test-velocidad.component';
import { SobreNosotrosComponent } from './components/pages/sobre-nosotros/sobre-nosotros.component';
import { ContactanosComponent } from './components/pages/contactanos/contactanos.component';
import { PagarServicioComponent } from './components/pages/pagar-servicio/pagar-servicio.component';
import { FaqsComponent } from './components/pages/faqs/faqs.component';
import { NoEncontradoComponent } from './components/pages/no-encontrado/no-encontrado.component';
import { EispComponent } from './components/pages/servicios/eisp/eisp.component';
import { ServiciosIspComponent } from './components/pages/servicios/servicios-isp/servicios-isp.component';
import { OntsPersonalizadasComponent } from './components/pages/servicios/onts-personalizadas/onts-personalizadas.component';
import { AsesoriaRegulatoriaComponent } from './components/pages/servicios/asesoria-regulatoria/asesoria-regulatoria.component';


export const routes: Routes = [
  { path: "servicios/e-isp", component: EispComponent },
  { path: "servicios/isp", component: ServiciosIspComponent },
  { path: "servicios/ont-personalizadas", component: OntsPersonalizadasComponent },
  { path: "servicios/asesoria-regulatoria", component: AsesoriaRegulatoriaComponent },
  { path: "servicios/equipo-seguridad", loadComponent: () => import('./components/pages/servicios/equipo-seguridad/equipo-seguridad.component').then(m => m.EquipoSeguridadComponent) },
  // { path: "e-isp", component: EispComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'planes', component: PlanesComponent },
      { path: 'formas-de-pago', component: FormasPagoComponent },
      { path: 'pagar-servicio', component: PagarServicioComponent },
      { path: 'test-velocidad', component: TestVelocidadComponent },
      { path: 'sobre-nosotros', component: SobreNosotrosComponent },
      { path: 'contactanos', component: ContactanosComponent },
      { path: 'faq', component: FaqsComponent },
      // { path: "eisp", component: EispComponent },
      { path: '**', component: NoEncontradoComponent },
    ],
  },

];
