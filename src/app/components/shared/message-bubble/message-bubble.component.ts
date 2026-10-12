import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
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
  styleUrls: ['./message-bubble.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MessageBubbleComponent implements OnChanges {
  @Input() msg!: ChatMessage;
  @Input() isHighlighted: boolean = false;
  @Input() searchQuery: string = '';
  @Input() showDateDivider: boolean = false;
  @Input() dateDividerText: string = '';

  @Output() reply = new EventEmitter<ChatMessage>();
  @Output() buttonClick = new EventEmitter<any>();

  formattedHtml: SafeHtml = '';
  displayTime: string = '';

  constructor(private sanitizer: DomSanitizer) { }

  onBotonClick(boton: any): void {
    if (boton) {
      this.buttonClick.emit(boton);
    }
  }

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

  private renderEstadoDeCuentaApple(raw: string): string | null {
    if (!raw) return null;
    const lower = raw.toLowerCase();
    const isStatement = lower.includes('estado de cuenta') && (
      lower.includes('comprobante') || lower.includes('monto') || lower.includes('fecha') || lower.includes('ago') || lower.includes('sep')
    );
    if (!isStatement) return null;

    // Eliminar completamente cualquier línea horizontal divisoria (━━━━, ────, ____, etc.)
    const cleanLines = raw
      .replace(/[━─—\-_=\.]{3,}/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const cards: Array<{
      mes: string;
      fecha?: string;
      monto?: string;
      estado?: string;
      comprobanteUrl?: string;
    }> = [];

    const footerMessages: string[] = [];
    let currentCard: { mes: string; fecha?: string; monto?: string; estado?: string; comprobanteUrl?: string } | null = null;

    for (const line of cleanLines) {
      // Ignorar encabezados 'ESTADO DE CUENTA'
      if (/estado\s+de\s+cuenta/i.test(line)) {
        continue;
      }

      // Detectar inicio de un mes (e.g. "➡️ *AGO 2026*" o "➡️ AGO 2026")
      const monthMatch = line.match(/\b(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\b/i);
      const isArrowStart = line.startsWith('➡️') || line.startsWith('▶️') || line.startsWith('👉');

      if ((isArrowStart && monthMatch) || (monthMatch && !line.includes(':'))) {
        if (currentCard) {
          cards.push(currentCard);
        }
        const cleanMonth = line.replace(/[➡️▶️👉*]/g, '').trim();
        currentCard = { mes: cleanMonth, estado: 'Pagado' };
        continue;
      }

      // Si tenemos un mes activo, extraer sus campos
      if (currentCard) {
        if (/fecha/i.test(line)) {
          const val = line.replace(/^[📅🗓️\s*]*fecha:?\s*/i, '').replace(/[*_]/g, '').trim();
          currentCard.fecha = val;
          continue;
        }

        if (/monto/i.test(line)) {
          const val = line.replace(/^[💲💵\s*]*monto:?\s*/i, '').replace(/[*_]/g, '').trim();
          currentCard.monto = val;
          continue;
        }

        if (/estado/i.test(line)) {
          const val = line.replace(/^[💵\s*]*estado:?\s*/i, '').replace(/[*_]/g, '').trim();
          currentCard.estado = val;
          continue;
        }

        if (/comprobante/i.test(line) || /https?:\/\//i.test(line)) {
          const urlMatch = line.match(/(https?:\/\/[^\s<]+)/i);
          if (urlMatch) {
            currentCard.comprobanteUrl = urlMatch[1];
            continue;
          }
        }
      }

      // Notas finales (Felicidades, Total a pagar, duración del link, etc.)
      if (
        /felicidades/i.test(line) ||
        /corriente/i.test(line) ||
        /duracion/i.test(line) ||
        /total a pagar/i.test(line) ||
        /realiza tu pago/i.test(line)
      ) {
        footerMessages.push(line.replace(/[*_]/g, '').trim());
      }
    }

    if (currentCard) {
      cards.push(currentCard);
    }

    if (cards.length === 0) {
      return null;
    }

    // Construir interfaz organizada estilo Apple
    let html = `
      <div class="apple-statement-container">
        <div class="statement-hero-header">
          <div class="statement-icon-badge">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div class="statement-title-wrapper">
            <span class="statement-title">Estado de Cuenta</span>
            <span class="statement-subtitle">Historial de pagos y comprobantes</span>
          </div>
        </div>

        <div class="statement-cards-grid">
    `;

    for (const card of cards) {
      const isPaid = !card.estado || /pagado|al corriente/i.test(card.estado);
      html += `
        <div class="statement-card">
          <div class="statement-card-header">
            <span class="statement-month-pill">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${card.mes}
            </span>
            <span class="statement-status-pill ${isPaid ? 'paid' : 'pending'}">
              ${isPaid
          ? '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Pagado'
          : 'Pendiente'
        }
            </span>
          </div>

          <div class="statement-card-details">
            ${card.fecha ? `
              <div class="statement-detail-row">
                <span class="detail-label">Fecha:</span>
                <span class="detail-value">${card.fecha}</span>
              </div>
            ` : ''}
            ${card.monto ? `
              <div class="statement-detail-row">
                <span class="detail-label">Monto:</span>
                <span class="detail-value amount">${card.monto}</span>
              </div>
            ` : ''}
          </div>

          ${card.comprobanteUrl ? `
            <a href="${card.comprobanteUrl}" target="_blank" rel="noopener noreferrer" class="apple-receipt-btn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <span>Ver comprobante</span>
              <svg class="external-arrow" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </a>
          ` : ''}
        </div>
      `;
    }

    html += `</div>`;

    if (footerMessages.length > 0) {
      html += `<div class="statement-footer">`;
      for (const msg of footerMessages) {
        const isSuccess = /felicidades|corriente/i.test(msg);
        const isWarning = /total a pagar|realiza tu pago/i.test(msg);
        const alertClass = isSuccess ? 'success' : isWarning ? 'warning' : 'info';
        html += `<div class="statement-alert-box ${alertClass}">${msg}</div>`;
      }
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  private processWhatsAppFormatting(raw: string, query: string = ''): string {
    if (!raw) return '';

    // 0. Si el mensaje es un Estado de cuenta estructurado, renderizar como UI Apple
    const estadoCuentaHtml = this.renderEstadoDeCuentaApple(raw);
    if (estadoCuentaHtml) {
      if (query && query.trim().length > 0) {
        const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return estadoCuentaHtml.replace(new RegExp(`(?![^<]*>)(${cleanQ})`, 'gi'), '<mark class="highlight-search">$1</mark>');
      }
      return estadoCuentaHtml;
    }

    // 0.5 Eliminar cualquier línea horizontal divisoria (━━━━━━━━, ────────, _______ etc.)
    let text = raw.replace(/^[━─—\-_=\.]{3,}\s*$/gm, '');

    // 1. Escapar HTML
    text = text
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

    // 7. Reemplazar enlaces a comprobantes por el botón estilo Apple
    text = text.replace(
      /(?:🔗|📎)?\s*Comprobante:?\s*(https?:\/\/[^\s<]+)/gi,
      (_match, url) => {
        return `<div class="apple-receipt-btn-wrapper" style="margin: 6px 0;"><a href="${url}" target="_blank" rel="noopener noreferrer" class="apple-receipt-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg><span>Ver comprobante</span><svg class="external-arrow" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg></a></div>`;
      }
    );

    // 8. URLs generales restantes
    text = text.replace(
      /(https?:\/\/[^\s<]+)(?=\s|<|$)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>'
    );

    // 9. Resaltado de búsqueda si existe query
    if (query && query.trim().length > 0) {
      const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(`(?![^<]*>)(${cleanQ})`, 'gi'), '<mark class="highlight-search">$1</mark>');
    }

    return text;
  }

  private formatBulletLists(raw: string): string {
    try {
      if (!raw) return '';
      const lines = String(raw).split('\n');
      // Capturar símbolo y texto para conservar emojis/viñetas originales
      const bulletRx = /^\s*([•\-\u2022\u00b7✅☑️✔️▪️]|\*)\s+(.*)$/u;
      const bulletLines: { symbol: string; text: string }[] = [];
      const otherLines: string[] = [];
      for (const ln of lines) {
        const m = ln.match(bulletRx);
        if (m) bulletLines.push({ symbol: m[1], text: m[2] });
        else otherLines.push(ln);
      }
      // Caso compacto: si solo hay 1 viñeta y el resto está vacío → render inline sin <ul>
      const nonEmptyOthers = otherLines.filter((l) => l.trim().length > 0);
      if (bulletLines.length === 1 && nonEmptyOthers.length === 0) {
        const only = bulletLines[0];
        if (only.text.match(/¡?Bienvenid[oa],/i)) {
          return `<div><strong>${only.symbol} ${only.text}</strong></div>`;
        }
        return `<div>${only.symbol} ${only.text}</div>`;
      }
      // Construcción detallada con listas y saltos mínimos
      let html = '';
      let inList = false;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const m = line.match(bulletRx);
        if (m) {
          if (!inList) {
            if (html.endsWith('<br>')) html = html.replace(/(<br>)+$/, '');
            html += '<ul class="wa-list" style="margin:0; padding-left:4px; list-style: none; text-align: left;">';
            inList = true;
          }
          const symbol = m[1];
          let txt = m[2];
          // Sanitizar en caso de que el texto ya traiga otra viñeta al inicio
          txt = txt.replace(/^\s*([•\-\u2022\u00b7✅☑️✔️▪️]|\*)\s+/, '');
          let content = `${symbol} ${txt}`;
          if (content.includes('Bienvenid') && !content.includes('<strong>')) {
            content = content.replace(/(¡?Bienvenid[oa],.*)/i, '<strong>$1</strong>');
          }
          html += `<li style="margin:1px 0 1px -4px; list-style: none; text-align: left;">${content}</li>`;
        } else {
          if (inList) {
            html += '</ul>';
            inList = false;
          }
          const trimmed = line.trim();
          if (trimmed.length > 0) {
            if (
              trimmed.startsWith('<pre') ||
              trimmed.startsWith('<div') ||
              trimmed.startsWith('</div>') ||
              trimmed.startsWith('</pre>') ||
              trimmed.startsWith('<ul') ||
              trimmed.startsWith('</ul>')
            ) {
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
    } catch {
      return String(raw).split('\n').join('<br>');
    }
  }
}
