import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ModalAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  kind: 'image' | 'video' | 'audio' | 'document';
  preview: string;
}

export interface DocumentStyle {
  label: string;
  bg: string;
  chipBg: string;
  chipText: string;
}

@Component({
  selector: 'app-modal-enviar-imagen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-enviar-imagen.component.html',
  styleUrl: './modal-enviar-imagen.component.scss'
})
export class ModalEnviarImagenComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() attachments: ModalAttachment[] = [];
  @Input() contactName: string = 'EMBOT';
  @Input() initialCaption: string = '';
  @Input() selectedId: string | null = null;
  @Input() isSending: boolean = false;
  @Input() isUploading: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() select = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();
  @Output() addFiles = new EventEmitter<File[]>();
  @Output() send = new EventEmitter<{ [id: string]: string }>();

  @ViewChild('captionInput') captionInputRef?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('inputAgregar') inputAgregarRef?: ElementRef<HTMLInputElement>;
  @ViewChild('contenedorVisor') contenedorVisorRef?: ElementRef<HTMLDivElement>;

  captions: { [id: string]: string } = {};
  isDragging: boolean = false;

  // Zoom & Pan para visor de imágenes
  zoom: number = 1;
  pan: { x: number; y: number } = { x: 0, y: 0 };
  private isArrastrando: boolean = false;
  private ultimoPunto: { x: number; y: number } = { x: 0, y: 0 };

  get isBusy(): boolean {
    return Boolean(this.isSending || this.isUploading);
  }

  get selectedAttachment(): ModalAttachment | null {
    if (!this.attachments || this.attachments.length === 0) return null;
    if (this.selectedId) {
      const found = this.attachments.find(a => a.id === this.selectedId);
      if (found) return found;
    }
    return this.attachments[0];
  }

  get captionActual(): string {
    const sel = this.selectedAttachment;
    if (!sel) return '';
    return this.captions[sel.id] || '';
  }

  set captionActual(val: string) {
    const sel = this.selectedAttachment;
    if (!sel) return;
    this.captions[sel.id] = val;
  }

  ngOnInit(): void {
    this.initFirstCaption();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetVisor();
      this.initFirstCaption();
      setTimeout(() => {
        this.captionInputRef?.nativeElement?.focus();
      }, 50);
    }

    if (changes['selectedId']) {
      this.resetVisor();
    }

    if (changes['initialCaption'] && this.isOpen) {
      this.initFirstCaption();
    }

    if (changes['attachments'] && this.attachments.length > 0) {
      if (!this.selectedId || !this.attachments.some(a => a.id === this.selectedId)) {
        this.select.emit(this.attachments[0].id);
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalKeydown(e: KeyboardEvent): void {
    if (!this.isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.onClose();
    }
  }

  private initFirstCaption(): void {
    if (this.initialCaption && this.attachments && this.attachments.length > 0) {
      const firstId = this.attachments[0].id;
      if (this.captions[firstId] === undefined) {
        this.captions[firstId] = String(this.initialCaption);
      }
    }
  }

  resetVisor(): void {
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.isArrastrando = false;
  }

  manejarWheelVisor(e: WheelEvent): void {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const next = Math.min(5, Math.max(1, this.zoom * factor));
    if (next === 1) {
      this.pan = { x: 0, y: 0 };
    }
    this.zoom = next;
  }

  manejarPointerDown(e: PointerEvent): void {
    this.isArrastrando = true;
    this.ultimoPunto = { x: e.clientX, y: e.clientY };
    const el = e.currentTarget as HTMLElement;
    try {
      el?.setPointerCapture?.(e.pointerId);
    } catch (_) { }
  }

  manejarPointerMove(e: PointerEvent): void {
    if (!this.isArrastrando) return;
    const dx = e.clientX - this.ultimoPunto.x;
    const dy = e.clientY - this.ultimoPunto.y;
    this.ultimoPunto = { x: e.clientX, y: e.clientY };
    this.pan = { x: this.pan.x + dx, y: this.pan.y + dy };
  }

  manejarPointerUp(): void {
    this.isArrastrando = false;
  }

  handleBackdrop(e: MouseEvent): void {
    if (e.target === e.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    this.resetVisor();
    this.close.emit();
  }

  onSelectAttachment(id: string): void {
    this.select.emit(id);
    this.resetVisor();
  }

  onRemoveAttachment(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.remove.emit(id);
    delete this.captions[id];
  }

  handlePickMore(): void {
    if (this.isBusy) return;
    this.inputAgregarRef?.nativeElement?.click();
  }

  onFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input?.files && input.files.length > 0) {
      this.addFiles.emit(Array.from(input.files));
      input.value = '';
    }
  }

  handleCaptionKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  }

  handleCaptionInput(e: Event): void {
    const textarea = e.target as HTMLTextAreaElement;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }

  handleSend(): void {
    if (this.isBusy) return;
    this.send.emit(this.captions);
    this.captions = {};
    this.resetVisor();
  }

  // Drag and drop en modal
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    if (!this.isBusy) {
      this.isDragging = true;
    }
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
    if (this.isBusy) return;
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) {
      this.addFiles.emit(files);
    }
  }

  resolverTipoDocumento(item: { name: string; type?: string }): 'pdf' | 'word' | 'excel' | 'ppt' | 'html' | 'generic' {
    try {
      const nombre = String(item.name || '').toLowerCase();
      const mime = String(item.type || '').toLowerCase();
      const ext = (nombre.split('.').pop() || '').toLowerCase();
      const normalized = ext || mime;

      if (normalized === 'pdf' || mime === 'application/pdf') return 'pdf';
      if (['doc', 'docx'].includes(ext) || mime.includes('word') || mime.includes('officedocument.wordprocessingml')) {
        return 'word';
      }
      if (['xls', 'xlsx'].includes(ext) || mime.includes('excel') || mime.includes('officedocument.spreadsheetml')) {
        return 'excel';
      }
      if (['ppt', 'pptx'].includes(ext) || mime.includes('powerpoint') || mime.includes('officedocument.presentationml')) {
        return 'ppt';
      }
      if (['htm', 'html'].includes(ext) || mime === 'text/html') return 'html';
      return 'generic';
    } catch {
      return 'generic';
    }
  }

  obtenerEstiloDocumento(docKind: string): DocumentStyle {
    switch (docKind) {
      case 'pdf':
        return { label: 'PDF', bg: '#ef4444', chipBg: 'rgba(239, 68, 68, 0.15)', chipText: '#fca5a5' };
      case 'word':
        return { label: 'WORD', bg: '#3b82f6', chipBg: 'rgba(59, 130, 246, 0.15)', chipText: '#93c5fd' };
      case 'excel':
        return { label: 'EXCEL', bg: '#10b981', chipBg: 'rgba(16, 185, 129, 0.15)', chipText: '#6ee7b7' };
      case 'ppt':
        return { label: 'PPT', bg: '#f97316', chipBg: 'rgba(249, 115, 22, 0.15)', chipText: '#fdba74' };
      case 'html':
        return { label: 'HTML', bg: '#64748b', chipBg: 'rgba(100, 116, 139, 0.15)', chipText: '#cbd5e1' };
      default:
        return { label: 'ARCHIVO', bg: '#71717a', chipBg: 'rgba(255, 255, 255, 0.1)', chipText: 'rgba(255, 255, 255, 0.8)' };
    }
  }
}
