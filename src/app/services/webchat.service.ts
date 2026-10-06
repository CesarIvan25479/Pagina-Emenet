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
  }>;
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
   * Inicializa la sesión de chat: recupera el historial o genera el menú inicial del bot
   * sin simular un mensaje 'hola' del usuario.
   */
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
              mediaUrl: m.mediaUrl || undefined,
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
      mediaUrl: r.mediaUrl || undefined,
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

  /** Genera un UUID v4 simple sin dependencias externas */
  private generarUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
