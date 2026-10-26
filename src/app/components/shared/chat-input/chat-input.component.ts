import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ModeloIa {
  id: string;
  nombre: string;
  modelId: string;
  contenido: string;
  descripcion: string;
  badge: string;
  icono: string;
}

export const MODELOS_IA_DISPONIBLES: ModeloIa[] = [
  {
    id: 'ia-llama-3.2-3b',
    nombre: 'Llama 3.2 3B Instruct',
    modelId: 'llama-3.2-3b-instruct',
    contenido: '@ia Llama 3.2 3B Instruct ',
    descripcion: 'Rápido, conversacional y liviano • Meta 3B',
    badge: 'Meta • 3B',
    icono: '🦙',
  },
  {
    id: 'ia-gemma-4-12b',
    nombre: 'Gemma 4 12B',
    modelId: 'google/gemma-4-12b',
    contenido: '@ia Gemma 4 12B ',
    descripcion: 'Mayor capacidad de razonamiento • Google 12B',
    badge: 'Google • 12B',
    icono: '💎',
  },
  {
    id: 'ia-qwen-2.5-coder',
    nombre: 'Qwen2.5 Coder 3B Instruct',
    modelId: 'qwen2.5-coder-3b-instruct',
    contenido: '@ia Qwen2.5 Coder 3B Instruct ',
    descripcion: 'Especializado en código y lógica técnica • Qwen 3B',
    badge: 'Qwen • 3B Coder',
    icono: '⚡',
  },
];

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.component.html',
  styleUrl: './chat-input.component.scss'
})
export class ChatInputComponent {
  @Input() message: string = '';
  @Output() messageChange = new EventEmitter<string>();
  @Output() send = new EventEmitter<string>();
  @Output() fileSelect = new EventEmitter<File[]>();

  @Input() isReadOnly: boolean = false;
  showFormatToolbar: boolean = false;
  showAttachMenu: boolean = false;
  grabandoAudio: boolean = false;
  hayVoz: boolean = false;

  // Sugerencias de modelos IA (@ia)
  showIaMenu: boolean = false;
  modelosSugeridos: ModeloIa[] = [];
  iaIndiceSeleccionado: number = 0;
  iaTriggerStart: number | null = null;
  iaTriggerEnd: number | null = null;

  toggleAttachMenu(): void {
    this.showAttachMenu = !this.showAttachMenu;
  }

  closeAttachMenu(): void {
    this.showAttachMenu = false;
  }

  toggleFormatToolbar(): void {
    this.showFormatToolbar = !this.showFormatToolbar;
  }

  onTextSelect(event: any): void {
    const textarea = event.target as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;


    if (start !== end && (textarea.value.substring(start, end).trim().length > 0)) {
      this.showFormatToolbar = true;
    } else {
      this.showFormatToolbar = false;
    }
    this.verificarTriggerIa();
  }

  onTextareaBlur(): void {
    setTimeout(() => {
      const activeEl = document.activeElement;
      if (!activeEl || (!activeEl.closest('.chat-format-toolbar') && !activeEl.closest('.chat-ia-menu'))) {
        this.showFormatToolbar = false;
        this.cerrarMenuIa();
      }
    }, 200);
  }

  formatText(formatType: 'bold' | 'italic' | 'strike' | 'code' | 'quote' | 'bullet'): void {
    const textarea = document.getElementById('chatInputTextarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = this.message || '';
    const selected = val.substring(start, end);

    let prefix = '';
    let suffix = '';

    switch (formatType) {
      case 'bold':
        prefix = '*';
        suffix = '*';
        break;
      case 'italic':
        prefix = '_';
        suffix = '_';
        break;
      case 'strike':
        prefix = '~';
        suffix = '~';
        break;
      case 'code':
        prefix = '`';
        suffix = '`';
        break;
      case 'quote':
        prefix = '> ';
        suffix = '';
        break;
      case 'bullet':
        prefix = '• ';
        suffix = '';
        break;
    }

    if (start !== end) {

      const replacement = prefix + selected + suffix;
      this.message = val.substring(0, start) + replacement + val.substring(end);
      this.messageChange.emit(this.message);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    } else {

      const placeholder = formatType === 'bold' ? 'texto' : (formatType === 'italic' ? 'texto' : '');
      const insertion = prefix + placeholder + suffix;
      this.message = val.substring(0, start) + insertion + val.substring(end);
      this.messageChange.emit(this.message);

      setTimeout(() => {
        textarea.focus();
        const newPos = start + prefix.length + (placeholder ? placeholder.length : 0);
        textarea.setSelectionRange(start + prefix.length, newPos);
      }, 0);
    }
  }

  onFilesPicked(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.fileSelect.emit(Array.from(files));
      this.showAttachMenu = false;
      event.target.value = '';
    }
  }

