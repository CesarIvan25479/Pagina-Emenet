import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

/** Representación de un mensaje en el chat */
export interface WebchatMessage {
  id: number | string;
  texto: string;
  tipo: 'sent' | 'received';
  timestamp: Date;
  isRead: boolean;
  status: 'sent' | 'delivered' | 'read';
  botones?: WebchatBoton[];
  mediaUrl?: string | null;
  mediaType?: 'image' | 'audio' | 'video' | 'document' | string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

/** Botón / quick reply retornado por el bot */
export interface WebchatBoton {
  id: string;
  label: string;
}

/** Respuesta normalizada del backend */
interface BackendRespuesta {
  texto: string;
  botones: WebchatBoton[];
  mediaUrl: string | null;
}

interface WebchatApiResponse {
  success: boolean;
  respuestas: BackendRespuesta[];
  isHistory?: boolean;
  historial?: Array<{
    id: number | string;
    texto: string;
    tipo: 'sent' | 'received';
    timestamp: string | Date;
    isRead: boolean;
    status: 'sent' | 'delivered' | 'read';
    botones?: WebchatBoton[];
    mediaUrl?: string | null;
    mediaType?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }>;
  file?: {
    fileUrl: string;
    fileName: string;
    mediaType: string;
    size: number;
    mimeType: string;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebchatService {
  /** URL base de neurexa-back. Apunta al endpoint /api/webchat */
  private readonly baseUrl: string;

  /** Identificador de sesión único para este visitante */
  private sessionId: string;

  constructor(private http: HttpClient) {
    const apiBase = this.resolverApiBase();
    this.baseUrl = `${apiBase}/webchat`;
    this.sessionId = this.obtenerOCrearSessionId();
  }

  /** Retorna el sessionId actual del visitante */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Resuelve una URL de media relativa a URL absoluta del backend
   */
  resolverMediaUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    const apiBase = this.resolverApiBase();
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  /**
   * Inicializa la sesión de chat: recupera el historial o genera el menú inicial del bot*/
  inicializarChat(nombreVisitante?: string): Observable<WebchatMessage[]> {
    return this.http
      .post<WebchatApiResponse>(`${this.baseUrl}/init`, {
        sessionId: this.sessionId,
        name: nombreVisitante || undefined,
      })
      .pipe(
        map((res) => {
          if (res.isHistory && Array.isArray(res.historial) && res.historial.length > 0) {
            return res.historial.map((m) => ({
              id: m.id,
              texto: m.texto || '',
              tipo: m.tipo || 'received',
              timestamp: new Date(m.timestamp),
              isRead: true,
              status: 'read' as const,
              botones: Array.isArray(m.botones) && m.botones.length > 0 ? m.botones : undefined,
              mediaUrl: this.resolverMediaUrl(m.mediaUrl),
              mediaType: m.mediaType,
              fileName: m.fileName,
              fileSize: m.fileSize,
              mimeType: m.mimeType,
            }));
          }
          return this.mapearRespuesta(res);
        }),
        catchError((err) => this.manejarError(err))
      );
  }

  /**
   * Envía un mensaje de texto al bot y retorna los mensajes de respuesta.
   */
  enviarMensaje(mensaje: string, nombreVisitante?: string): Observable<WebchatMessage[]> {
    return this.http
      .post<WebchatApiResponse>(`${this.baseUrl}/message`, {
        sessionId: this.sessionId,
        message: mensaje,
        name: nombreVisitante || undefined,
      })
      .pipe(
        map((res) => this.mapearRespuesta(res)),
        catchError((err) => this.manejarError(err))
      );
  }

  /**
   * Envía un archivo adjunto (imagen, audio, documento, video) al bot.
   */
  enviarArchivo(file: File | Blob, fileName?: string, caption?: string, nombreVisitante?: string): Observable<WebchatMessage[]> {
    const formData = new FormData();
    const resolvedName = fileName || (file instanceof File ? file.name : `audio_${Date.now()}.webm`);
    formData.append('file', file, resolvedName);
    formData.append('sessionId', this.sessionId);
    if (caption) formData.append('caption', caption);
    if (nombreVisitante) formData.append('name', nombreVisitante);

    return this.http
      .post<WebchatApiResponse>(`${this.baseUrl}/upload`, formData)
      .pipe(
        map((res) => this.mapearRespuesta(res)),
        catchError((err) => this.manejarError(err))
      );
  }

  /**
   * Envía un clic de botón (quick reply) al bot.
   */
  enviarBoton(buttonId: string, buttonLabel: string): Observable<WebchatMessage[]> {
    return this.http
      .post<WebchatApiResponse>(`${this.baseUrl}/button`, {
        sessionId: this.sessionId,
        buttonId,
        buttonLabel,
      })
      .pipe(
        map((res) => this.mapearRespuesta(res)),
        catchError((err) => this.manejarError(err))
      );
  }

  /**
   * Consulta mensajes nuevos recibidos posteriores a la fecha o timestamp indicado
   */
  obtenerActualizaciones(afterDate?: Date | string | number): Observable<WebchatMessage[]> {
    let params: any = {};
    if (afterDate) {
      const d = afterDate instanceof Date ? afterDate.toISOString() : new Date(afterDate).toISOString();
      params.after = d;
    }

    return this.http
      .get<{ success: boolean; messages: any[] }>(`${this.baseUrl}/updates/${this.sessionId}`, {
        params,
      })
      .pipe(
        map((res) => {
          if (!res?.success || !Array.isArray(res.messages)) {
            return [];
          }
          return res.messages.map((m) => ({
            id: m.id,
            texto: m.texto || '',
            tipo: m.tipo || 'received',
            timestamp: new Date(m.timestamp),
            isRead: true,
            status: 'read' as const,
            botones: Array.isArray(m.botones) && m.botones.length > 0 ? m.botones : undefined,
            mediaUrl: this.resolverMediaUrl(m.mediaUrl),
            mediaType: m.mediaType,
            fileName: m.fileName,
            fileSize: m.fileSize,
            mimeType: m.mimeType,
          }));
        }),
        catchError(() => of([]))
      );
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  /** Convierte la respuesta del backend a un array de WebchatMessage */
  private mapearRespuesta(res: WebchatApiResponse): WebchatMessage[] {
    if (!res?.success || !Array.isArray(res.respuestas)) {
      return [this.mensajeFallback()];
    }

    return res.respuestas.map((r, i) => ({
      id: Date.now() + i,
      texto: r.texto || '',
      tipo: 'received' as const,
      timestamp: new Date(),
      isRead: true,
      status: 'read' as const,
      botones: Array.isArray(r.botones) && r.botones.length > 0 ? r.botones : undefined,
      mediaUrl: this.resolverMediaUrl(r.mediaUrl),
    }));
  }

  private mensajeFallback(): WebchatMessage {
    return {
      id: Date.now(),
      texto: 'Lo siento, no pude procesar tu mensaje. Por favor, intenta de nuevo. 🙏',
      tipo: 'received',
      timestamp: new Date(),
      isRead: true,
      status: 'read',
    };
  }

  private manejarError(err: HttpErrorResponse): Observable<WebchatMessage[]> {
    console.error('[WebchatService] Error al comunicarse con el backend:', err?.message || err);
    return of([this.mensajeFallback()]);
  }

  /** Resuelve la URL base del API de neurexa-back */
  private resolverApiBase(): string {
    if (environment.neurexaApiUrl) {
      return environment.neurexaApiUrl;
    }
    const proto = typeof window !== 'undefined' ? (window?.location?.protocol || 'http:') : 'http:';
    const hostname = typeof window !== 'undefined' ? (window?.location?.hostname || 'localhost') : 'localhost';
    return `${proto}//${hostname}:3001/api`;
  }

  /** Obtiene el sessionId de localStorage o genera uno nuevo */
  private obtenerOCrearSessionId(): string {
    try {
      const stored = localStorage.getItem('emenet_webchat_session');
      if (stored) return stored;

      const newId = this.generarUUID();
      localStorage.setItem('emenet_webchat_session', newId);
      return newId;
    } catch {
      return this.generarUUID();
    }
  }

  /** Genera un UUID v4 */
  private generarUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
