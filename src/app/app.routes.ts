import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { HomeComponent } from './components/pages/home/home.component';

export const routes: Routes = [{
  path: '', component: LayoutComponent,
  children: [{
    path: '', component: HomeComponent
  }]
}];
