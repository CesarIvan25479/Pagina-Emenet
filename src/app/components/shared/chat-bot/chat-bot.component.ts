import { Component, Inject, PLATFORM_ID, OnInit, ViewChild, ElementRef, AfterViewChecked } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { SidebarModule } from "primeng/sidebar";
import { InputTextModule } from "primeng/inputtext";
import { TooltipModule } from "primeng/tooltip";
import { Router } from "@angular/router";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { GeminiService } from "../../../services/gemini.service";
import { AnimatedChatIconComponent } from "../animated-chat-icon/animated-chat-icon.component";

interface Mensaje {
  id: number;
  texto: string;
  remitente: "usuario" | "bot";
  timestamp: Date;
  esBienvenida?: boolean;
  esCaracteristicas?: boolean;
  esPreguntasSugeridas?: boolean;
  esMenuPlanes?: boolean;
  esDetallePlan?: boolean;
  esBotonAccion?: boolean;
  esHorarios?: boolean;
  caracteristicas?: string[];
  preguntasSugeridas?: string[];
  planesMenu?: any[];
  planDetalle?: any;
  accion?: string;
  textoBoton?: string;
  esError?: boolean;
  esEscribiendo?: boolean;
}

interface Idioma {
  bienvenida: string;
  placeholder: string;
  reiniciar: string;
  cerrar: string;
  enviar: string;
  enLinea: string;
  preguntasSugeridas: string[];
  caracteristicas: string[];
}

@Component({
  selector: "app-chat-bot",
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    InputTextModule, 
    TooltipModule,
    HttpClientModule,
    SidebarModule,
    AnimatedChatIconComponent
  ],
  templateUrl: "./chat-bot.component.html",
  styleUrl: "./chat-bot.component.scss",
})
export class ChatBotComponent implements OnInit, AfterViewChecked {
  @ViewChild("mensajesContainer") private mensajesContainer!: ElementRef;

  chatAbierto: boolean = false;
  mostrarIconosSociales: boolean = false;
  valorEntrada: string = "";
  tieneNotificacionNueva: boolean = false;
  private debeDesplazar: boolean = false;
  botEscribiendo: boolean = false;

  mensajes: Mensaje[] = [];
  // Estado de conversación: el bot está esperando que el usuario indique su zona
  private esperandoZonaCobertura: boolean = false;
  // Estado de conversación: el bot espera el número de usuarios en el hogar
  private esperandoNumeroUsuarios: boolean = false;
  // Session ID único para cada instancia del chat (evita mezcla entre usuarios)
  private sessionId: string = '';

  idiomas: { [key: string]: Idioma } = {
    es: {
      bienvenida: "¡Hola! Soy tu asistente de emenet. ¿Cómo puedo ayudarte con nuestros servicios de internet hoy?",
      placeholder: "Escribe tu mensaje...",
      reiniciar: "Reiniciar conversación",
      cerrar: "Cerrar chat",
      enviar: "Enviar mensaje",
      enLinea: "En línea",
      preguntasSugeridas: [
        "¿Qué planes de internet ofrecen?",
        "¿Cuál es el área de cobertura?",
        "¿Cuáles son los horarios de atención?",
        "¿Cómo puedo contratar el servicio?",
        "Más información ❓",
      ],
      caracteristicas: [
        "Internet de alta velocidad",
        "Cobertura en toda la región",
        "Soporte técnico especializado",
        "Planes flexibles y accesibles",
        "Instalación rápida y profesional",
      ],
    },
  };

  idiomaActual: string = "es";

  planesDisponibles: any[] = [
    {
      nombre: "Plan 100 Megas",
      precio: 300,
      velocidad: "100 Mbps",
      dispositivos: 10,
      descripcion: "Ideal para navegación básica y redes sociales",
      color: "azul",
    },
    {
      nombre: "Plan 200 Megas",
      precio: 400,
      velocidad: "200 Mbps",
      dispositivos: 15,
      descripcion: "Perfecto para streaming en HD y videollamadas",
      color: "verde",
    },
    {
      nombre: "Plan 300 Megas",
      precio: 500,
      velocidad: "300 Mbps",
      dispositivos: 20,
      descripcion: "Experiencia premium para streaming 4K y gaming",
      color: "naranja",
    },
    {
      nombre: "Plan 500 Megas",
      precio: 600,
      velocidad: "500 Mbps",
      dispositivos: 30,
      descripcion: "Máxima velocidad para usuarios exigentes",
      color: "rosa",
    },
  ];

  // Zonas de cobertura cargadas dinámicamente desde assets/zonasCompletas.json
  zonasCobertura: string[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private http: HttpClient,
    private geminiService: GeminiService
  ) {}

  ngOnInit(): void {
    this.generarSessionId();
    this.inicializarMensajes();
    this.cargarZonasCobertura();
  }

