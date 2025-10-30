import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Carousel3dComponent } from './carousel3d.component';

// This module is no longer needed since we're using standalone components
// But we'll keep it for backward compatibility

@NgModule({
  imports: [Carousel3dComponent],
  exports: [Carousel3dComponent]
})
export class Carousel3dModule { }