  onEmojiClick(): void {
    this.message += '😊';
    this.messageChange.emit(this.message);
  }

  @Output() escapePressed = new EventEmitter<void>();

  onKeyDown(event: KeyboardEvent): void {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // Tecla ESC: cerrar menú IA, barra de formato o emitir para cerrar chat
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.showIaMenu) {
        this.cerrarMenuIa();
      } else if (this.showFormatToolbar) {
        this.showFormatToolbar = false;
      } else if (this.showAttachMenu) {
        this.showAttachMenu = false;
      } else {
        this.escapePressed.emit();
      }
      return;
    }

    // Interceptar navegación por teclado en el menú de sugerencias IA
    if (this.showIaMenu && this.modelosSugeridos.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.iaIndiceSeleccionado = Math.min(
          this.iaIndiceSeleccionado + 1,
          this.modelosSugeridos.length - 1
        );
        this.scrollModeloIntoView();
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.iaIndiceSeleccionado = Math.max(this.iaIndiceSeleccionado - 1, 0);
        this.scrollModeloIntoView();
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        const modelo = this.modelosSugeridos[this.iaIndiceSeleccionado];
        if (modelo) {
          this.seleccionarModelo(modelo);
        }
        return;
      }

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const modelo = this.modelosSugeridos[this.iaIndiceSeleccionado];
        if (modelo) {
          this.seleccionarModelo(modelo);
        }
        return;
      }
    }

    // Atajos de formato con combinación de teclas estilo whatsapp
    if (isCtrlOrCmd) {
      const key = event.key.toLowerCase();

      // Ctrl + B: Negrita (*texto*)
      if (key === 'b') {
        event.preventDefault();
        this.formatText('bold');
        return;
      }

      // Ctrl + I: Cursiva (_texto_)
      if (key === 'i') {
        event.preventDefault();
        this.formatText('italic');
        return;
      }

      // Ctrl + Shift + S o Ctrl + Shift + X: Tachado (~texto~)
      if ((event.shiftKey && key === 's') || (event.shiftKey && key === 'x')) {
        event.preventDefault();
        this.formatText('strike');
        return;
      }

      // Ctrl + E o Ctrl + `: Código monoespaciado (`código`)
      if (key === 'e' || key === '`') {
        event.preventDefault();
        this.formatText('code');
        return;
      }

      // Ctrl + Shift + 7 o Ctrl + Shift + U: Lista de viñetas
      if (event.shiftKey && (key === '7' || key === '8' || key === 'u')) {
        event.preventDefault();
        this.formatText('bullet');
        return;
      }

      // Ctrl + Shift + 9: Cita
      if (event.shiftKey && key === '9') {
        event.preventDefault();
        this.formatText('quote');
        return;
      }
    }

    // Enter sin Shift: Enviar mensaje
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onPaste(event: ClipboardEvent): void {
    if (this.isReadOnly) return;
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
      this.fileSelect.emit(imageFiles);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.isReadOnly) return;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.fileSelect.emit(Array.from(files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onInput(event: any): void {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
    this.messageChange.emit(this.message);
    this.verificarTriggerIa();
  }

  verificarTriggerIa(): void {
    const textarea = document.getElementById('chatInputTextarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const cursor = textarea.selectionStart ?? (this.message || '').length;
    const before = (this.message || '').slice(0, cursor);

    // Si ya tiene un modelo completo seleccionado, no mostrar sugerencias
    if (/(?:^|\s)@ia\s+(?:Llama 3\.2 3B Instruct|Gemma 4 12B|Qwen2\.5 Coder 3B Instruct)\b/i.test(before)) {
      this.cerrarMenuIa();
      return;
    }

    // Detectar si el usuario escribió @ia o @ia <filtro>
    const m = before.match(/(^|\s)@(ia(?:\s+[^\n]*)?)$/i);
    if (!m) {
      this.cerrarMenuIa();
      return;
    }

    const query = (m[2] || '').toString();
    const triggerLen = `@${query}`.length;
    this.iaTriggerStart = cursor - triggerLen;
    this.iaTriggerEnd = cursor;

    // Filtrar modelos
    const subFilter = query.replace(/^ia[:\s]*/i, '').trim().toLowerCase();
    if (!subFilter) {
      this.modelosSugeridos = [...MODELOS_IA_DISPONIBLES];
    } else {
      this.modelosSugeridos = MODELOS_IA_DISPONIBLES.filter(m => {
        const n = m.nombre.toLowerCase();
        const d = m.descripcion.toLowerCase();
        const b = m.badge.toLowerCase();
        return n.includes(subFilter) || d.includes(subFilter) || b.includes(subFilter);
      });
    }

    if (this.modelosSugeridos.length > 0) {
      this.showIaMenu = true;
      if (this.iaIndiceSeleccionado >= this.modelosSugeridos.length) {
        this.iaIndiceSeleccionado = 0;
      }
    } else {
      this.showIaMenu = false;
    }
  }

  cerrarMenuIa(): void {
    this.showIaMenu = false;
    this.modelosSugeridos = [];
    this.iaIndiceSeleccionado = 0;
    this.iaTriggerStart = null;
    this.iaTriggerEnd = null;
  }

  seleccionarModelo(modelo: ModeloIa): void {
    const textarea = document.getElementById('chatInputTextarea') as HTMLTextAreaElement;
    const val = this.message || '';
    const start = this.iaTriggerStart;
    const end = this.iaTriggerEnd;
    const contenido = modelo.contenido; // '@ia Llama 3.2 3B Instruct '

    if (start != null && end != null && start >= 0 && end >= start) {
      this.message = val.substring(0, start) + contenido + val.substring(end);
      const newCursor = start + contenido.length;
      this.messageChange.emit(this.message);
      this.cerrarMenuIa();

      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(newCursor, newCursor);
          textarea.style.height = 'auto';
          textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
        }
      }, 0);
    } else {
      this.message = contenido;
      this.messageChange.emit(this.message);
      this.cerrarMenuIa();

      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(this.message.length, this.message.length);
        }
      }, 0);
    }
  }

  private scrollModeloIntoView(): void {
    setTimeout(() => {
      const activeItem = document.querySelector('.chat-ia-menu .ia-item.active') as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  sendMessage(): void {
    this.cerrarMenuIa();
    const trimmed = (this.message || '').trim();
    if (!trimmed) return;
    this.send.emit(trimmed);
    this.message = '';
    this.messageChange.emit('');

    const el = document.getElementById('chatInputTextarea') as HTMLTextAreaElement;
    if (el) el.style.height = 'auto';
  }

  private mediaRecorder: any = null;
  private audioChunks: Blob[] = [];

  async toggleMicrofono(): Promise<void> {
    if (this.grabandoAudio) {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.stop();
        } catch (_) { }
      }
      this.grabandoAudio = false;
    } else {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.audioChunks = [];
          this.mediaRecorder = new MediaRecorder(stream);

          this.mediaRecorder.ondataavailable = (event: any) => {
            if (event.data && event.data.size > 0) {
              this.audioChunks.push(event.data);
            }
          };

          this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const audioFile = new File([audioBlob], `nota_de_voz_${Date.now()}.webm`, { type: 'audio/webm' });
            this.fileSelect.emit([audioFile]);
            try {
              stream.getTracks().forEach((t) => t.stop());
            } catch (_) { }
          };

          this.mediaRecorder.start();
          this.grabandoAudio = true;
        } else {
          console.warn('getUserMedia no soportado en este entorno');
        }
      } catch (err) {
        console.warn('No se pudo acceder al micrófono:', err);
        this.grabandoAudio = false;
      }
    }
  }
}