  /**
   * Generar un session ID único para esta instancia del chat
   */
  private generarSessionId(): void {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  ngAfterViewChecked(): void {
    if (this.debeDesplazar) {
      this.desplazarAlFinal();
      this.debeDesplazar = false;
    }
  }

  get t(): Idioma {
    return this.idiomas[this.idiomaActual];
  }

  inicializarMensajes(): void {
    // Iniciar la conversación vacía; los mensajes se programan al abrir el chat
    this.mensajes = [];
  }

  alternarIconosSociales(): void {
    if (!this.chatAbierto) {
      this.mostrarIconosSociales = !this.mostrarIconosSociales;
    } else {
      this.alternarChat(false);
    }
  }

  alternarChat(forzarAbrir?: boolean): void {
    if (forzarAbrir || !this.chatAbierto) {
      this.mostrarIconosSociales = false;
      this.chatAbierto = true;
      this.tieneNotificacionNueva = false;
      this.debeDesplazar = true;
      // Programar mensajes de bienvenida y preguntas sugeridas con retrasos
      this.programarMensajesInicio();
    } else {
      this.chatAbierto = false;
      setTimeout(() => {
        this.mostrarIconosSociales = true;
      }, 300);
    }
  }

  private async programarMensajesInicio(): Promise<void> {
    // Evitar duplicados si ya se mostraron
    if (this.mensajes.some((m) => m.esBienvenida) || this.botEscribiendo) {
      return;
    }

    // Obtener saludo dinámico
    const hora = new Date().getHours();
    let saludo = "";
    if (hora >= 6 && hora < 12) {
      saludo = "¡Buenos días! ☀️";
    } else if (hora >= 12 && hora < 19) {
      saludo = "¡Buenas tardes! 🌤️";
    } else {
      saludo = "¡Buenas noches! 🌙";
    }

    // Simular escribiendo y mostrar bienvenida a los 3s
    this.botEscribiendo = true;
    this.debeDesplazar = true;
    await this.esperar(3000);
    this.mensajes.push({
      id: Date.now(),
      texto: `<div class="mensaje-titulo">${saludo} Soy tu asistente virtual de <strong>emenet</strong></div><p>¿En qué puedo ayudarte hoy?</p>`,
      remitente: "bot",
      timestamp: new Date(),
      esBienvenida: true,
    });
    this.debeDesplazar = true;

    // Mantener escribiendo y mostrar preguntas sugeridas 3s después
    await this.esperar(3000);
    this.mensajes.push({
      id: Date.now() + 1,
      texto: "Preguntas sugeridas:",
      remitente: "bot",
      timestamp: new Date(),
      esPreguntasSugeridas: true,
      preguntasSugeridas: this.t.preguntasSugeridas,
    });
    this.debeDesplazar = true;
    this.botEscribiendo = false;
  }

  manejarClickSocial(plataforma: string): void {
    // Cerrar el menú de iconos sociales
    this.mostrarIconosSociales = false;
    
    if (plataforma === 'chat') {
      this.alternarChat(true);
      return;
    }

    const urls: { [key: string]: string } = {
      facebook: 'https://www.facebook.com/people/emenet-Comunicaciones/pfbid02CsMQF3Gvpn27hDi9FrzMSRpWJwhyxCvU4ijBwxgH4K9yurLMuBzjRQoEX5DCqvv4l/',
      whatsapp: 'https://api.whatsapp.com/send?phone=5217131334557&text=Hola%20buen%20d%C3%ADa%2C%20necesito%20informaci%C3%B3n',
      instagram: 'https://www.instagram.com/mnetandador/?igsh=a2NybTRjYmNxcG01'
    };

    if (isPlatformBrowser(this.platformId) && urls[plataforma]) {
      // Agregar un pequeño retraso para permitir que la animación de cierre se complete
      setTimeout(() => {
        window.open(urls[plataforma], '_blank');
      }, 300);
    }
  }

  obtenerRespuestaBot(mensajeUsuario: string): Mensaje | null {
    const mensaje = mensajeUsuario.toLowerCase().trim();

    // Si estamos esperando la cantidad de personas/usuarios en el hogar
    if (this.esperandoNumeroUsuarios) {
      const match = mensajeUsuario.match(/(\d{1,2})/);
      if (match) {
        const personas = parseInt(match[1], 10);
        this.esperandoNumeroUsuarios = false;

        // Reglas simples de recomendación según cantidad
        let recomendado = this.planesDisponibles.find((p) => p.nombre.includes("300")); // default
        if (personas <= 3) {
          recomendado = this.planesDisponibles.find((p) => p.nombre.includes("200")) || recomendado;
        } else if (personas >= 7) {
          recomendado = this.planesDisponibles.find((p) => p.nombre.includes("500")) || recomendado;
        }

        const textoIntro = personas <= 3
          ? "Para un hogar de hasta 3 personas, esta opción te dará una experiencia fluida."
          : personas >= 7
          ? "Para hogares grandes con muchos dispositivos, esta es la mejor opción."
          : "Para 4 a 6 personas, este plan da excelente equilibrio entre velocidad y dispositivos.";

        return {
          id: Date.now(),
          texto: `<div class='mensaje-titulo'>✅ Recomendación para ${personas} ${personas === 1 ? 'persona' : 'personas'}</div>
                  <p>${textoIntro}</p>
                  <p><strong>${recomendado?.nombre}</strong> - <strong>$${recomendado?.precio}/mes</strong></p>
                  <ul>
                    <li>⚡ Velocidad: ${recomendado?.velocidad} simétricos</li>
                    <li>👥 Dispositivos: hasta ${recomendado?.dispositivos}</li>
                    <li>🛡️ Soporte especializado</li>
                  </ul>
                  <p>¿Quieres ver los detalles y contratar? Puedo ayudarte con todo el proceso. 😊</p>`,
          remitente: "bot",
          timestamp: new Date(),
          esMenuPlanes: true,
          planesMenu: recomendado ? [recomendado] : this.planesDisponibles,
        };
      }

      // No detecté número válido - dar una segunda oportunidad
      return {
        id: Date.now(),
        texto: "<p>Para recomendarte el plan ideal, dime un número aproximado de personas en casa. Por ejemplo: <strong>3</strong>, <strong>5</strong> o <strong>8</strong>. 😊</p>",
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    // Si previamente pedimos la zona de cobertura, interpretar este mensaje como zona
    if (this.esperandoZonaCobertura) {
      const zonaDetectada = this.detectarZonaEnMensaje(mensajeUsuario);
      if (zonaDetectada) {
        this.esperandoZonaCobertura = false;
        const respuestasPositivas = [
          `¡Claro que sí! 😊 Tenemos cobertura en ${zonaDetectada}. Nuestro servicio de fibra óptica llega perfectamente a tu zona.`,
          `¡Excelente noticia! 🎉 Sí contamos con cobertura en ${zonaDetectada}. Podemos llevarte internet de alta velocidad sin problema.`,
          `¡Por supuesto! ✅ ${zonaDetectada} está dentro de nuestra área de cobertura. Tenemos varios clientes satisfechos por ahí.`,
          `¡Sí! 🌟 Tenemos cobertura completa en ${zonaDetectada}. Podemos instalarte el servicio cuando gustes.`
        ];
        const respuestaAleatoria = respuestasPositivas[Math.floor(Math.random() * respuestasPositivas.length)];
        return {
          id: Date.now(),
          texto: `<p>${respuestaAleatoria}</p><p>Ahora, cuéntame, ¿qué tipo de uso le darías al internet? Esto me ayudará a recomendarte el plan perfecto para ti 😊</p><ul class='opciones-uso'><li>📱 Navegación y redes sociales</li><li>🎬 Streaming de películas y series</li><li>🎮 Gaming online</li><li>💼 Trabajo remoto y videollamadas</li><li>🏠 Uso familiar (varios dispositivos)</li></ul>`,
          remitente: "bot",
          timestamp: new Date(),
        };
      }
      // Si no identificamos la zona, volver a pedirla con una pista
      return {
        id: Date.now(),
        texto: "<p>Gracias. Solo para confirmar, ¿podrías decirme tu <strong>municipio/colonia</strong>? Por ejemplo: <em>Almoloya del Río</em>, <em>Capulhuac</em> o <em>Xalatlaco</em>. 😊</p>",
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    // Saludos
    if (/(hola|hi|hello|buenas|saludos)/i.test(mensaje)) {
      return {
        id: Date.now(),
        texto: "¡Hola! 👋 Gracias por contactar a emenet. Estoy aquí para ayudarte con cualquier consulta sobre nuestros servicios de internet de fibra óptica.",
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    // Planes - Mostrar menú interactivo
    if (/(plan|planes|precio|precios|costo|cuanto|paquete|paquetes)/i.test(mensaje)) {
      return {
        id: Date.now(),
        texto: "<div class='mensaje-titulo'>📊 Nuestros Planes de Internet Fibra Óptica</div><p>Selecciona el plan que más te interese para ver todos sus detalles:</p>",
        remitente: "bot",
        timestamp: new Date(),
        esMenuPlanes: true,
        planesMenu: this.planesDisponibles,
      };
    }

    // Cobertura - Detectar zona específica
    if (/(cobertura|señal|servicio|llega|tienen|hay)\s*(en|a)?\s*(la|el|mi)?\s*(zona|área|region|lugar|colonia|municipio)?/i.test(mensaje)) {
      // Buscar si mencionan alguna zona específica
      const zonaDetectada = this.detectarZonaEnMensaje(mensaje);
      
      if (zonaDetectada) {
        // Respuesta conversacional confirmando cobertura
        const respuestasPositivas = [
          `¡Claro que sí! 😊 Tenemos cobertura en ${zonaDetectada}. Nuestro servicio de fibra óptica llega perfectamente a tu zona.`,
          `¡Excelente noticia! 🎉 Sí contamos con cobertura en ${zonaDetectada}. Podemos llevarte internet de alta velocidad sin problema.`,
          `¡Por supuesto! ✅ ${zonaDetectada} está dentro de nuestra área de cobertura. Tenemos varios clientes satisfechos por ahí.`,
          `¡Sí! 🌟 Tenemos cobertura completa en ${zonaDetectada}. Podemos instalarte el servicio cuando gustes.`
        ];
        
        const respuestaAleatoria = respuestasPositivas[Math.floor(Math.random() * respuestasPositivas.length)];
        
        return {
          id: Date.now(),
          texto: `<p>${respuestaAleatoria}</p><p>Ahora, cuéntame, ¿qué tipo de uso le darías al internet? Esto me ayudará a recomendarte el plan perfecto para ti 😊</p><ul class='opciones-uso'><li>📱 Navegación y redes sociales</li><li>🎬 Streaming de películas y series</li><li>🎮 Gaming online</li><li>💼 Trabajo remoto y videollamadas</li><li>🏠 Uso familiar (varios dispositivos)</li></ul>`,
          remitente: "bot",
          timestamp: new Date(),
        };
      }
      
      // Si no detecta zona específica, pregunta por ella
      this.esperandoZonaCobertura = true;
      return {
        id: Date.now(),
        texto: "<p>¡Con gusto te ayudo a verificar la cobertura! 😊</p><p>Dime, ¿en qué zona te encuentras? Puedes decirme tu municipio, colonia o localidad.</p><p><strong>Algunas de nuestras zonas de cobertura:</strong></p><ul><li>Santiago Tianguistenco</li><li>Almoloya del Río</li><li>San Mateo Texcalyacac</li><li>Santa Cruz Atizapán</li><li>Capulhuac</li><li>Xalatlaco</li><li>Y más zonas...</li></ul>",
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    // Recomendación de planes según uso
    if (/(navegación|navegar|redes sociales|facebook|instagram|whatsapp|básico|basico)/i.test(mensaje)) {
      return {
        id: Date.now(),
        texto: "<p>¡Perfecto! 😊 Para navegación y redes sociales, te recomiendo nuestro <strong>Plan 100 Megas</strong>. Es ideal para lo que necesitas y tiene un excelente precio.</p><p><strong>Plan 100 Megas - $300/mes</strong></p><ul><li>⚡ 100 Mbps de velocidad</li><li>📱 Hasta 10 dispositivos conectados</li><li>✅ Perfecto para navegar, redes sociales y videollamadas</li></ul><p>¿Te gustaría ver más detalles de este plan o prefieres que te muestre otras opciones? 🤔</p>",
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    if (/(streaming|netflix|películas|series|youtube|video|hd)/i.test(mensaje)) {
      return {
        id: Date.now(),
        texto: "<p>¡Excelente! 🎬 Para disfrutar streaming sin interrupciones, te recomiendo el <strong>Plan 200 Megas</strong>. Con este plan podrás ver tus series y películas favoritas en HD sin buffering.</p><p><strong>Plan 200 Megas - $400/mes</strong></p><ul><li>⚡ 200 Mbps de velocidad</li><li>📱 Hasta 15 dispositivos</li><li>🎥 Streaming en HD sin cortes</li><li>💼 Ideal también para videollamadas de trabajo</li></ul><p>¿Quieres conocer todos los detalles de este plan? 😊</p>",
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    if (/(gaming|juegos|jugar|gamer|videojuegos|4k|ultra)/i.test(mensaje)) {
      return {
        id: Date.now(),
        texto: "<p>¡Un gamer! 🎮 Para ti tengo dos opciones increíbles:</p><p><strong>Plan 300 Megas - $500/mes</strong></p><ul><li>⚡ 300 Mbps de velocidad</li><li>🎮 Baja latencia para gaming competitivo</li><li>📺 Streaming 4K sin problemas</li><li>📱 Hasta 20 dispositivos</li></ul><p><strong>Plan 500 Megas - $600/mes</strong></p><ul><li>⚡ 500 Mbps - Máxima velocidad</li><li>🚀 La mejor experiencia gaming</li><li>👨‍👩‍👧‍👦 Perfecto para familias numerosas</li><li>📱 Hasta 30 dispositivos</li></ul><p>¿Cuál te llama más la atención? Puedo darte más detalles de cualquiera 😊</p>",
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    if (/(trabajo|home office|oficina|videollamadas|zoom|teams|meet|remoto)/i.test(mensaje)) {
      return {
        id: Date.now(),
        texto: "<p>¡Perfecto para home office! 💼 Te recomiendo el <strong>Plan 200 Megas</strong>, que es el favorito de nuestros clientes que trabajan desde casa.</p><p><strong>Plan 200 Megas - $400/mes</strong></p><ul><li>⚡ 200 Mbps de velocidad simétrica</li><li>📹 Videollamadas en HD sin cortes</li><li>☁️ Subida rápida de archivos pesados</li><li>📱 Hasta 15 dispositivos conectados</li><li>✅ Conexión estable todo el día</li></ul><p>Si necesitas más velocidad porque trabajas con archivos muy pesados o tienes muchas videollamadas simultáneas, también tenemos el Plan 300 Megas. ¿Te gustaría verlo? 😊</p>",
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    if (/(familiar|familia|varios|muchos dispositivos|casa|hogar|todos)/i.test(mensaje)) {
      this.esperandoNumeroUsuarios = true;
      return {
        id: Date.now(),
        texto: "<p>¡Entiendo! 🏠 Para uso familiar donde varios miembros usan internet al mismo tiempo, te recomiendo:</p><p><strong>Plan 300 Megas - $500/mes</strong> (Más popular)</p><ul><li>⚡ 300 Mbps de velocidad</li><li>👨‍👩‍👧‍👦 Hasta 20 dispositivos conectados</li><li>📺 Varios streaming 4K simultáneos</li><li>🎮 Gaming + trabajo + entretenimiento al mismo tiempo</li></ul><p>Si son una familia grande o usan mucho internet, también está el <strong>Plan 500 Megas - $600/mes</strong> con hasta 30 dispositivos.</p><p>¿Cuántas personas aproximadamente usarían el internet en tu hogar? Así te puedo recomendar mejor 😊</p>",
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    // Contratación
    if (/(contratar|contratación|instalar|instalación|nuevo servicio|quiero|solicitar)/i.test(mensaje)) {
      return {
        id: Date.now(),
        texto: "<div class='mensaje-titulo'>🎉 ¡Excelente decisión!</div><p>Para contratar tu servicio de internet emenet puedes:</p><div class='opciones-contratacion'><div class='opcion'><strong>📱 Opción 1: Formulario en línea</strong> (Recomendado)<br>Llena el formulario y nos contactamos contigo</div><div class='opcion'><strong>📞 Opción 2: Llamada directa</strong><br>713 133 4557 Ext 1 | 800 204 99 00</div><div class='opcion'><strong>💬 Opción 3: WhatsApp</strong><br>Envíanos un mensaje directo</div><div class='opcion'><strong>🏢 Opción 4: Visita presencial</strong><br>Horario: Lun-Vie 9:00-18:00, Sáb 9:00-15:00</div></div><div class='proceso-contratacion'><p><strong>Proceso de contratación:</strong></p><ol><li>Verificamos cobertura en tu zona</li><li>Eliges tu plan ideal</li><li>Agendamos instalación</li><li>¡Listo! Internet de alta velocidad en tu hogar</li></ol></div><div class='inversion-inicial'><p><strong>💰 Inversión inicial:</strong></p><ul><li>Instalación: desde $500</li><li>Primera mensualidad</li><li>Equipo incluido (comodato)</li></ul></div>",
        remitente: "bot",
        timestamp: new Date(),
        esBotonAccion: true,
        accion: "contratar",
        textoBoton: "Elige el plan que más te guste",
      };
    }

    // Soporte
    if (/(soporte|ayuda|problema|falla|técnico|servicio técnico|no funciona|lento)/i.test(mensaje)) {
      return {
        id: Date.now(),
        texto: "<div class='mensaje-titulo'>🛠️ Soporte Técnico emenet</div><p>Nuestro equipo está listo para ayudarte:</p><div class='contacto-info'><div class='contacto-item'><strong>📞 Atención al Cliente</strong><br>713 133 4557 Ext 2<br>800 204 99 00</div><div class='contacto-item'><strong>⏰ Horarios de atención:</strong><br>Lunes a Viernes: 9:00 AM - 6:00 PM<br>Sábados: 9:00 AM - 3:00 PM</div><div class='contacto-item'><strong>💬 Chat Bot:</strong> Disponible 24/7</div><div class='contacto-item'><strong>✉️ Correo:</strong> clientes@emenet.mx</div></div>",
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    // Horarios de atención
    if (/(horario|horarios|atención|atencion)\s*(de|del)?\s*(servicio|atención|atencion)?/i.test(mensaje)) {
      return {
        id: Date.now(),
        texto: "<div class='info-general'><p><strong>🕐 Horarios de atención:</strong></p><ul><li>Lunes a Viernes: 9:00 AM - 6:00 PM</li><li>Sábados: 9:00 AM - 3:00 PM</li><li>Chat Bot: Disponible 24/7</li></ul></div>",
        remitente: "bot",
        timestamp: new Date(),
        esHorarios: true
      };
    }

    // Contacto
    if (/(contacto|contactar|teléfono|telefono|llamar|hablar|comunicar)/i.test(mensaje)) {
      return {
        id: Date.now(),
        texto: "<div class='mensaje-titulo'>📞 Información de Contacto</div><div class='contacto-info'><div class='contacto-item'><strong>Teléfonos:</strong><ul><li>713 133 4557 Ext 1 (Ventas)</li><li>713 133 4557 Ext 2 (Soporte)</li><li>800 204 99 00 (Lada sin costo)</li></ul></div><div class='contacto-item'><strong>Correo electrónico:</strong><br>✉️ clientes@emenet.mx</div><div class='contacto-item'><strong>Redes sociales:</strong><br>📘 Facebook: /emenet-Comunicaciones<br>📸 Instagram: @mnetandador</div><div class='contacto-item'><strong>Horario de atención:</strong><br>🕐 Lunes a Viernes: 9:00 AM - 6:00 PM<br>🕐 Sábados: 9:00 AM - 3:00 PM</div></div><p class='text-center'><strong>¡Estamos para servirte!</strong></p>",
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    // Velocidad/Fibra óptica
    if (/(velocidad|rápido|fibra|óptica|megas|mbps)/i.test(mensaje)) {
      return {
        id: Date.now(),
        texto: "<div class='mensaje-titulo'>⚡ Internet de Fibra Óptica</div><div class='fibra-optica-info'><p><strong>¿Por qué elegir fibra óptica?</strong></p><ul class='beneficios-lista'><li>✅ <strong>Velocidad simétrica:</strong> Misma velocidad de subida y bajada</li><li>✅ <strong>Baja latencia:</strong> Ideal para gaming y videollamadas</li><li>✅ <strong>Mayor estabilidad:</strong> Sin interrupciones</li><li>✅ <strong>Tecnología de última generación</strong></li></ul><p><strong>Nuestras velocidades:</strong></p><ul><li>100 Mbps - Navegación fluida</li><li>200 Mbps - Streaming HD sin buffering</li><li>300 Mbps - Gaming y 4K simultáneos</li><li>500 Mbps - Máximo rendimiento</li></ul><p>¿Quieres conocer más sobre nuestros planes?</p></div>",
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    // Más información - Menú interactivo
    if (/(más información|mas informacion|info|información|ayuda general|opciones)/i.test(mensaje)) {
      const horaActual = new Date().getHours();
      let saludo = "";
      
      if (horaActual >= 6 && horaActual < 12) {
        saludo = "¡Buenos días! ☀️";
      } else if (horaActual >= 12 && horaActual < 19) {
        saludo = "¡Buenas tardes! 🌤️";
      } else {
        saludo = "¡Buenas noches! 🌙";
      }
      
      const esHorarioAtencion = (horaActual >= 9 && horaActual < 18) || (horaActual >= 9 && horaActual < 15 && new Date().getDay() === 6);
      const estadoAtencion = esHorarioAtencion 
        ? "Nuestro equipo está disponible en este momento para atenderte." 
        : "Aunque estamos fuera de horario, puedo ayudarte con información general.";
      
      return {
        id: Date.now(),
        texto: `<div class='mensaje-titulo'>${saludo} Dime todas tus dudas 😊</div><p>${estadoAtencion}</p><div class='info-general'><p><strong>🕐 Horarios de atención:</strong></p><ul><li>Lunes a Viernes: 9:00 AM - 6:00 PM</li><li>Sábados: 9:00 AM - 3:00 PM</li><li>Chat Bot: Disponible 24/7</li></ul></div><p>Puedo ayudarte con:</p><ul class='opciones-ayuda'><li>📡 <strong>Planes y precios</strong> - Conoce nuestras opciones de internet</li><li>📍 <strong>Cobertura</strong> - Verifica si llegamos a tu zona</li><li>📝 <strong>Contratación</strong> - Proceso para obtener tu servicio</li><li>🛠️ <strong>Soporte técnico</strong> - Ayuda con tu servicio actual</li><li>📞 <strong>Contacto</strong> - Formas de comunicarte con nosotros</li><li>⚡ <strong>Fibra óptica</strong> - Ventajas de nuestra tecnología</li></ul><p class='mensaje-amigable'>¿Sobre qué te gustaría saber más? Escríbeme con confianza, estoy aquí para ayudarte. 😊</p>`,
        remitente: "bot",
        timestamp: new Date(),
      };
    }

    // Respuesta por defecto - Intentar con Gemini AI
    return null;
  }

  enviarMensaje(textoMensaje?: string): void {
    const texto = textoMensaje || this.valorEntrada.trim();

    if (!texto || this.botEscribiendo) return;

    const mensajeUsuario: Mensaje = {
      id: Date.now(),
      texto: texto,
      remitente: "usuario",
      timestamp: new Date(),
    };

    this.mensajes.push(mensajeUsuario);
    this.valorEntrada = "";
    this.debeDesplazar = true;

    // Mostrar indicador de escribiendo
    this.botEscribiendo = true;
    this.debeDesplazar = true;

    // Simular respuesta del bot después de un delay (3s)
    setTimeout(() => {
      const respuestaBot = this.obtenerRespuestaBot(texto);

      if (respuestaBot) {
        this.enviarRespuestaProgresiva(respuestaBot);
      } else {
        // Si no hay respuesta predefinida, usar Gemini AI
        this.obtenerRespuestaConGemini(texto);
      }
    }, 3000);
  }

  async enviarRespuestaProgresiva(respuesta: Mensaje): Promise<void> {
    // Dividir respuestas largas en partes
    const partes = this.dividirRespuestaEnPartes(respuesta);

    for (let i = 0; i < partes.length; i++) {
      // Esperar 3 segundos entre mensajes (excepto el primero)
      if (i > 0) {
        await this.esperar(3000);
      }

      // Agregar el mensaje
      this.mensajes.push(partes[i]);
      this.debeDesplazar = true;

      if (!this.chatAbierto) {
        this.tieneNotificacionNueva = true;
      }
    }

    // Ocultar indicador de escribiendo
    this.botEscribiendo = false;
  }

  dividirRespuestaEnPartes(respuesta: Mensaje): Mensaje[] {
    const partes: Mensaje[] = [];

    // Manejar mensaje de horarios
    if (respuesta.esHorarios) {
      // Parte 1: Mostrar horarios
      partes.push({
        id: Date.now(),
        texto: respuesta.texto,
        remitente: "bot",
        timestamp: new Date(),
        esHorarios: true
      });

      // Parte 2: Mensaje de seguimiento (se mostrará después de 3 segundos)
      partes.push({
        id: Date.now() + 1,
        texto: "¿Puedo ayudarte con algo más? 😊",
        remitente: "bot",
        timestamp: new Date()
      });

      return partes;
    }

    // Detalle de plan seleccionado -> mostrar por partes
    if (respuesta.esDetallePlan && respuesta.planDetalle) {
      const plan = respuesta.planDetalle as any;
      const colorClase = plan.color ? ` color-${plan.color}` : "";

      // Parte 1: encabezado con nombre y precio
      partes.push({
        id: Date.now(),
        texto: `<div class='plan-detalle-card${colorClase}'><div class='plan-header'><h3>${plan.nombre}</h3><div class='plan-precio'><span class='precio-cantidad'>$${plan.precio}</span><span class='precio-periodo'>/mes</span></div></div></div>`,
        remitente: "bot",
        timestamp: new Date(),
      });

      // Parte 2: info clave (enriquecida)
      partes.push({
        id: Date.now() + 1,
        texto: `<div class='plan-detalle-card${colorClase}'>
          <div class='plan-info-titulo'>Características principales</div>
          <div class='plan-info'>
            <div class='info-item'><strong>⚡ Velocidad:</strong> ${plan.velocidad} simétricos</div>
            <div class='info-item'><strong>📱 Dispositivos:</strong> Hasta ${plan.dispositivos} dispositivos</div>
            <div class='info-item'><strong>📝 Descripción:</strong> ${plan.descripcion}</div>
            <div class='info-item'><strong>🧪 Tecnología:</strong> Fibra óptica 100%</div>
            <div class='info-item'><strong>📶 Estabilidad:</strong> Alta, ideal para home office y clases en línea</div>
            <div class='info-item'><strong>⏱️ Latencia:</strong> Baja para gaming y videollamadas</div>
            <div class='info-item'><strong>🛡️ Soporte:</strong> Atención especializada 24/7</div>
            <div class='info-item'><strong>✅ Recomendado para:</strong> ${plan.velocidad.includes('500') ? 'Streaming 4K, gaming y múltiples usuarios' : plan.velocidad.includes('300') ? 'Gaming, 4K y trabajo remoto' : plan.velocidad.includes('200') ? 'Streaming HD, videollamadas y trabajo' : 'Navegación diaria y redes sociales'}</div>
          </div>
        </div>`,
        remitente: "bot",
        timestamp: new Date(),
      });

      // Parte 3: qué incluye
      partes.push({
        id: Date.now() + 2,
        texto: `<div class='plan-detalle-card${colorClase}'><div class='plan-incluye'><p><strong>✨ Incluye:</strong></p><ul><li>Internet 100% fibra óptica</li><li>Velocidad simétrica garantizada</li><li>Equipo en comodato</li><li>Soporte técnico especializado</li><li>Instalación desde $500*</li></ul><p class='nota'>*El costo puede variar según la distancia</p></div></div>`,
        remitente: "bot",
        timestamp: new Date(),
      });

      // Parte 4: botón de contratar
      partes.push({
        id: Date.now() + 3,
        texto: "📝 Contratar este plan",
        remitente: "bot",
        timestamp: new Date(),
        esBotonAccion: true,
        accion: "contratar",
        textoBoton: "📝 Contratar este plan",
        planDetalle: plan,
      });

      return partes;
    }

    // Menú de planes residenciales -> mostrar los 4 paquetes en un solo bloque y luego invitar a planes empresariales
    if (respuesta.esMenuPlanes) {
      // Parte 1: introducción (solo título y texto)
      partes.push({
        id: Date.now(),
        texto: respuesta.texto,
        remitente: "bot",
        timestamp: new Date(),
      });

      // Parte 2: todos los planes en una sola grilla
      partes.push({
        id: Date.now() + 1,
        texto: "<p>Elige uno de estos planes:</p>",
        remitente: "bot",
        timestamp: new Date(),
        esMenuPlanes: true,
        planesMenu: this.planesDisponibles || [],
      });

      // Parte 3: invitación a planes empresariales con CTA
      partes.push({
        id: Date.now() + 2,
        texto: "<p><strong>También te podría interesar:</strong></p><div class='mensaje-titulo'>💼 Planes empresariales</div><p>Si tu empresa requiere una conexión más potente, te invitamos a conocer nuestros planes empresariales.</p>",
        remitente: "bot",
        timestamp: new Date(),
        esBotonAccion: true,
        accion: "planes-empresariales",
        textoBoton: "Conoce más",
      });

      return partes;
    }

    // Contratación - dividir en múltiples mensajes
    if (respuesta.texto.includes('¡Excelente decisión!')) {
      partes.push({
        id: Date.now(),
        texto: "<div class='mensaje-titulo'>🎉 ¡Excelente decisión!</div><p>Para contratar tu servicio de internet emenet puedes:</p>",
        remitente: "bot",
        timestamp: new Date(),
      });

      partes.push({
        id: Date.now() + 1,
        texto: "<div class='opciones-contratacion'><div class='opcion'><strong>📱 Opción 1: Formulario en línea</strong> (Recomendado)<br>Llena el formulario y nos contactamos contigo</div><div class='opcion'><strong>📞 Opción 2: Llamada directa</strong><br>713 133 4557 Ext 1 | 800 204 99 00</div></div>",
        remitente: "bot",
        timestamp: new Date(),
      });

      partes.push({
        id: Date.now() + 2,
        texto: "<div class='opciones-contratacion'><div class='opcion'><strong>💬 Opción 3: WhatsApp</strong><br>Envíanos un mensaje directo</div><div class='opcion'><strong>🏢 Opción 4: Visita presencial</strong><br>Horario: Lun-Vie 9:00-18:00, Sáb 9:00-15:00</div></div>",
        remitente: "bot",
        timestamp: new Date(),
      });

      partes.push({
        id: Date.now() + 3,
        texto: "<div class='proceso-contratacion'><p><strong>Proceso de contratación:</strong></p><ol><li>Verificamos cobertura en tu zona</li><li>Eliges tu plan ideal</li><li>Agendamos instalación</li><li>¡Listo! Internet de alta velocidad en tu hogar</li></ol></div>",
        remitente: "bot",
        timestamp: new Date(),
      });

      partes.push({
        id: Date.now() + 4,
        texto: "<div class='inversion-inicial'><p><strong>💰 Inversión inicial:</strong></p><ul><li>Instalación: desde $500</li><li>Primera mensualidad</li><li>Equipo incluido (comodato)</li></ul></div>",
        remitente: "bot",
        timestamp: new Date(),
      });

      if (respuesta.esBotonAccion) {
        partes.push({
          id: Date.now() + 5,
          texto: respuesta.textoBoton || "",
          remitente: "bot",
          timestamp: new Date(),
          esBotonAccion: true,
          accion: respuesta.accion,
          textoBoton: respuesta.textoBoton,
        });
      }

      return partes;
    }

    // Más información - dividir en partes (detectar por bloques de clase)
    if (respuesta.texto.includes("opciones-ayuda") || respuesta.texto.includes("info-general") || respuesta.texto.includes("mensaje-amigable")) {
      const textoCompleto = respuesta.texto;
      
      // Extraer secciones
      const saludoMatch = textoCompleto.match(/<div class=['"]mensaje-titulo['"]>([\s\S]*?)<\/div>\s*<p>([\s\S]*?)<\/p>/);
      const horariosMatch = textoCompleto.match(/<div class=['"]info-general['"]>([\s\S]*?)<\/div>/);
      const opcionesMatch = textoCompleto.match(/<ul class=['"]opciones-ayuda['"]>([\s\S]*?)<\/ul>/);
      const mensajeAmigableMatch = textoCompleto.match(/<p class=['"]mensaje-amigable['"]>([\s\S]*?)<\/p>/);

      if (saludoMatch) {
        partes.push({
          id: Date.now(),
          texto: `<div class='mensaje-titulo'>${saludoMatch[1]}</div><p>${saludoMatch[2]}</p>`,
          remitente: "bot",
          timestamp: new Date(),
        });
      }

      if (horariosMatch) {
        partes.push({
          id: Date.now() + 1,
          texto: `<div class='info-general'>${horariosMatch[1]}</div>`,
          remitente: "bot",
          timestamp: new Date(),
        });
      }

      if (opcionesMatch) {
        partes.push({
          id: Date.now() + 2,
          texto: `<p>Puedo ayudarte con:</p><ul class='opciones-ayuda'>${opcionesMatch[1]}</ul>`,
          remitente: "bot",
          timestamp: new Date(),
        });
      }

      if (mensajeAmigableMatch) {
        partes.push({
          id: Date.now() + 3,
          texto: `<p class='mensaje-amigable'>${mensajeAmigableMatch[1]}</p>`,
          remitente: "bot",
          timestamp: new Date(),
        });
      }

      return partes.length > 0 ? partes : [respuesta];
    }

    // Para respuestas que no necesitan división, retornar como está
    return [respuesta];
  }

  esperar(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  ejecutarAccion(accion: string, planDetalle?: any): void {
    if (accion === "cobertura") {
      // Navegar a la página de inicio con el fragmento de cobertura
      this.router.navigate(['/'], { fragment: 'mapa-cobertura' }).then(() => {
        // Cerrar el chat después de la navegación
        this.chatAbierto = false;
        this.mostrarIconosSociales = false;
        
        // Desplazarse al elemento de cobertura después de un pequeño retraso
        setTimeout(() => {
          const elemento = document.getElementById('mapa-cobertura');
          if (elemento) {
            // Calcular la posición con un desplazamiento hacia arriba
            const yOffset = -100; // Desplazamiento en píxeles hacia arriba
            const y = elemento.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 100);
      });
    } else if (accion === "planes-empresariales") {
      // Simular que el bot escribe durante 3s y enviar un mensaje previo
      this.botEscribiendo = true;
      this.debeDesplazar = true;

      setTimeout(() => {
        // Mensaje previo solicitando completar el formulario
        const aviso: Mensaje = {
          id: Date.now(),
          texto: "<div class='mensaje-titulo'>📝 Formulario empresarial</div><p>Por favor, rellena tus datos en el formulario para que nuestro equipo pueda contactarte y ofrecerte la mejor solución empresarial.</p>",
          remitente: "bot",
          timestamp: new Date(),
        };
        this.mensajes.push(aviso);
        this.debeDesplazar = true;
        this.botEscribiendo = false;

        // Abrir el formulario empresarial en la página de planes
        setTimeout(() => {
          // Colocar una marca en localStorage como respaldo para abrir el modal
          try { localStorage.setItem('abrirModalEmpresarial', '1'); } catch {}

          this.router.navigate(["/planes"], { queryParams: { modal: 'empresariales' } }).then(() => {
            // Cerrar el chat ligeramente después para no interrumpir la percepción del mensaje
            setTimeout(() => {
              this.chatAbierto = false;
              this.mostrarIconosSociales = false;
            }, 200);
          });
        }, 5000); // esperar 5s después del mensaje antes de navegar y abrir el formulario
      }, 3000);
    } else if (accion === "contratar") {
      // Si hay un plan específico, guardarlo en localStorage
      if (planDetalle) {
        localStorage.setItem('planSeleccionadoChat', JSON.stringify(planDetalle));
      }
      // Navegar a la página de planes
      this.router.navigate(["/planes"]);
      this.chatAbierto = false;
      this.mostrarIconosSociales = false;
    }
  }

  seleccionarPlan(plan: any): void {
    // Simular escribiendo y luego enviar el detalle en partes
    this.botEscribiendo = true;
    this.debeDesplazar = true;

    setTimeout(() => {
      const mensajeDetalle: Mensaje = {
        id: Date.now(),
        texto: "", // el contenido se generará en dividirRespuestaEnPartes
        remitente: "bot",
        timestamp: new Date(),
        esDetallePlan: true,
        planDetalle: plan,
      };

      this.enviarRespuestaProgresiva(mensajeDetalle);
    }, 3000);
  }

  private detectarZonaEnMensaje(mensaje: string): string | null {
    const msg = this.normalizarTexto(mensaje);

    for (const zona of this.zonasCobertura) {
      const z = this.normalizarTexto(zona);

      // Coincidencia directa
      if (msg.includes(z)) {
        return zona;
      }

      // Coincidencia por tokens (palabras relevantes)
      const tokens = z.split(" ").filter((t) => t.length > 2);
      const matchCount = tokens.filter((t) => msg.includes(t)).length;
      if (matchCount >= Math.min(2, tokens.length)) {
        return zona;
      }
    }

    return null;
  }

  private cargarZonasCobertura(): void {
    // Cargar zonas desde assets/zonasCompletas.json
    this.http
      .get<{ cobertura: Array<{ Descripción: string; municipio: string }> }>(
        "assets/zonasCompletas.json",
      )
      .subscribe({
        next: (data) => {
          const zonas: string[] = [];
          if (data && Array.isArray(data.cobertura)) {
            for (const item of data.cobertura) {
              const desc = (item as any)["Descripción"]; // el JSON usa tilde
              if (desc) zonas.push(String(desc).trim());
              if (item.municipio) zonas.push(String(item.municipio).trim());
            }
          }
          // Unificar y ordenar, evitando duplicados (case/acentos ignorados)
          const visto = new Set<string>();
          this.zonasCobertura = zonas.filter((z) => {
            const clave = this.normalizarTexto(z);
            if (visto.has(clave)) return false;
            visto.add(clave);
            return true;
          });
        },
        error: () => {
          // En caso de error, dejamos la lista como está (vacía) sin romper el chat
          this.zonasCobertura = this.zonasCobertura || [];
        },
      });
  }

  private normalizarTexto(s: string): string {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Obtener últimos N mensajes para contexto
   */
  private obtenerHistorialMensajes(cantidad: number = 10): Array<{remitente: 'usuario' | 'bot', texto: string}> {
    // Filtrar solo mensajes regulares (no bienvenida, no características, etc.)
    const mensajesRegulares = this.mensajes.filter(m => 
      !m.esBienvenida && 
      !m.esCaracteristicas && 
      !m.esPreguntasSugeridas
    );
    
    // Tomar los últimos N mensajes
    const ultimos = mensajesRegulares.slice(-cantidad);
    
    return ultimos.map(m => ({
      remitente: m.remitente,
      texto: m.texto
    }));
  }

  /**
   * Obtener respuesta usando Gemini AI como fallback
   */
  private obtenerRespuestaConGemini(pregunta: string): void {
    // Obtener historial de los últimos 10 mensajes para contexto
    const historial = this.obtenerHistorialMensajes(10);
    
    this.geminiService.obtenerRespuestaGemini(pregunta, historial, this.sessionId).subscribe({
      next: (respuesta) => {
        const mensajeBot: Mensaje = {
          id: Date.now(),
          texto: `<p>${respuesta}</p>`,
          remitente: "bot",
          timestamp: new Date(),
        };
        
        this.mensajes.push(mensajeBot);
        this.debeDesplazar = true;
        this.botEscribiendo = false;
        
        if (!this.chatAbierto) {
          this.tieneNotificacionNueva = true;
        }
      },
      error: (error) => {
        console.error('Error al obtener respuesta de Gemini:', error);
        
        // Respuesta de fallback si Gemini falla
        const mensajeFallback: Mensaje = {
          id: Date.now(),
          texto: "<p>Disculpa, no estoy seguro de cómo responder a eso. 🤔</p><p>Pero puedo ayudarte con:</p><ul><li>📡 Planes y precios</li><li>📍 Cobertura en tu zona</li><li>📝 Proceso de contratación</li><li>🛠️ Soporte técnico</li></ul><p>¿Podrías reformular tu pregunta o elegir una de estas opciones?</p>",
          remitente: "bot",
          timestamp: new Date(),
        };
        
        this.mensajes.push(mensajeFallback);
        this.debeDesplazar = true;
        this.botEscribiendo = false;
      }
    });
  }

  reiniciarConversacion(): void {
    // Generar nuevo session ID al reiniciar para nueva conversación
    this.generarSessionId();
    this.inicializarMensajes();
    this.debeDesplazar = true;
    // Resetear estados de conversación
    this.esperandoZonaCobertura = false;
    this.esperandoNumeroUsuarios = false;
  }

  private desplazarAlFinal(): void {
    try {
      if (this.mensajesContainer) {
        const elemento = this.mensajesContainer.nativeElement;
        elemento.scrollTop = elemento.scrollHeight;
      }
    } catch (err) {
      console.error("Error al desplazar:", err);
    }
  }

  formatearHora(fecha: Date): string {
    return new Date(fecha).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
