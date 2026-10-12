import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  }

  onTextareaBlur(): void {
    setTimeout(() => {
      const activeEl = document.activeElement;
      if (!activeEl || !activeEl.closest('.chat-format-toolbar')) {
        this.showFormatToolbar = false;
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

    // Tecla ESC: cerrar barra de formato o emitir para cerrar chat
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.showFormatToolbar) {
        this.showFormatToolbar = false;
      } else if (this.showAttachMenu) {
        this.showAttachMenu = false;
      } else {
        this.escapePressed.emit();
      }
      return;
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

  onInput(event: any): void {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
    this.messageChange.emit(this.message);
  }

  sendMessage(): void {
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