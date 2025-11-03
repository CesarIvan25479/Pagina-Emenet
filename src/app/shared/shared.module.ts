import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnimatedChatIconComponent } from '../components/shared/animated-chat-icon/animated-chat-icon.component';
import { ButtonModule } from 'primeng/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  imports: [
    CommonModule,
    ButtonModule,
    BrowserAnimationsModule,
    AnimatedChatIconComponent // Import the standalone component here
  ],
  exports: [
    AnimatedChatIconComponent // Re-export the standalone component
  ]
})
export class SharedModule { }
