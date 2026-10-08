import { AfterViewInit, ChangeDetectorRef, Component, HostListener, Inject, OnInit, OnDestroy } from '@angular/core';
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
import { WebchatService, WebchatBoton, WebchatMessage, WebchatUpdatesResult } from '../../services/webchat.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, MenubarModule, CommonModule, AccordionModule, AnimateOnScrollModule, ButtonModule, DialogModule,
    DrawerModule, ToggleSwitchModule, SpeedDialModule, DialogModule, MobileComponent, FormsModule, ChatInputComponent,
    MessageBubbleComponent, HttpClientModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  items: MenuItem[] | undefined;
  actualYear: number;
  clases!: boolean;
  accesibilidad: boolean = false;
  dialogMobile: boolean = false;
  chatVisible: boolean = false;
  mensajeChatInput: string = '';

  // Notificaciones de nuevos mensajes
  mensajesNoLeidos: number = 0;
  notificacionToastVisible: boolean = false;
  ultimoMensajeNotificacion: { texto: string; timestamp: Date; autor: string } | null = null;
  private pollingIntervalRef: any = null;
  private toastTimeoutRef: any = null;

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
      this.notificacionToastVisible = false;
      this.mensajesNoLeidos = 0;
      if (this.toastTimeoutRef) {
        clearTimeout(this.toastTimeoutRef);
        this.toastTimeoutRef = null;
      }
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

  /** Abre directamente el mini chat y resetea las notificaciones */
  abrirChat(): void {
    this.chatVisible = true;
    this.notificacionToastVisible = false;
    this.mensajesNoLeidos = 0;
    if (this.toastTimeoutRef) {
      clearTimeout(this.toastTimeoutRef);
      this.toastTimeoutRef = null;
    }
    requestAnimationFrame(() => {
      this.scrollChatToBottom(false);
    });
    setTimeout(() => {
      this.scrollChatToBottom(true);
    }, 50);
    setTimeout(() => {
      this.scrollChatToBottom(true);
    }, 150);
  }

  /** Cierra la notificación toast flotante */
  cerrarNotificacionToast(event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.notificacionToastVisible = false;
    if (this.toastTimeoutRef) {
      clearTimeout(this.toastTimeoutRef);
      this.toastTimeoutRef = null;
    }
  }

  /** Reproduce un tono sutil y agradable de notificación */
  reproducirSonidoNotificacion(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5

      osc1.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.4);
    } catch {
      // Ignorar restricciones de autoplay si aplican
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
      this.cdr.detectChanges();

      // Mantener la posición de scroll donde estaba para que no salte abruptamente
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
        }
      });
    }, 250);
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
    if (!files || files.length === 0) return;

    files.forEach(f => {
      const mime = (f.type || '').toLowerCase();
      let mediaType: 'image' | 'audio' | 'video' | 'document' = 'document';
      if (mime.startsWith('image/')) mediaType = 'image';
      else if (mime.startsWith('audio/')) mediaType = 'audio';
      else if (mime.startsWith('video/')) mediaType = 'video';

      let previewUrl = '';
      try {
        previewUrl = URL.createObjectURL(f);
      } catch (_) { }

      const defaultText = mediaType === 'image' ? '📷 Imagen' :
        mediaType === 'audio' ? '🎵 Audio' :
          mediaType === 'video' ? '🎥 Video' :
            `📄 ${f.name}`;

      const msgArchivo: ChatMessage = {
        id: Date.now() + Math.random(),
        texto: defaultText,
        tipo: 'sent',
        timestamp: new Date(),
        isRead: false,
        status: 'delivered',
        mediaUrl: previewUrl || undefined,
        mediaType: mediaType,
        fileName: f.name,
        fileSize: f.size,
        mimeType: f.type,
      };

      this.mensajesChat.push(msgArchivo);
      this.todosLosMensajes.push(msgArchivo);
      this.scrollChatToBottom(true);

      this.botTyping = true;
      this.botonesPendientes = [];

      this.webchatService.enviarArchivo(f, f.name).subscribe({
        next: (respuestas) => {
          this.botTyping = false;
          this.botonesPendientes = [];
          if (respuestas && respuestas.length > 0) {
            msgArchivo.isRead = true;
            msgArchivo.status = 'read';
          }

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
            texto: 'No se pudo enviar el archivo. Por favor intenta de nuevo. 🙏',
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
    });
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.onChatInputFilesPicked(Array.from(files));
      this.showAttachMenu = false;
      event.target.value = '';
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

    // Mostrar typing indicator
    this.botTyping = true;

    // Llamar al backend de Neurexa
    this.webchatService.enviarMensaje(texto).subscribe({
      next: (respuestas) => {
        this.botTyping = false;
        // Limpiar botones pendientes antes de agregar los nuevos
        this.botonesPendientes = [];
        if (respuestas && respuestas.length > 0) {
          nuevoMsg.isRead = true;
          nuevoMsg.status = 'read';
        }

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

    this.botTyping = true;

    this.webchatService.enviarBoton(boton.id, boton.label).subscribe({
      next: (respuestas) => {
        this.botTyping = false;
        this.botonesPendientes = [];
        if (respuestas && respuestas.length > 0) {
          msgBoton.isRead = true;
          msgBoton.status = 'read';
        }

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
      this.iniciarSondeoActualizaciones();
    }
  }

  ngOnDestroy(): void {
    if (this.pollingIntervalRef) {
      clearInterval(this.pollingIntervalRef);
      this.pollingIntervalRef = null;
    }
    if (this.toastTimeoutRef) {
      clearTimeout(this.toastTimeoutRef);
      this.toastTimeoutRef = null;
    }
  }

  private iniciarSondeoActualizaciones(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Sondeo cada 2.5s para detectar mensajes en tiempo real cuando el asesor o el bot contestan
    this.pollingIntervalRef = setInterval(() => {
      if (this.botTyping) return;

      const ultimoMsg = this.todosLosMensajes.length > 0
        ? this.todosLosMensajes[this.todosLosMensajes.length - 1]
        : null;

      const afterDate = ultimoMsg?.timestamp || undefined;

      this.webchatService.obtenerActualizaciones(afterDate).subscribe({
        next: (result: WebchatUpdatesResult | WebchatMessage[]) => {
          const nuevos = Array.isArray(result) ? result : (result?.messages || []);
          const unreadCount = !Array.isArray(result) ? result?.unreadCount : undefined;

          // Si el asesor abrió el chat en Neurexa (unreadCount === 0), actualizar checks de mensajes enviados a leídos
          if (unreadCount === 0) {
            let actualizoLectura = false;
            for (const m of this.todosLosMensajes) {
              if (m.tipo === 'sent' && (!m.isRead || m.status !== 'read')) {
                m.isRead = true;
                m.status = 'read';
                actualizoLectura = true;
              }
            }
            if (actualizoLectura) {
              this.cdr.detectChanges();
            }
          }

          if (!Array.isArray(nuevos) || nuevos.length === 0) return;

          let hayNuevosRecibidos = false;
          let ultimoRecibidoTexto = '';

          for (const m of nuevos) {
            const indexExistente = this.todosLosMensajes.findIndex(
              (existente) => String(existente.id) === String(m.id)
            );
            if (indexExistente !== -1) {
              if (m.status) {
                this.todosLosMensajes[indexExistente].status = m.status;
                this.todosLosMensajes[indexExistente].isRead = m.isRead;
              }
              continue;
            }

            this.todosLosMensajes.push(m);
            this.mensajesChat.push(m);

            if (m.botones && m.botones.length > 0) {
              this.botonesPendientes = m.botones;
            }

            if (m.tipo === 'received') {
              hayNuevosRecibidos = true;
              ultimoRecibidoTexto = m.texto || (m.mediaUrl ? '📷 Archivo adjunto' : 'Nuevo mensaje');
            }
          }

          if (hayNuevosRecibidos) {
            this.cdr.detectChanges();

            if (this.chatVisible) {
              this.scrollChatToBottom(true);
            } else {
              // Si el chat está cerrado, disparar notificación flotante y contador
              this.mensajesNoLeidos += 1;
              this.ultimoMensajeNotificacion = {
                texto: ultimoRecibidoTexto,
                timestamp: new Date(),
                autor: 'EMBOT',
              };
              this.notificacionToastVisible = true;
              this.reproducirSonidoNotificacion();

              // Auto-ocultar el banner toast a los 8 segundos
              if (this.toastTimeoutRef) {
                clearTimeout(this.toastTimeoutRef);
              }
              this.toastTimeoutRef = setTimeout(() => {
                this.notificacionToastVisible = false;
                this.cdr.detectChanges();
              }, 8000);
            }
          }
        },
        error: () => { }
      });
    }, 2500);
  }

  private inicializarHistorialChat(): void {
    this.todosLosMensajes = [];
    this.mensajesChat = [];
    this.puedeCargarMas = false;
    this.mostrarBotonCargarMas = false;

    // Inicializar chat (cargar historial existente o pedir bienvenida real al bot sin mandar 'hola')
    this.botTyping = true;
    this.webchatService.inicializarChat().subscribe({
      next: (respuestas) => {
        this.botTyping = false;
        this.todosLosMensajes = [...(respuestas || [])];

        // Mostrar solo los últimos 25 mensajes inicialmente
        if (this.todosLosMensajes.length > this.LIMITE_MENSAJES_PAGINA) {
          this.puedeCargarMas = true;
          this.mensajesChat = this.todosLosMensajes.slice(this.todosLosMensajes.length - this.LIMITE_MENSAJES_PAGINA);
        } else {
          this.puedeCargarMas = false;
          this.mensajesChat = [...this.todosLosMensajes];
        }

        this.cdr.detectChanges();
        setTimeout(() => this.scrollChatToBottom(false), 50);
      },
      error: () => {
        this.botTyping = false;
        this.cdr.detectChanges();
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
