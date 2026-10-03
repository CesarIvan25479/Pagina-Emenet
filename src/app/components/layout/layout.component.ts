import { AfterViewInit, ChangeDetectorRef, Component, HostListener, Inject, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, RouterLinkActive } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { AnimateOnScrollModule } from 'primeng/animateonscroll';
import { filter } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { PreloaderService } from '../../services/preloader.service';
import { DrawerModule } from 'primeng/drawer';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AccesibilidadService } from '../../services/accesibilidad.service';
import { EnviarMensajeService } from '../../services/enviar-mensaje.service';
import { SpeedDialModule } from 'primeng/speeddial';
import { UtilidadesService } from '../../services/utilidades.service';
import { MobileComponent } from '../pages/mobile/mobile.component';
import { FormsModule } from '@angular/forms';
import { ChatInputComponent } from '../shared/chat-input/chat-input.component';
import { MessageBubbleComponent, ChatMessage } from '../shared/message-bubble/message-bubble.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, MenubarModule, CommonModule, AccordionModule, AnimateOnScrollModule, ButtonModule, DialogModule,
    DrawerModule, ToggleSwitchModule, SpeedDialModule, DialogModule, MobileComponent, FormsModule, ChatInputComponent, MessageBubbleComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, AfterViewInit {
  items: MenuItem[] | undefined;
  actualYear: number;
  clases!: boolean;
  accesibilidad: boolean = false;
  dialogMobile: boolean = false;
  chatVisible: boolean = false;
  mensajeChatInput: string = '';

  // Buscador de mensajes
  mostrarBuscadorChat: boolean = false;
  queryBuscadorChat: string = '';

  @HostListener('document:keydown.escape', ['$event'])
  handleGlobalEscape(event: KeyboardEvent): void {
    if (this.mostrarBuscadorChat) {
      this.mostrarBuscadorChat = false;
      this.queryBuscadorChat = '';
    } else if (this.chatVisible) {
      this.chatVisible = false;
    }
  }

  mensajesChat: ChatMessage[] = [
    {
      id: 1,
      texto: '¡Hola! Bienvenido a Emenet Comunicaciones 👋\n¿En qué podemos *ayudarte* hoy?',
      tipo: 'received',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      isRead: true,
      status: 'read'
    }
  ];

  toggleChat(): void {
    this.chatVisible = !this.chatVisible;
    if (this.chatVisible) {
      // 1er intento inmediato en el siguiente frame
      requestAnimationFrame(() => {
        this.scrollChatToBottom(false);
      });
      // 2do intento después de que Angular pinte todos los componentes del DOM
      setTimeout(() => {
        this.scrollChatToBottom(true);
      }, 50);
      // 3er intento por si tardan imágenes o fuentes en calcular altura
      setTimeout(() => {
        this.scrollChatToBottom(true);
      }, 150);
    }
  }

  scrollChatToBottom(smooth: boolean = true): void {
    if (isPlatformBrowser(this.platformId)) {
      const container = document.getElementById('chatMessages');
      if (container) {
        if (smooth) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        } else {
          container.scrollTop = container.scrollHeight;
        }
      }
    }
  }

  showAttachMenu: boolean = false;
  grabandoAudio: boolean = false;

  toggleAttachMenu(): void {
    this.showAttachMenu = !this.showAttachMenu;
  }

  agregarEmoji(emoji: string): void {
    this.mensajeChatInput += emoji;
  }

  onChatInputFilesPicked(files: File[]): void {
    if (files && files.length > 0) {
      files.forEach(f => {
        this.mensajesChat.push({
          texto: `📎 Archivo adjunto: ${f.name}`,
          tipo: 'sent'
        });
      });
      setTimeout(() => this.scrollChatToBottom(), 50);
    }
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        this.mensajesChat.push({
          texto: `📎 Archivo adjunto: ${files[i].name}`,
          tipo: 'sent'
        });
      }
      this.showAttachMenu = false;
      setTimeout(() => this.scrollChatToBottom(), 50);
    }
  }

  toggleMicrofono(): void {
    this.grabandoAudio = !this.grabandoAudio;
    if (!this.grabandoAudio) {
      this.mensajesChat.push({
        id: Date.now(),
        texto: '🎤 Nota de voz enviada',
        tipo: 'sent',
        timestamp: new Date(),
        isRead: false,
        status: 'sent'
      });
      setTimeout(() => this.scrollChatToBottom(), 50);
    }
  }

  toggleBuscadorChat(): void {
    this.mostrarBuscadorChat = !this.mostrarBuscadorChat;
    if (!this.mostrarBuscadorChat) {
      this.queryBuscadorChat = '';
    } else {
      setTimeout(() => {
        const input = document.getElementById('chatSearchInput');
        if (input) input.focus();
      }, 50);
    }
  }

  isSameDay(d1: any, d2: any): boolean {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  getDateDividerText(timestamp?: any): string {
    if (!timestamp) return 'Hoy';
    const d = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (this.isSameDay(d, today)) return 'Hoy';
    if (this.isSameDay(d, yesterday)) return 'Ayer';
    return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  }

  autoResizeTextarea(event: any): void {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  handleChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarTextoChat();
    }
  }

  enviarTextoChat(): void {
    const texto = this.mensajeChatInput.trim();
    if (!texto) return;

    const nuevoMsg: ChatMessage = {
      id: Date.now(),
      texto: texto,
      tipo: 'sent',
      timestamp: new Date(),
      isRead: false,
      status: 'delivered'
    };

    this.mensajesChat.push(nuevoMsg);
    this.mensajeChatInput = '';

    const textarea = document.getElementById('messageInput') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }

    // Simular que el bot lee el mensaje (2 palomitas azules) a los 1.2 segundos
    setTimeout(() => {
      nuevoMsg.isRead = true;
      nuevoMsg.status = 'read';
    }, 1200);

    // Simular respuesta del bot con formato WhatsApp (negritas, cursivas, listas)
    setTimeout(() => {
      this.mensajesChat.push({
        id: Date.now() + 1,
        texto: 'Gracias por comunicarte con *Emenet*. Un ejecutivo revisará tu mensaje a la brevedad.\n\nTambién puedes consultar nuestros servicios:\n• *Planes de Internet*: _Fibra Óptica hasta tu hogar_\n• *Atención a clientes*: Soporte técnico 24/7',
        tipo: 'received',
        timestamp: new Date(),
        isRead: true,
        status: 'read'
      });
      this.scrollChatToBottom();
    }, 2200);

    setTimeout(() => {
      this.scrollChatToBottom();
    }, 50);
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object, protected router: Router, public preloader: PreloaderService,
    private cdr: ChangeDetectorRef, private acceService: AccesibilidadService, public enviarService: EnviarMensajeService,
    private utilidades: UtilidadesService) {
    this.preloader.homePage$.subscribe((state) => {
      this.clases = state;
    });
    this.actualYear = new Date().getFullYear();
    this.items = [
      {
        label: 'Inicio',
        icon: 'pi pi-home',
        command: () => {
          this.router.navigate(['/']);
        }
      },
      {
        label: 'Planes',
        icon: 'pi pi-globe',
        command: () => {
          this.router.navigate(['/planes']);
        }
      },
      {
        label: 'Test de velocidad',
        icon: 'pi pi-cloud-download',
        command: () => {
          this.router.navigate(['/test-velocidad']);
        }
      },
      // {
      //   label: 'Móvil',
      //   icon: 'pi pi-mobile',
      //   command: () => {
      //     this.dialogMobile = true;
      //     // window.open('https://mobile.emenet.mx', '_blank')
      //   }
      // },
      {
        label: 'Contáctanos',
        icon: 'pi pi-envelope',
        command: () => {
          // this.visibleContacto = true;
          this.router.navigate(["/contactanos"]);
        }
      },
      {
        label: 'Sobre nosotros',
        icon: 'pi pi-building',
        command: () => {
          this.router.navigate(["/sobre-nosotros"]);
        }
      },

      // {
      //   label: 'Formas de pago',
      //   icon: 'pi pi-credit-card',
      //   command: () => {
      //     this.router.navigate(['/formas-de-pago']);
      //   }
      // },
    ];
    this.menuDial = [

      {
        icon: 'pi pi-facebook',
        command: () => window.open('https://www.facebook.com/profile.php?id=100077917024450', '_blank')
      },
      {
        icon: 'pi pi-instagram',
        command: () => window.open('https://www.instagram.com/mnetandador?igsh=a2NybTRjYmNxcG01', '_blank')
      },
      {
        icon: 'pi pi-phone',
        command: () => this.enviarService.llamar('7131334557')
      },
      {
        icon: 'pi pi-whatsapp',
        command: () => this.enviarService.enviarMensaje("Hola buen día", "7133475658")
      },
    ];
  }


  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.ajustarContenidoSegunPantalla.bind(this));
    }
  }

  ngAfterViewInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo(0, 0);
      });
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.ajustarContenidoSegunPantalla(), 1000);
    }
    setTimeout(() => {
      this.preloader.hide();
    }, 1000);

  }

  protected alternarContenido(event: Event): void {
    const icono = event.currentTarget as HTMLElement;
    icono.classList.toggle('girar');

    const contenedor = icono.closest('.bloque-alternar');
    if (!contenedor) return;

    const contenido = contenedor.querySelector('.alternar-contenido') as HTMLElement;
    if (!contenido) return;

    const estaExpandido = contenido.style.maxHeight && contenido.style.maxHeight !== '0px';

    if (estaExpandido) {
      contenido.style.maxHeight = '0';
    } else {
      contenido.style.maxHeight = contenido.scrollHeight + 'px';
    }
  }

  private ajustarContenidoSegunPantalla(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const contenidos = document.querySelectorAll<HTMLElement>('.alternar-contenido');
    contenidos.forEach((contenido) => {
      if (window.innerWidth >= 992) {
        contenido.style.maxHeight = contenido.scrollHeight + 'px';
      } else {
        contenido.style.maxHeight = '0';
      }
    });
  }

  opciones = [
    { texto: 'Crecer texto', icono: 'pi pi-plus', accion: () => this.acceService.incrementFont() },
    { texto: 'Reducir texto', icono: 'pi pi-minus', accion: () => this.acceService.decrementFont() },
    { texto: 'Escala de grises', icono: 'pi pi-palette', accion: () => this.acceService.grayScale() },
    { texto: 'Alto contraste', icono: 'pi pi-eye', accion: () => this.acceService.altContrast() },
    { texto: 'Contraste negativo', icono: 'pi pi-eye', accion: () => this.acceService.negativo() },
    { texto: 'Fondo claro', icono: 'pi pi-sun', accion: () => this.acceService.lightBackground() },
    { texto: 'Subrayar ligas', icono: 'pi pi-pencil', accion: () => this.acceService.underlineLinks() },
    { texto: 'Fuente legible', icono: 'pi pi-file-edit', accion: () => this.acceService.readableFont() },
    { texto: 'Reiniciar', icono: 'pi pi-refresh', accion: () => this.acceService.reiniciarValores() }
  ];

  menuDial: MenuItem[] | undefined;
  protected formasPago() {
    this.router.navigate(['/formas-de-pago']);
  }
  protected preguntasFrecuentes() {
    this.router.navigate(['/faq']);
  }
}
