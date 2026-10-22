import { AfterViewInit, ChangeDetectorRef, Component, HostListener, Inject, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, RouterLinkActive, RouterLink } from '@angular/router';
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
import { ModalEnviarImagenComponent, ModalAttachment } from '../shared/modal-enviar-imagen/modal-enviar-imagen.component';
import { StaggeredMenuComponent, StaggeredMenuItem, StaggeredMenuSocialItem } from '../shared/staggered-menu/staggered-menu.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, MenubarModule, CommonModule, AccordionModule, AnimateOnScrollModule, ButtonModule, DialogModule,
    DrawerModule, ToggleSwitchModule, SpeedDialModule, DialogModule, MobileComponent, FormsModule, ChatInputComponent,
    MessageBubbleComponent, HttpClientModule, RouterLink, ModalEnviarImagenComponent, StaggeredMenuComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  items: MenuItem[] | undefined;
  staggeredMenuItems: StaggeredMenuItem[] = [
    { label: 'Inicio', ariaLabel: 'Ir al inicio', link: '/' },
    { label: 'Planes', ariaLabel: 'Ver planes de internet', link: '/planes' },
    { label: 'Test de velocidad', ariaLabel: 'Medir velocidad', link: '/test-velocidad' },
    { label: 'Contáctanos', ariaLabel: 'Ponerse en contacto', link: '/contactanos' },
    { label: 'Sobre nosotros', ariaLabel: 'Conoce más sobre nosotros', link: '/sobre-nosotros' },
    { label: 'Pagar mi servicio', ariaLabel: 'Pagar mi servicio en línea', link: '/pagar-servicio' },
    { label: 'Mi portal', ariaLabel: 'Portal del cliente', link: 'https://mi.emenet.mx', external: true }
  ];
  staggeredSocialItems: StaggeredMenuSocialItem[] = [
    { label: 'Facebook', link: 'https://www.facebook.com/profile.php?id=100077917024450' },
    { label: 'Instagram', link: 'https://www.instagram.com/mnetandador?igsh=a2NybTRjYmNxcG01' },
    { label: 'WhatsApp', link: 'https://wa.link/8q23c7' }
  ];
  actualYear: number;
  clases!: boolean;
  menuMovilAbierto: boolean = false;
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
  readonly LIMITE_MENSAJES_PAGINA: number = 10;
  puedeCargarMas: boolean = false;
  cargandoMas: boolean = false;
  mostrarBotonCargarMas: boolean = false;
  mostrarBotonScrollAbajo: boolean = false;

  // Colección total de mensajes históricos
  private todosLosMensajes: ChatMessage[] = [];

  // Mensajes renderizados en el DOM (máximo los últimos 10 inicialmente para carga ultrarrápida)
  mensajesChat: ChatMessage[] = [];

  // Estado del bot
  botTyping: boolean = false;
  botonesPendientes: WebchatBoton[] = [];
  sessionInicializada: boolean = false;

  // Estado de expansión al centro de la pantalla
  chatExpandido: boolean = false;

  // Estado del modal de información / teléfonos de EMBOT
  modalEmbotVisible: boolean = false;

  // Estado de cierre / minimización fluida estilo burbuja de Messenger
  chatClosing: boolean = false;
  private closeTimeoutRef: any = null;

  // Estado del modal de previsualizar y enviar imagen/archivos
  modalEnviarImagenVisible: boolean = false;
  attachmentsParaEnviar: ModalAttachment[] = [];
  selectedAttachmentId: string | null = null;
  captionModalAdjuntos: string = '';
  isDraggingFile: boolean = false;

  // Estado del Lightbox / Visor de imagen a pantalla completa con soporte Touch / Zoom
  imagenLightboxVisible: boolean = false;
  imagenLightboxUrl: string = '';
  imagenLightboxNombre: string = '';
  lightboxZoom: number = 1;
  lightboxPan: { x: number; y: number } = { x: 0, y: 0 };
  isLightboxGesturing: boolean = false;

  // Touch tracking para móviles
  private initialPinchDistance: number = 0;
  private initialPinchZoom: number = 1;
  private lastTouchPoint: { x: number; y: number } = { x: 0, y: 0 };
  private lastTapTimestamp: number = 0;
  private isMouseDragging: boolean = false;
  private lastMousePoint: { x: number; y: number } = { x: 0, y: 0 };

  abrirLightboxImagen(data: { url: string; name?: string }): void {
    if (!data?.url) return;
    this.imagenLightboxUrl = data.url;
    this.imagenLightboxNombre = data.name || 'Imagen';
    this.lightboxZoom = 1;
    this.lightboxPan = { x: 0, y: 0 };
    this.isLightboxGesturing = false;
    this.imagenLightboxVisible = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  cerrarLightboxImagen(): void {
    this.imagenLightboxVisible = false;
    this.imagenLightboxUrl = '';
    this.imagenLightboxNombre = '';
    this.lightboxZoom = 1;
    this.lightboxPan = { x: 0, y: 0 };
    this.isLightboxGesturing = false;
    if (isPlatformBrowser(this.platformId)) {
      if (!this.chatExpandido && !this.modalEmbotVisible && !this.modalEnviarImagenVisible) {
        document.body.style.overflow = '';
      }
    }
  }

  lightboxResetZoom(event?: Event): void {
    event?.stopPropagation();
    this.lightboxZoom = 1;
    this.lightboxPan = { x: 0, y: 0 };
  }

  lightboxZoomIn(event?: Event): void {
    event?.stopPropagation();
    this.setLightboxZoom(this.lightboxZoom * 1.35);
  }

  lightboxZoomOut(event?: Event): void {
    event?.stopPropagation();
    this.setLightboxZoom(this.lightboxZoom / 1.35);
  }

  setLightboxZoom(newZoom: number): void {
    const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
    const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 0;
    this.zoomHaciaPunto(newZoom, cx, cy);
  }

  /**
   * Realiza zoom directamente enfocado hacia las coordenadas del cursor o punto de contacto
   */
  private zoomHaciaPunto(targetZoom: number, cursorX: number, cursorY: number): void {
    const clamped = Math.min(5, Math.max(1, targetZoom));
    const newZoom = Math.round(clamped * 100) / 100;
    const oldZoom = this.lightboxZoom;

    if (newZoom <= 1.01) {
      this.lightboxZoom = 1;
      this.lightboxPan = { x: 0, y: 0 };
      return;
    }

    if (newZoom === oldZoom) return;

    // Centro del viewport
    const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : cursorX;
    const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : cursorY;

    // Vector relativo desde el centro de la pantalla al cursor
    const offsetX = cursorX - centerX;
    const offsetY = cursorY - centerY;

    // Mantener el mismo punto exacto de la imagen bajo el cursor
    const scaleRatio = newZoom / oldZoom;
    const rawPanX = offsetX * (1 - scaleRatio) + this.lightboxPan.x * scaleRatio;
    const rawPanY = offsetY * (1 - scaleRatio) + this.lightboxPan.y * scaleRatio;

    this.lightboxZoom = newZoom;

    // Limitar el desplazamiento para evitar que la imagen se salga del visor
    const maxX = typeof window !== 'undefined' ? (window.innerWidth * (newZoom - 1)) / 1.5 : 400;
    const maxY = typeof window !== 'undefined' ? (window.innerHeight * (newZoom - 1)) / 1.5 : 400;

    this.lightboxPan = {
      x: Math.max(-maxX, Math.min(maxX, rawPanX)),
      y: Math.max(-maxY, Math.min(maxY, rawPanY))
    };
  }

  // Gestos táctiles en pantallas móvil
  onLightboxTouchStart(e: TouchEvent): void {
    if (e.touches.length === 2) {
      this.isLightboxGesturing = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      this.initialPinchDistance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      this.initialPinchZoom = this.lightboxZoom;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - this.lastTapTimestamp < 320) {
        e.preventDefault();
        if (this.lightboxZoom > 1.05) {
          this.lightboxResetZoom();
        } else {
          this.zoomHaciaPunto(2.5, e.touches[0].clientX, e.touches[0].clientY);
        }
        this.lastTapTimestamp = 0;
        return;
      }
      this.lastTapTimestamp = now;

      if (this.lightboxZoom > 1) {
        this.isLightboxGesturing = true;
        this.lastTouchPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
  }

  onLightboxTouchMove(e: TouchEvent): void {
    if (e.touches.length === 2) {
      e.preventDefault();
      this.isLightboxGesturing = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (this.initialPinchDistance > 0) {
        const factor = currentDist / this.initialPinchDistance;
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        this.zoomHaciaPunto(this.initialPinchZoom * factor, midX, midY);
      }
    } else if (e.touches.length === 1 && this.lightboxZoom > 1) {
      e.preventDefault();
      this.isLightboxGesturing = true;
      const t = e.touches[0];
      const dx = t.clientX - this.lastTouchPoint.x;
      const dy = t.clientY - this.lastTouchPoint.y;
      this.lastTouchPoint = { x: t.clientX, y: t.clientY };
      this.aplicarPan(dx, dy);
    }
  }

  onLightboxTouchEnd(e: TouchEvent): void {
    if (e.touches.length === 0) {
      this.isLightboxGesturing = false;
      this.initialPinchDistance = 0;
      if (this.lightboxZoom <= 1.02) {
        this.lightboxResetZoom();
      }
    } else if (e.touches.length === 1) {
      this.lastTouchPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  // Soporte para rueda de mouse enfocado hacia la posición del cursor
  onLightboxWheel(e: WheelEvent): void {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
    this.zoomHaciaPunto(this.lightboxZoom * factor, e.clientX, e.clientY);
  }

  onLightboxPointerDown(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && this.lightboxZoom > 1) {
      this.isMouseDragging = true;
      this.isLightboxGesturing = true;
      this.lastMousePoint = { x: e.clientX, y: e.clientY };
      try {
        (e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
      } catch (_) { }
    }
  }

  onLightboxPointerMove(e: PointerEvent): void {
    if (this.isMouseDragging && this.lightboxZoom > 1) {
      const dx = e.clientX - this.lastMousePoint.x;
      const dy = e.clientY - this.lastMousePoint.y;
      this.lastMousePoint = { x: e.clientX, y: e.clientY };
      this.aplicarPan(dx, dy);
    }
  }

  onLightboxPointerUp(e: PointerEvent): void {
    this.isMouseDragging = false;
    this.isLightboxGesturing = false;
  }

  onLightboxDblClick(e: MouseEvent): void {
    e.stopPropagation();
    if (this.lightboxZoom > 1.05) {
      this.lightboxResetZoom();
    } else {
      this.zoomHaciaPunto(2.5, e.clientX, e.clientY);
    }
  }

  private aplicarPan(dx: number, dy: number): void {
    const maxX = typeof window !== 'undefined' ? (window.innerWidth * (this.lightboxZoom - 1)) / 1.5 : 400;
    const maxY = typeof window !== 'undefined' ? (window.innerHeight * (this.lightboxZoom - 1)) / 1.5 : 400;
    const nx = this.lightboxPan.x + dx;
    const ny = this.lightboxPan.y + dy;
    this.lightboxPan = {
      x: Math.max(-maxX, Math.min(maxX, nx)),
      y: Math.max(-maxY, Math.min(maxY, ny))
    };
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleGlobalEscape(event: KeyboardEvent): void {
    if (this.imagenLightboxVisible) {
      this.cerrarLightboxImagen();
    } else if (this.modalEnviarImagenVisible) {
      this.cerrarModalEnviarImagen();
    } else if (this.modalEmbotVisible) {
      this.cerrarModalEmbot();
    } else if (this.mostrarBuscadorChat) {
      this.mostrarBuscadorChat = false;
      this.queryBuscadorChat = '';
    } else if (this.chatExpandido) {
      this.chatExpandido = false;
      if (isPlatformBrowser(this.platformId)) {
        if (!this.modalEmbotVisible && !this.modalEnviarImagenVisible && !this.imagenLightboxVisible) {
          document.body.style.overflow = '';
        }
      }
    } else if (this.chatVisible) {
      this.minimizarChat();
    }
  }

  @HostListener('window:paste', ['$event'])
  handleGlobalPaste(event: ClipboardEvent): void {
    if (!this.chatVisible || this.modalEnviarImagenVisible) return;
    const items = event.clipboardData?.items;
    if (!items || items.length === 0) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const mime = String(item.type || '').toLowerCase();
      if (mime.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) {
          const ext = mime.split('/')[1] || 'png';
          const name = f.name && f.name !== 'image.png' ? f.name : `clipboard_${Date.now()}.${ext}`;
          imageFiles.push(new File([f], name, { type: f.type || mime }));
        }
      }
    }

    if (imageFiles.length > 0) {
      event.preventDefault();
      this.abrirModalConArchivos(imageFiles);
    }
  }

  toggleChatExpandido(): void {
    this.chatExpandido = !this.chatExpandido;
    if (isPlatformBrowser(this.platformId)) {
      if (this.chatExpandido || this.modalEmbotVisible) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  abrirModalEmbot(): void {
    this.modalEmbotVisible = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  cerrarModalEmbot(): void {
    this.modalEmbotVisible = false;
    if (isPlatformBrowser(this.platformId)) {
      if (!this.chatExpandido) {
        document.body.style.overflow = '';
      }
    }
  }

  toggleChat(): void {
    if (this.chatVisible && !this.chatClosing) {
      this.minimizarChat();
      return;
    }

    if (this.closeTimeoutRef) {
      clearTimeout(this.closeTimeoutRef);
      this.closeTimeoutRef = null;
    }
    this.chatClosing = false;
    this.chatVisible = true;
    this.chatExpandido = false;
    this.notificacionToastVisible = false;
    this.mensajesNoLeidos = 0;
    this.webchatService.marcarLeido().subscribe();
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

  /** Minimiza el mini chat con animación fluida estilo burbuja de Messenger */
  minimizarChat(): void {
    if (!this.chatVisible || this.chatClosing) return;
    this.chatClosing = true;
    this.modalEmbotVisible = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }

    if (this.closeTimeoutRef) {
      clearTimeout(this.closeTimeoutRef);
    }
    this.closeTimeoutRef = setTimeout(() => {
      this.chatVisible = false;
      this.chatClosing = false;
      this.chatExpandido = false;
      this.closeTimeoutRef = null;
      this.cdr.detectChanges();
    }, 280);
  }

  /** Abre el panel de herramientas de accesibilidad y oculta el chat si estuviera abierto */
  abrirAccesibilidad(): void {
    this.accesibilidad = true;
    if (this.chatVisible) {
      this.chatVisible = false;
      this.chatClosing = false;
      this.chatExpandido = false;
      if (this.closeTimeoutRef) {
        clearTimeout(this.closeTimeoutRef);
        this.closeTimeoutRef = null;
      }
      if (isPlatformBrowser(this.platformId)) {
        document.body.style.overflow = '';
      }
    }
  }

  /** Abre directamente el mini chat y resetea las notificaciones */
  abrirChat(): void {
    this.chatVisible = true;
    this.notificacionToastVisible = false;
    this.mensajesNoLeidos = 0;
    this.webchatService.marcarLeido().subscribe();
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

    // Detectar si el usuario está lejos del final (mostrar botón chevron-down)
    const UMBRAL_CERCA_ABAJO_PX = 140;
    const distanciaAbajo = el.scrollHeight - (el.scrollTop + el.clientHeight);
    this.mostrarBotonScrollAbajo = distanciaAbajo > UMBRAL_CERCA_ABAJO_PX;

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
    this.mostrarBotonScrollAbajo = false;
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
          this.mostrarBotonScrollAbajo = false;
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

  onChatDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.botTyping) return;
    this.isDraggingFile = true;
  }

  onChatDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const related = event.relatedTarget as HTMLElement;
    const container = document.getElementById('chatContainer');
    if (!container || !container.contains(related)) {
      this.isDraggingFile = false;
    }
  }

  onChatDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;
    if (this.botTyping) return;
    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length > 0) {
      this.abrirModalConArchivos(files);
    }
  }

  abrirModalConArchivos(files: File[]): void {
    if (!files || files.length === 0) return;

    const newAttachments: ModalAttachment[] = files.map(file => {
      const mime = (file.type || '').toLowerCase();
      let kind: 'image' | 'video' | 'audio' | 'document' = 'document';
      if (mime.startsWith('image/')) kind = 'image';
      else if (mime.startsWith('video/')) kind = 'video';
      else if (mime.startsWith('audio/')) kind = 'audio';

      let preview = '';
      try {
        preview = URL.createObjectURL(file);
      } catch (_) { }

      return {
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        kind,
        preview
      };
    });

    if (this.mensajeChatInput && this.mensajeChatInput.trim()) {
      this.captionModalAdjuntos = this.mensajeChatInput.trim();
      this.mensajeChatInput = '';
    } else {
      this.captionModalAdjuntos = '';
    }

    this.attachmentsParaEnviar = [...this.attachmentsParaEnviar, ...newAttachments];
    if (!this.selectedAttachmentId && this.attachmentsParaEnviar.length > 0) {
      this.selectedAttachmentId = this.attachmentsParaEnviar[0].id;
    }
    this.modalEnviarImagenVisible = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
    this.cdr.detectChanges();
  }

  onSelectAttachment(id: string): void {
    this.selectedAttachmentId = id;
    this.cdr.detectChanges();
  }

  onRemoveAttachment(id: string): void {
    const found = this.attachmentsParaEnviar.find(a => a.id === id);
    if (found?.preview) {
      try {
        URL.revokeObjectURL(found.preview);
      } catch (_) { }
    }
    this.attachmentsParaEnviar = this.attachmentsParaEnviar.filter(a => a.id !== id);
    if (this.selectedAttachmentId === id) {
      this.selectedAttachmentId = this.attachmentsParaEnviar[0]?.id || null;
    }
    if (this.attachmentsParaEnviar.length === 0) {
      this.cerrarModalEnviarImagen();
    }
    this.cdr.detectChanges();
  }

  onAddFilesToModal(files: File[]): void {
    if (!files || files.length === 0) return;
    const moreAttachments: ModalAttachment[] = files.map(file => {
      const mime = (file.type || '').toLowerCase();
      let kind: 'image' | 'video' | 'audio' | 'document' = 'document';
      if (mime.startsWith('image/')) kind = 'image';
      else if (mime.startsWith('video/')) kind = 'video';
      else if (mime.startsWith('audio/')) kind = 'audio';

      let preview = '';
      try {
        preview = URL.createObjectURL(file);
      } catch (_) { }

      return {
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        kind,
        preview
      };
    });

    this.attachmentsParaEnviar = [...this.attachmentsParaEnviar, ...moreAttachments];
    if (!this.selectedAttachmentId && this.attachmentsParaEnviar.length > 0) {
      this.selectedAttachmentId = this.attachmentsParaEnviar[0].id;
    }
    this.cdr.detectChanges();
  }

  cerrarModalEnviarImagen(): void {
    this.modalEnviarImagenVisible = false;
    this.attachmentsParaEnviar.forEach(a => {
      if (a.preview) {
        try {
          URL.revokeObjectURL(a.preview);
        } catch (_) { }
      }
    });
    this.attachmentsParaEnviar = [];
    this.selectedAttachmentId = null;
    this.captionModalAdjuntos = '';
    if (isPlatformBrowser(this.platformId)) {
      if (!this.chatExpandido) {
        document.body.style.overflow = '';
      }
    }
    this.cdr.detectChanges();
  }

  enviarDesdeModalEnviarImagen(captions: { [id: string]: string }): void {
    if (this.attachmentsParaEnviar.length === 0) {
      this.cerrarModalEnviarImagen();
      return;
    }

    const itemsToSend = [...this.attachmentsParaEnviar];
    this.modalEnviarImagenVisible = false;
    if (isPlatformBrowser(this.platformId)) {
      if (!this.chatExpandido) {
        document.body.style.overflow = '';
      }
    }
    this.attachmentsParaEnviar = [];
    this.selectedAttachmentId = null;
    this.captionModalAdjuntos = '';

    itemsToSend.forEach(att => {
      const caption = (captions[att.id] || '').trim();
      const defaultText = caption || (
        att.kind === 'image' ? '📷 Imagen' :
          att.kind === 'audio' ? '🎵 Audio' :
            att.kind === 'video' ? '🎥 Video' :
              `📄 ${att.name}`
      );

      const msgArchivo: ChatMessage = {
        id: Date.now() + Math.random(),
        texto: defaultText,
        tipo: 'sent',
        timestamp: new Date(),
        isRead: false,
        status: 'delivered',
        mediaUrl: att.preview || undefined,
        mediaType: att.kind,
        fileName: att.name,
        fileSize: att.size,
        mimeType: att.type,
      };

      this.mensajesChat.push(msgArchivo);
      this.todosLosMensajes.push(msgArchivo);
      this.scrollChatToBottom(true);

      this.botTyping = true;
      this.botonesPendientes = [];

      this.webchatService.enviarArchivo(att.file, att.name, caption || undefined).subscribe({
        next: (res) => {
          this.botTyping = false;
          this.botonesPendientes = [];

          if (res?.messageId) {
            msgArchivo.id = res.messageId;
          }
          if (res?.fileUrl) {
            msgArchivo.mediaUrl = res.fileUrl;
          }
          if (res?.file?.fileName && !msgArchivo.fileName) {
            msgArchivo.fileName = res.file.fileName;
          }

          const respuestas = res?.respuestas || [];
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

    this.cdr.detectChanges();
  }

  enviarArchivoDirecto(f: File): void {
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
      next: (res) => {
        this.botTyping = false;
        this.botonesPendientes = [];

        if (res?.messageId) {
          msgArchivo.id = res.messageId;
        }
        if (res?.fileUrl) {
          msgArchivo.mediaUrl = res.fileUrl;
        }
        if (res?.file?.fileName && !msgArchivo.fileName) {
          msgArchivo.fileName = res.file.fileName;
        }

        const respuestas = res?.respuestas || [];
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
  }

  onChatInputFilesPicked(files: File[]): void {
    if (!files || files.length === 0) return;
    const esNotaDeVozMic = files.length === 1 && files[0].name.startsWith('nota_de_voz_');
    if (esNotaDeVozMic) {
      this.enviarArchivoDirecto(files[0]);
      return;
    }
    this.abrirModalConArchivos(files);
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

    // Redirección y scroll según el botón presionado
    const botonId = (boton.id || '').toLowerCase();
    const botonLabel = (boton.label || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (botonId === 'met_pago' || botonLabel.includes('metodos de pago')) {
      if (this.router.url === '/formas-de-pago' || this.router.url.startsWith('/formas-de-pago#')) {
        if (isPlatformBrowser(this.platformId)) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        this.router.navigate(['/formas-de-pago']);
      }
    } else if (botonId === 'btn_sucursales' || botonLabel.includes('sucursales')) {
      if (this.router.url.startsWith('/formas-de-pago')) {
        if (isPlatformBrowser(this.platformId)) {
          const el = document.getElementById('pago-presencial-sucursal');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      } else {
        this.router.navigate(['/formas-de-pago'], { fragment: 'pago-presencial' });
      }
    } else if (botonId === 'btn_buscar_num_cliente' || botonLabel.includes('buscar mi numero')) {
      if (this.router.url === '/pagar-servicio') {
        if (isPlatformBrowser(this.platformId)) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        this.router.navigate(['/pagar-servicio']);
      }
    }

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
        routerLink: '/'
      },
      {
        label: 'Planes',
        icon: 'pi pi-globe',
        routerLink: '/planes'
      },
      {
        label: 'Test de velocidad',
        icon: 'pi pi-cloud-download',
        routerLink: '/test-velocidad'
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
        routerLink: '/contactanos'
      },
      {
        label: 'Sobre nosotros',
        icon: 'pi pi-building',
        routerLink: '/sobre-nosotros'
      },
      {
        label: 'Mi portal',
        icon: 'pi pi-user',
        externo: 'https://mi.emenet.mx'
      },
      // {
      //   label: 'Formas de pago',
      //   icon: 'pi pi-credit-card',
      //   routerLink: '/formas-de-pago'
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
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
    if (this.pollingIntervalRef) {
      clearInterval(this.pollingIntervalRef);
      this.pollingIntervalRef = null;
    }
    if (this.toastTimeoutRef) {
      clearTimeout(this.toastTimeoutRef);
      this.toastTimeoutRef = null;
    }
    if (this.closeTimeoutRef) {
      clearTimeout(this.closeTimeoutRef);
      this.closeTimeoutRef = null;
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

      this.webchatService.obtenerActualizaciones(afterDate, this.chatVisible).subscribe({
        next: (result: WebchatUpdatesResult | WebchatMessage[]) => {
          const nuevos = Array.isArray(result) ? result : (result?.messages || []);
          const unreadCount = !Array.isArray(result) ? result?.unreadCount : undefined;

          let hayNuevosRecibidos = false;
          let ultimoRecibidoTexto = '';

          if (Array.isArray(nuevos) && nuevos.length > 0) {
            for (const m of nuevos) {
              // 1. Coincidencia directa por ID exacto
              let indexExistente = this.todosLosMensajes.findIndex(
                (existente) => String(existente.id) === String(m.id)
              );

              // 2. Si es un mensaje 'sent' (enviado por el cliente), buscar si ya existe el mensaje optimista local
              if (indexExistente === -1 && m.tipo === 'sent') {
                indexExistente = this.todosLosMensajes.findIndex((existente) => {
                  if (existente.tipo !== 'sent') return false;

                  // Mensaje con archivo o imagen
                  if (m.mediaUrl || m.fileName || existente.mediaUrl || existente.fileName) {
                    const mismoNombre = !!(existente.fileName && m.fileName && existente.fileName === m.fileName);
                    const mismoTexto = !!(existente.texto && m.texto && existente.texto === m.texto);
                    const mismoUrl = !!(
                      existente.mediaUrl && m.mediaUrl &&
                      (existente.mediaUrl === m.mediaUrl ||
                        existente.mediaUrl.includes(m.fileName || '') ||
                        m.mediaUrl.includes(existente.fileName || ''))
                    );

                    const timeDiff = Math.abs(
                      new Date(existente.timestamp || 0).getTime() - new Date(m.timestamp || 0).getTime()
                    );
                    if ((mismoNombre || mismoUrl || mismoTexto) && timeDiff < 180000) {
                      return true;
                    }
                  }

                  // Mensaje de texto normal
                  if (existente.texto && m.texto && existente.texto === m.texto) {
                    const timeDiff = Math.abs(
                      new Date(existente.timestamp || 0).getTime() - new Date(m.timestamp || 0).getTime()
                    );
                    if (timeDiff < 90000) {
                      return true;
                    }
                  }

                  return false;
                });
              }

              // 3. Si es un mensaje 'received' (del bot/asesor), evitar duplicado si ya fue agregado por la respuesta HTTP inmediata
              if (indexExistente === -1 && m.tipo === 'received') {
                indexExistente = this.todosLosMensajes.findIndex((existente) => {
                  if (existente.tipo !== 'received') return false;

                  const timeDiff = Math.abs(
                    new Date(existente.timestamp || 0).getTime() - new Date(m.timestamp || 0).getTime()
                  );

                  // Si el texto coincide y fue recibido en un rango cercano a 45 segundos
                  if (existente.texto && m.texto && existente.texto.trim() === m.texto.trim() && timeDiff < 45000) {
                    return true;
                  }

                  // Si ambos tienen la misma imagen / media
                  if (existente.mediaUrl && m.mediaUrl && existente.mediaUrl === m.mediaUrl && timeDiff < 45000) {
                    return true;
                  }

                  return false;
                });
              }

              if (indexExistente !== -1) {
                const existente = this.todosLosMensajes[indexExistente];
                existente.id = m.id;
                if (m.status) {
                  existente.status = m.status;
                  existente.isRead = m.isRead;
                }
                if (m.mediaUrl && (!existente.mediaUrl || existente.mediaUrl.startsWith('blob:'))) {
                  existente.mediaUrl = m.mediaUrl;
                }
                if (m.botones && m.botones.length > 0) {
                  existente.botones = m.botones;
                  this.botonesPendientes = m.botones;
                }

                // Sincronizar en la lista de mensajes renderizados en el DOM
                const chatMsg = this.mensajesChat.find(
                  (c) => String(c.id) === String(existente.id) || c === existente
                );
                if (chatMsg) {
                  chatMsg.id = m.id;
                  if (m.status) {
                    chatMsg.status = m.status;
                    chatMsg.isRead = m.isRead;
                  }
                  if (m.mediaUrl && (!chatMsg.mediaUrl || chatMsg.mediaUrl.startsWith('blob:'))) {
                    chatMsg.mediaUrl = m.mediaUrl;
                  }
                  if (m.botones && m.botones.length > 0) {
                    chatMsg.botones = m.botones;
                  }
                }
                continue;
              }

              // Evitar duplicados por ID en las listas
              if (!this.todosLosMensajes.some(t => String(t.id) === String(m.id))) {
                this.todosLosMensajes.push(m);
              }
              if (!this.mensajesChat.some(c => String(c.id) === String(m.id))) {
                this.mensajesChat.push(m);
              }

              if (m.botones && m.botones.length > 0) {
                this.botonesPendientes = m.botones;
              }

              if (m.tipo === 'received') {
                hayNuevosRecibidos = true;
                ultimoRecibidoTexto = m.texto || (m.mediaUrl ? '📷 Archivo adjunto' : 'Nuevo mensaje');
              }
            }
          }

          // Si el asesor abrió el chat en Neurexa (unreadCount === 0) o contestó un mensaje, actualizar checks de enviados a leídos
          if (unreadCount === 0 || hayNuevosRecibidos) {
            for (const m of this.todosLosMensajes) {
              if (m.tipo === 'sent' && (!m.isRead || m.status !== 'read')) {
                m.isRead = true;
                m.status = 'read';
              }
            }
          }

          if (hayNuevosRecibidos || unreadCount === 0) {
            this.cdr.detectChanges();
          }

          if (hayNuevosRecibidos) {
            if (this.chatVisible) {
              this.scrollChatToBottom(true);
              this.webchatService.marcarLeido().subscribe();
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

        // Mostrar solo los últimos 10 mensajes inicialmente
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
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        if (!event.urlAfterRedirects?.includes('#') && !event.url?.includes('#')) {
          window.scrollTo(0, 0);
        }
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
    if (window.innerWidth >= 992 && this.menuMovilAbierto) {
      this.menuMovilAbierto = false;
      document.body.style.overflow = '';
      this.cdr.detectChanges();
    }
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
