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
import { WebchatService, WebchatBoton } from '../../services/webchat.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, MenubarModule, CommonModule, AccordionModule, AnimateOnScrollModule, ButtonModule, DialogModule,
    DrawerModule, ToggleSwitchModule, SpeedDialModule, DialogModule, MobileComponent, FormsModule, ChatInputComponent,
    MessageBubbleComponent, HttpClientModule],
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

  // Paginación y carga de mensajes anteriores
  readonly LIMITE_MENSAJES_PAGINA: number = 25;
  puedeCargarMas: boolean = false;
  cargandoMas: boolean = false;
  mostrarBotonCargarMas: boolean = false;

  // Colección total de mensajes históricos
  private todosLosMensajes: ChatMessage[] = [];

  // Mensajes renderizados en el DOM (máximo los últimos 25 inicialmente para carga ultrarrápida)
  mensajesChat: ChatMessage[] = [];

  // Estado del bot
  botTyping: boolean = false;
  botonesPendientes: WebchatBoton[] = [];
  sessionInicializada: boolean = false;

  @HostListener('document:keydown.escape', ['$event'])
  handleGlobalEscape(event: KeyboardEvent): void {
    if (this.mostrarBuscadorChat) {
      this.mostrarBuscadorChat = false;
      this.queryBuscadorChat = '';
    } else if (this.chatVisible) {
      this.chatVisible = false;
    }
  }

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

  onChatScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el) return;

    // Detectar cuando está cerca del tope superior (<= 80px) exactamente como en Neurexa
    const cercaArriba = el.scrollTop <= 80;
    this.mostrarBotonCargarMas = Boolean(this.puedeCargarMas && cercaArriba);
  }

  cargarMasMensajes(): void {
    if (!this.puedeCargarMas || this.cargandoMas) return;

    this.cargandoMas = true;
    const container = document.getElementById('chatMessages');
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    setTimeout(() => {
      // Calcular cuántos mensajes anteriores están pendientes de cargar
      const actualmenteCargados = this.mensajesChat.length;
      const totalDisponibles = this.todosLosMensajes.length;

      if (actualmenteCargados < totalDisponibles) {
        const nuevoIndiceInicio = Math.max(0, totalDisponibles - actualmenteCargados - this.LIMITE_MENSAJES_PAGINA);
        const segmentoAnterior = this.todosLosMensajes.slice(nuevoIndiceInicio, totalDisponibles - actualmenteCargados);

        this.mensajesChat = [...segmentoAnterior, ...this.mensajesChat];
        this.puedeCargarMas = nuevoIndiceInicio > 0;
      } else {
        this.puedeCargarMas = false;
      }

      this.cargandoMas = false;
      this.mostrarBotonCargarMas = false;

      // Mantener la posición de scroll donde estaba para que no salte abruptamente
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
        }
      });
    }, 450);
  }

  scrollChatToBottom(smooth: boolean = true): void {
    if (isPlatformBrowser(this.platformId)) {
      requestAnimationFrame(() => {
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
      });
      // Segundo intento tras pintar el DOM
      setTimeout(() => {
        const container = document.getElementById('chatMessages');
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
          });
        }
      }, 60);
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
        const msgArchivo: ChatMessage = {
          id: Date.now() + Math.random(),
          texto: `📎 Archivo adjunto: ${f.name}`,
          tipo: 'sent',
          timestamp: new Date(),
          isRead: false,
          status: 'delivered'
        };
        this.mensajesChat.push(msgArchivo);
        this.todosLosMensajes.push(msgArchivo);
      });
      this.scrollChatToBottom(true);
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
    if (!texto || this.botTyping) return;

    const nuevoMsg: ChatMessage = {
      id: Date.now(),
      texto: texto,
      tipo: 'sent',
      timestamp: new Date(),
      isRead: false,
      status: 'delivered'
    };

    this.mensajesChat.push(nuevoMsg);
    this.todosLosMensajes.push(nuevoMsg);
    this.mensajeChatInput = '';
    // Limpiar botones previos al enviar texto
    this.botonesPendientes = [];

    const textarea = document.getElementById('messageInput') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }
    this.scrollChatToBottom(true);

    // Marcar como leído a los 1.2s
    setTimeout(() => {
      nuevoMsg.isRead = true;
      nuevoMsg.status = 'read';
    }, 1200);

    // Mostrar typing indicator
    this.botTyping = true;

    // Llamar al backend de Neurexa
    this.webchatService.enviarMensaje(texto).subscribe({
      next: (respuestas) => {
        this.botTyping = false;
        // Limpiar botones pendientes antes de agregar los nuevos
        this.botonesPendientes = [];

        for (const msg of respuestas) {
          this.mensajesChat.push(msg);
          this.todosLosMensajes.push(msg);
          // Capturar botones del último mensaje que los tenga
          if (msg.botones && msg.botones.length > 0) {
            this.botonesPendientes = msg.botones;
          }
        }
        this.cdr.detectChanges();
        this.scrollChatToBottom(true);
      },
      error: () => {
        this.botTyping = false;
        const errorMsg: ChatMessage = {
          id: Date.now() + 1,
          texto: 'Lo siento, no pude conectarme. Por favor intenta de nuevo. 🙏',
          tipo: 'received',
          timestamp: new Date(),
          isRead: true,
          status: 'read'
        };
        this.mensajesChat.push(errorMsg);
        this.todosLosMensajes.push(errorMsg);
        this.scrollChatToBottom(true);
      }
    });
  }

  /** Maneja el clic en un botón/quick-reply del bot */
  onBotBotonClick(boton: WebchatBoton): void {
    if (this.botTyping) return;

    // Mostrar el label del botón como mensaje enviado
    const msgBoton: ChatMessage = {
      id: Date.now(),
      texto: boton.label,
      tipo: 'sent',
      timestamp: new Date(),
      isRead: false,
      status: 'delivered'
    };
    this.mensajesChat.push(msgBoton);
    this.todosLosMensajes.push(msgBoton);
    this.botonesPendientes = [];
    this.scrollChatToBottom(true);

    setTimeout(() => { msgBoton.isRead = true; msgBoton.status = 'read'; }, 1200);

    this.botTyping = true;

    this.webchatService.enviarBoton(boton.id, boton.label).subscribe({
      next: (respuestas) => {
        this.botTyping = false;
        this.botonesPendientes = [];

        for (const msg of respuestas) {
          this.mensajesChat.push(msg);
          this.todosLosMensajes.push(msg);
          if (msg.botones && msg.botones.length > 0) {
            this.botonesPendientes = msg.botones;
          }
        }
        this.cdr.detectChanges();
        this.scrollChatToBottom(true);
      },
      error: () => {
        this.botTyping = false;
        const errorMsg: ChatMessage = {
          id: Date.now() + 1,
          texto: 'No pude procesar la opción. Por favor escríbela manualmente. 🙏',
          tipo: 'received',
          timestamp: new Date(),
          isRead: true,
          status: 'read'
        };
        this.mensajesChat.push(errorMsg);
        this.todosLosMensajes.push(errorMsg);
        this.scrollChatToBottom(true);
      }
    });
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object, protected router: Router, public preloader: PreloaderService,
    private cdr: ChangeDetectorRef, private acceService: AccesibilidadService, public enviarService: EnviarMensajeService,
    private utilidades: UtilidadesService, private webchatService: WebchatService) {
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
    this.inicializarHistorialChat();

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.ajustarContenidoSegunPantalla.bind(this));
    }
  }

  private inicializarHistorialChat(): void {
    // Mostrar saludo de bienvenida local mientras se carga la respuesta real del bot
    const bienvenida: ChatMessage = {
      id: 1,
      texto: 'Hola! Bienvenido a *Emenet Comunicaciones* 👋\n¿En qué podemos ayudarte hoy?',
      tipo: 'received',
      timestamp: new Date(),
      isRead: true,
      status: 'read'
    };

    this.todosLosMensajes = [bienvenida];
    this.mensajesChat = [bienvenida];
    this.puedeCargarMas = false;

    // Pedir el menú de bienvenida real al bot (sin mostrar ningún mensaje del usuario)
    this.botTyping = true;
    this.webchatService.enviarMensaje('hola').subscribe({
      next: (respuestas) => {
        this.botTyping = false;
        // Reemplazar el mensaje de bienvenida local con el del bot
        this.mensajesChat = [];
        this.todosLosMensajes = [];
        this.botonesPendientes = [];

        for (const msg of respuestas) {
          this.mensajesChat.push(msg);
          this.todosLosMensajes.push(msg);
          if (msg.botones && msg.botones.length > 0) {
            this.botonesPendientes = msg.botones;
          }
        }
        this.cdr.detectChanges();
        setTimeout(() => this.scrollChatToBottom(false), 50);
      },
      error: () => {
        // Si falla la red, el mensaje de bienvenida local queda como fallback
        this.botTyping = false;
      }
    });
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
