import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface ChatMessage {
  id?: string | number;
  texto: string;
  tipo: 'sent' | 'received';
  timestamp?: number | Date | string;
  isRead?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  botones?: any[];
  mediaUrl?: string | null;
  mediaType?: 'image' | 'audio' | 'video' | 'document' | string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  attachments?: any[];
}

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.scss']
})
export class MessageBubbleComponent implements OnChanges {
  @Input() msg!: ChatMessage;
  @Input() isHighlighted: boolean = false;
  @Input() searchQuery: string = '';
  @Input() showDateDivider: boolean = false;
  @Input() dateDividerText: string = '';

  @Output() reply = new EventEmitter<ChatMessage>();

  formattedHtml: SafeHtml = '';
  displayTime: string = '';

  constructor(private sanitizer: DomSanitizer) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['msg'] || changes['searchQuery']) {
      this.updateContent();
    }
  }

  get isImage(): boolean {
    if (!this.msg) return false;
    if (this.msg.mediaType === 'image') return true;
    const url = (this.msg.mediaUrl || '').toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
  }

  get isAudio(): boolean {
    if (!this.msg) return false;
    if (this.msg.mediaType === 'audio') return true;
    const url = (this.msg.mediaUrl || '').toLowerCase();
    return /\.(mp3|ogg|wav|m4a|webm|aac)(\?.*)?$/i.test(url);
  }

  get isVideo(): boolean {
    if (!this.msg) return false;
    if (this.msg.mediaType === 'video') return true;
    const url = (this.msg.mediaUrl || '').toLowerCase();
    return /\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i.test(url);
  }

  get isDocument(): boolean {
    if (!this.msg) return false;
    if (this.msg.mediaType === 'document') return true;
    if (this.isImage || this.isAudio || this.isVideo) return false;
    return Boolean(this.msg.mediaUrl || this.msg.fileName);
  }

  get isOnlyMediaWithoutCaption(): boolean {
    if (!this.msg || !this.msg.texto) return true;
    const t = this.msg.texto.trim();
    if (t === '📷 Imagen' || t === '🎵 Audio' || t === '🎥 Video' || t.startsWith('📄 ') || t.startsWith('📎 Archivo adjunto:')) {
      return true;
    }
    return false;
  }

  formatFileSize(bytes?: number): string {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  abrirMedia(url?: string | null): void {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private updateContent(): void {
    if (!this.msg) return;

    this.displayTime = this.formatTime(this.msg.timestamp);

    const rawText = this.msg.texto || '';
    const formatted = this.processWhatsAppFormatting(rawText, this.searchQuery);
    this.formattedHtml = this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  private formatTime(ts?: number | Date | string): string {
    if (!ts) {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  private processWhatsAppFormatting(raw: string, query: string = ''): string {
    if (!raw) return '';

    // 1. Escapar HTML
    let text = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Bloques de código ```bloque```
    text = text.replace(/```([\s\S]*?)```/g, (_m, code) => {
      const safe = code.replace(/\n/g, '<br>');
      return `<pre class="code-block"><code>${safe}</code></pre>`;
    });

    // 3. Código inline `codigo`
    text = text.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');

    // 4. Formato WhatsApp idéntico a MessageBubble.jsx
    text = text.replace(/(?<![\w*])\*(?!\s)([^*\n]+?)(?<!\s)\*(?![\w*])/g, '<strong>$1</strong>');
    text = text.replace(/(?<![\w_])_(?!\s)([^_\n]+?)(?<!\s)_(?![\w_])/g, '<em>$1</em>');
    text = text.replace(/(?<![\w~])~(?!\s)([^~\n]+?)(?<!\s)~(?![\w~])/g, '<s>$1</s>');

    // 5. Citas tipo WhatsApp: > texto
    const lines = text.split('\n');
    let html = '';
    let quoteLines: string[] = [];

    const flushQuote = () => {
      if (quoteLines.length === 0) return;
      const content = quoteLines.join('<br>');
      html += `<div class="wa-quote"><div class="wa-quote-bar"></div><div class="wa-quote-content">${content}</div></div>`;
      quoteLines = [];
    };

    for (const line of lines) {
      if (line.trim().startsWith('&gt;')) {
        const cleaned = line.replace(/^\s*&gt;\s?/, '');
        quoteLines.push(cleaned);
      } else {
        flushQuote();
        html += `${line}\n`;
      }
    }
    flushQuote();
    text = html.replace(/\n$/g, '');

    // 6. Viñetas y listas
    text = this.formatBulletLists(text);

    // 7. URLs
    text = text.replace(
      /(https?:\/\/[^\s<]+)(?=\s|<|$)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>'
    );

    // 8. Resaltado de búsqueda si existe query
    if (query && query.trim().length > 0) {
      const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(`(?![^<]*>)(${cleanQ})`, 'gi'), '<mark class="highlight-search">$1</mark>');
    }

    return text;
  }

  private formatBulletLists(raw: string): string {
    const lines = raw.split('\n');
    const bulletRx = /^\s*([•\-\u2022\u00b7✅☑️✔️▪️]|\*)\s+(.*)$/u;
    let html = '';
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(bulletRx);
      if (m) {
        if (!inList) {
          if (html.endsWith('<br>')) html = html.replace(/(<br>)+$/, '');
          html += '<ul class="wa-bullet-list">';
          inList = true;
        }
        const symbol = m[1];
        let txt = m[2].replace(/^\s*([•\-\u2022\u00b7✅☑️✔️▪️]|\*)\s+/, '');
        html += `<li>${symbol} ${txt}</li>`;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        const trimmed = line.trim();
        if (trimmed.length > 0) {
          if (trimmed.startsWith('<pre') || trimmed.startsWith('<div') || trimmed.startsWith('</div>') || trimmed.startsWith('</pre>') || trimmed.startsWith('<ul') || trimmed.startsWith('</ul>')) {
            html += `${trimmed}`;
          } else {
            html += `${trimmed}<br>`;
          }
        } else if (!html.endsWith('<br><br>')) {
          html += '<br>';
        }
      }
    }
    if (inList) html += '</ul>';
    return html.replace(/(<br>)+$/, '');
  }
}
