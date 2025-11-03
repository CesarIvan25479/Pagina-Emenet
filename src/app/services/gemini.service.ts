import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface ConocimientoItem {
  pregunta: string;
  respuesta: string;
  timestamp: number;
  fuente: 'gemini' | 'manual';
  sessionId?: string;
}

interface MensajeContexto {
  remitente: 'usuario' | 'bot';
  texto: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private readonly STORAGE_KEY = 'emenet_conocimiento_bot';
  private conocimiento: ConocimientoItem[] = [];
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(private http: HttpClient) {
    this.cargarConocimiento();
  }

  /**
   * Cargar conocimiento desde localStorage
   */
  private cargarConocimiento(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.conocimiento = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error al cargar conocimiento:', error);
      this.conocimiento = [];
    }
  }

  /**
   * Guardar conocimiento en localStorage
   */
  private guardarConocimiento(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.conocimiento));
    } catch (error) {
      console.error('Error al guardar conocimiento:', error);
    }
  }

  /**
   * Normalizar texto para comparación
   */
  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Buscar en caché de conocimiento (sin considerar sessionId para compartir conocimiento)
   */
  buscarEnCache(pregunta: string): string | null {
    const preguntaNormalizada = this.normalizarTexto(pregunta);
    
    // Buscar coincidencia exacta o muy similar
    for (const item of this.conocimiento) {
      const itemNormalizado = this.normalizarTexto(item.pregunta);
      
      // Coincidencia exacta
      if (itemNormalizado === preguntaNormalizada) {
        return item.respuesta;
      }
      
      // Coincidencia por similitud (al menos 80% de palabras coinciden)
      const palabrasPregunta = preguntaNormalizada.split(' ');
      const palabrasItem = itemNormalizado.split(' ');
      const coincidencias = palabrasPregunta.filter(p => palabrasItem.includes(p)).length;
      const similitud = coincidencias / Math.max(palabrasPregunta.length, palabrasItem.length);
      
      if (similitud >= 0.8) {
        return item.respuesta;
      }
    }
    
    return null;
  }

  /**
   * Agregar al caché de conocimiento
   */
  agregarAlCache(pregunta: string, respuesta: string, fuente: 'gemini' | 'manual' = 'gemini', sessionId?: string): void {
    const item: ConocimientoItem = {
      pregunta: pregunta.trim(),
      respuesta: respuesta.trim(),
      timestamp: Date.now(),
      fuente,
      sessionId
    };
    
    this.conocimiento.push(item);
    
    // Limitar a 500 entradas para no saturar localStorage
    if (this.conocimiento.length > 500) {
      this.conocimiento = this.conocimiento.slice(-500);
    }
    
    this.guardarConocimiento();
  }

  /**
   * Obtener respuesta de Gemini API con contexto de conversación
   */
  obtenerRespuestaGemini(
    pregunta: string, 
    historialMensajes?: MensajeContexto[], 
    sessionId?: string
  ): Observable<string> {
    // Primero buscar en caché (solo si no hay contexto conversacional)
    if (!historialMensajes || historialMensajes.length === 0) {
      const respuestaCache = this.buscarEnCache(pregunta);
      if (respuestaCache) {
        return of(respuestaCache);
      }
    }

    // Si no está en caché, llamar a Gemini API
    const model = environment.geminiModel || 'gemini-2.0-flash';
    const url = `${this.GEMINI_API_URL}/${model}:generateContent?key=${environment.geminiApiKey}`;

    const prompt = this.construirPromptConHistorial(pregunta, historialMensajes);

    const body = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800,
      }
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(url, body, { headers }).pipe(
      map(response => {
        if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
          const respuesta = response.candidates[0].content.parts[0].text.trim();
          
          // Guardar en caché solo si no hay contexto conversacional (preguntas generales)
          if (!historialMensajes || historialMensajes.length === 0) {
            this.agregarAlCache(pregunta, respuesta, 'gemini', sessionId);
          }
          
          return respuesta;
        }
        throw new Error('Respuesta inválida de Gemini API');
      }),
      catchError(error => {
        console.error('Error al llamar a Gemini API:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Construir prompt para Gemini con historial de conversación
   */
  private construirPromptConHistorial(pregunta: string, historialMensajes?: MensajeContexto[]): string {
    let historialTexto = '';
    
    if (historialMensajes && historialMensajes.length > 0) {
      historialTexto = '\n\nHistorial de la conversación (últimos mensajes):\n';
      historialMensajes.forEach((msg, index) => {
        const remitente = msg.remitente === 'usuario' ? 'Cliente' : 'Asistente';
        // Limpiar HTML del texto
        const textoLimpio = msg.texto.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        historialTexto += `${index + 1}. ${remitente}: ${textoLimpio}\n`;
      });
    }

    const contextoBusiness = `
Eres un asistente virtual de Emenet, una empresa de telecomunicaciones que ofrece servicios de internet de fibra óptica.

Información clave sobre Emenet:
- Ofrecemos 4 planes residenciales: 
  * Plan 100 Mbps: $300/mes (ideal para 1-2 personas, hasta 5 dispositivos)
  * Plan 200 Mbps: $400/mes (ideal para 3-4 personas, hasta 10 dispositivos)
  * Plan 300 Mbps: $500/mes (ideal para 4-6 personas, hasta 15 dispositivos)
  * Plan 500 Mbps: $600/mes (ideal para 7+ personas, hasta 20 dispositivos)
- También ofrecemos planes empresariales personalizados
- Tecnología: Fibra óptica 100% (velocidad simétrica)
- Cobertura: Santiago Tianguistenco, Almoloya del Río, Capulhuac, Xalatlaco y zonas aledañas
- Horario de atención: Lun-Vie 9:00-18:00, Sáb 9:00-15:00
- Teléfonos: 713 133 4557 Ext 1 (Ventas), Ext 2 (Soporte), 800 204 99 00
- Chat Bot: Disponible 24/7
- Correo: clientes@emenet.mx
- Sitio web: www.emenet.mx

Proceso de contratación:
1. Verificar cobertura en la zona del cliente
2. Recomendar plan según necesidades (número de personas, uso, dispositivos)
3. Explicar beneficios del plan seleccionado
4. Solicitar datos: nombre completo, dirección exacta, teléfono, correo
5. Confirmar instalación (generalmente en 24-48 horas)
6. Ofrecer métodos de pago: efectivo, transferencia, tarjeta

Instrucciones:
1. Responde de manera amigable, conversacional y profesional
2. Usa emojis moderadamente para hacer la conversación más cálida
3. Si el cliente está en proceso de contratación, ayúdalo a completar todos los pasos
4. Mantén respuestas concisas (máximo 3-4 párrafos)
5. Si no sabes algo específico, ofrece contactar con un agente humano
6. IMPORTANTE: Lee el historial de conversación para mantener contexto y coherencia
7. Si el cliente ya mencionó información (nombre, zona, etc.), no la vuelvas a pedir
${historialTexto}

Pregunta actual del cliente: ${pregunta}

Responde como el asistente virtual de Emenet, manteniendo coherencia con el historial:`;

    return contextoBusiness;
  }

  /**
   * Exportar conocimiento (para respaldo)
   */
  exportarConocimiento(): string {
    return JSON.stringify(this.conocimiento, null, 2);
  }

  /**
   * Importar conocimiento (desde respaldo)
   */
  importarConocimiento(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        this.conocimiento = parsed;
        this.guardarConocimiento();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al importar conocimiento:', error);
      return false;
    }
  }

  /**
   * Limpiar caché de conocimiento
   */
  limpiarCache(): void {
    this.conocimiento = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Obtener estadísticas del conocimiento
   */
  obtenerEstadisticas(): { total: number; gemini: number; manual: number } {
    return {
      total: this.conocimiento.length,
      gemini: this.conocimiento.filter(i => i.fuente === 'gemini').length,
      manual: this.conocimiento.filter(i => i.fuente === 'manual').length
    };
  }
}
