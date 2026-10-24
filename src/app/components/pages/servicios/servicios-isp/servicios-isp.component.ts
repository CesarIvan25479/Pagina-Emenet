import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { PreloaderService } from '../../../../services/preloader.service';
import { SolicitudService } from '../../../../services/solicitud.service';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface NetworkNode {
  id: string;
  name: string;
  pos: [number, number, number];
  isBorder?: boolean;
}

@Component({
  selector: 'app-servicios-isp',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule
  ],
  templateUrl: './servicios-isp.component.html',
  styleUrl: './servicios-isp.component.scss'
})
export class ServiciosIspComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('earthCanvas', { static: false }) earthCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer', { static: false }) canvasContainerRef!: ElementRef<HTMLDivElement>;

  // Instancias de Three.js
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private earthGroup = new THREE.Group();
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private pulseRings: THREE.Mesh[] = [];
  private interactiveHitboxes: THREE.Mesh[] = [];
  private dataPackets: { mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; progress: number; speed: number }[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private onMouseMoveBound: ((e: MouseEvent) => void) | null = null;

  // Estados 3D
  isBrowser = false;
  isLoadingModel = true;
  loadingProgress = 0;
  isAutoRotating = false; // Sin rotación automática: solo se mueve con el mouse

  // Tooltip interactivo al pasar el mouse por un nodo de conexión
  hoveredNode: NetworkNode | null = null;
  tooltipPos = { x: 0, y: 0 };

  // Modal de Más Información
  mostrarModalInfo = false;

  // Formulario de cotización
  quoteForm!: FormGroup;
  formSubmitted = false;
  quoteSuccess = false;
  enviandoForm = false;
  detectandoUbicacion = false;

  // Coordenadas exactas en la superficie del modelo según la silueta de México y el diagrama de referencia
  nodes: NetworkNode[] = [
    { id: 'san-diego', name: 'San Diego', pos: [-0.3841, 0.5405, 0.7486], isBorder: true },
    { id: 'tijuana', name: 'Tijuana', pos: [-0.3833, 0.5375, 0.7511], isBorder: true },
    { id: 'ensenada', name: 'Ensenada', pos: [-0.3802, 0.5279, 0.7594] },
    { id: 'chihuahua', name: 'Chihuahua', pos: [-0.2432, 0.4792, 0.8433] },
    { id: 'mcallen', name: 'McAllen', pos: [-0.1284, 0.4416, 0.888], isBorder: true },
    { id: 'monterrey', name: 'Monterrey', pos: [-0.1614, 0.4334, 0.8866], isBorder: true },
    { id: 'saltillo', name: 'Saltillo', pos: [-0.1724, 0.4293, 0.8865] },
    { id: 'cd-victoria', name: 'Cd. Victoria', pos: [-0.1454, 0.4025, 0.9038] },
    { id: 'san-luis', name: 'San Luis Potosí', pos: [-0.1765, 0.3771, 0.9092] },
    { id: 'guadalajara', name: 'Guadalajara', pos: [-0.216, 0.3528, 0.9104] },
    { id: 'queretaro', name: 'Querétaro', pos: [-0.1688, 0.3517, 0.9208] },
    { id: 'toluca', name: 'Toluca', pos: [-0.1583, 0.3302, 0.9305] },
    { id: 'cdmx', name: 'CDMX', pos: [-0.1497, 0.3327, 0.9311] }
  ];

  // Interconexiones de fibra óptica
  // Cruces fronterizos (Cian neón): San Diego ⇄ Tijuana, McAllen ⇄ Monterrey
  borderConnections: [string, string][] = [
    ['san-diego', 'tijuana'],
    ['mcallen', 'monterrey']
  ];

  // Red Troncal Nacional: Malla totalmente interconectada punto a punto
  nationalConnections: [string, string][] = [
    // Noroeste & Península
    ['tijuana', 'ensenada'],
    ['tijuana', 'chihuahua'],
    ['ensenada', 'chihuahua'],

    // Norte, Noreste & Golfo
    ['chihuahua', 'saltillo'],
    ['chihuahua', 'monterrey'],
    ['monterrey', 'saltillo'],
    ['monterrey', 'cd-victoria'],
    ['saltillo', 'cd-victoria'],
    ['saltillo', 'san-luis'],
    ['cd-victoria', 'san-luis'],

    // Bajío, Occidente & Centro
    ['san-luis', 'queretaro'],
    ['san-luis', 'guadalajara'],
    ['guadalajara', 'queretaro'],
    ['guadalajara', 'toluca'],
    ['cd-victoria', 'queretaro'],
    ['queretaro', 'toluca'],
    ['queretaro', 'cdmx'],
    ['toluca', 'cdmx']
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private fb: FormBuilder,
    private preloader: PreloaderService,
    public router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private solicitudService: SolicitudService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.quoteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      empresa: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      correo: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      ciudad: ['', [Validators.required]],
      capacidad: ['1 Gbps Simétrico', [Validators.required]],
      mensaje: ['']
    });

    if (this.isBrowser) {
      setTimeout(() => {
        this.preloader.hide();
      }, 400);
      this.detectarUbicacionActual();
    }

    // Asegurar que el control de teléfono nunca contenga caracteres no numéricos
    this.quoteForm.get('telefono')?.valueChanges.subscribe((val) => {
      if (val !== null && val !== undefined) {
        const str = val.toString();
        const digits = str.replace(/\D/g, '').slice(0, 10);
        if (str !== digits) {
          this.quoteForm.get('telefono')?.setValue(digits, { emitEvent: false });
        }
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.ngZone.runOutsideAngular(() => {
        this.initThreeScene();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.controls) {
      this.controls.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.onMouseMoveBound && this.canvasContainerRef) {
      this.canvasContainerRef.nativeElement.removeEventListener('mousemove', this.onMouseMoveBound);
    }
    this.pulseRings = [];
    this.dataPackets = [];
    this.interactiveHitboxes = [];
    this.disposeThreeObject(this.scene);
  }

  private initThreeScene(): void {
    if (!this.earthCanvasRef || !this.canvasContainerRef) return;

    const canvas = this.earthCanvasRef.nativeElement;
    const container = this.canvasContainerRef.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Escena
    this.scene = new THREE.Scene();

    // 2. Cámara (zoom exacto centrado)
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 5.2);

    // 3. Renderizador WebGL
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // 4. Luces ambientales y direccionales realistas
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.6);
    sunLight.position.set(5, 3, 5);
    this.scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(-5, -2, -4);
    this.scene.add(rimLight);

    // 5. Controles orbitales (NO se mueve solo, solo con mouse)
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = false; // Desactivado
    this.controls.autoRotateSpeed = 0.6;
    this.controls.enableZoom = true;
    this.controls.minDistance = 2.1;
    this.controls.maxDistance = 8.0;
    this.controls.enablePan = false;

    // Grupo contenedor de la Tierra
    this.scene.add(this.earthGroup);

    // 6. Carga del modelo GLTF desde public/models/earth/Earth.gltf
    const loader = new GLTFLoader();
    loader.load(
      'models/earth/Earth.gltf',
      (gltf) => {
        const model = gltf.scene;

        // Escala del globo
        model.scale.set(1.95, 1.95, 1.95);
        model.position.set(0, 0, 0);

        // Orientación natural: México y los marcadores al frente centrado, vertical y al derecho
        model.rotation.order = 'YXZ';
        model.rotation.x = (26 * Math.PI) / 180;
        model.rotation.y = (13 * Math.PI) / 180;
        model.rotation.z = 0;

        this.earthGroup.add(model);

        // Buscar el mesh de la Tierra
        let meshTarget: THREE.Object3D = model;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            meshTarget = child;
          }
        });

        // Adherir los pines rojos y líneas de fibra óptica directamente al mesh sobre la superficie de México
        this.addMexicoNetworkPins(meshTarget);

        this.ngZone.run(() => {
          this.isLoadingModel = false;
        });
      },
      (xhr) => {
        if (xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          this.ngZone.run(() => {
            this.loadingProgress = Math.min(percent, 99);
          });
        }
      },
      (error) => {
        console.error('Error al cargar Earth.gltf:', error);
        this.createFallbackSphere();
        this.ngZone.run(() => {
          this.isLoadingModel = false;
        });
      }
    );

    // 7. Loop de renderizado
    const animate = (time: number = 0) => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.controls.update();

      // Animación pulsante suave de los puntos de conexión de red (#45db7c)
      if (this.pulseRings.length > 0) {
        const t = time * 0.003;
        for (let i = 0; i < this.pulseRings.length; i++) {
          const s = 1.0 + 0.25 * Math.sin(t + i * 0.6);
          this.pulseRings[i].scale.set(s, s, 1);
        }
      }

      // Transmisión de paquetes de datos de fibra óptica entre puntos de conexión
      if (this.dataPackets.length > 0) {
        for (let i = 0; i < this.dataPackets.length; i++) {
          const p = this.dataPackets[i];
          p.progress = (p.progress + p.speed) % 1.0;
          const pos = p.curve.getPointAt(p.progress);
          p.mesh.position.copy(pos);
        }
      }

      this.renderer.render(this.scene, this.camera);
    };
    animate();

    // 8. ResizeObserver
    this.resizeObserver = new ResizeObserver(() => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        this.camera.aspect = newWidth / newHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(newWidth, newHeight);
      }
    });
    this.resizeObserver.observe(container);

    // 9. Interacción Hover sobre los nodos para mostrar el nombre del estado/zona
    this.onMouseMoveBound = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.mouse.x = (x / container.clientWidth) * 2 - 1;
      this.mouse.y = -(y / container.clientHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveHitboxes, false);

      if (intersects.length > 0) {
        const hitNode = intersects[0].object.userData['node'] as NetworkNode;
        this.ngZone.run(() => {
          this.hoveredNode = hitNode;
          this.tooltipPos = { x, y };
        });
        canvas.style.cursor = 'pointer';
      } else {
        if (this.hoveredNode !== null) {
          this.ngZone.run(() => {
            this.hoveredNode = null;
          });
          canvas.style.cursor = 'grab';
        }
      }
    };
    container.addEventListener('mousemove', this.onMouseMoveBound);
  }

  private createFallbackSphere(): void {
    const geometry = new THREE.SphereGeometry(2.1, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.5,
      metalness: 0.1
    });
    const sphere = new THREE.Mesh(geometry, material);
    this.earthGroup.add(sphere);
    this.addMexicoNetworkPins(sphere);
  }

  private addMexicoNetworkPins(targetParent: THREE.Object3D): void {
    const positionsMap = new Map<string, THREE.Vector3>();

    // Color rojo para los círculos y líneas de conexión
    const BRAND_COLOR = 0x0045C4;

    // Núcleo luminoso del punto de conexión (rojo brillante)
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: BRAND_COLOR
    });

    // Anillo fijo concéntrico (rojo)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: BRAND_COLOR,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    // Anillo radar pulsante animado (rojo neón)
    const pulseRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x0045C4,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });

    // 1. Crear cada Punto de Conexión elegante (círculos rojos más pequeños y definidos)
    this.nodes.forEach((node) => {
      const basePos = new THREE.Vector3(...node.pos);
      const normal = basePos.clone().normalize();

      // Despegar sutilmente de la superficie para evitar z-fighting
      const surfacePos = basePos.clone().add(normal.clone().multiplyScalar(0.003));
      positionsMap.set(node.id, surfacePos);

      // A. Núcleo central luminoso (más pequeño)
      const coreRadius = node.isBorder ? 0.0052 : 0.0042;
      const coreGeom = new THREE.SphereGeometry(coreRadius, 16, 16);
      const coreMesh = new THREE.Mesh(coreGeom, coreMaterial);
      coreMesh.position.copy(surfacePos);
      targetParent.add(coreMesh);

      // B. Anillo concéntrico fijo (tangente a la esfera terrestre)
      const ringGeom = new THREE.RingGeometry(coreRadius * 1.3, coreRadius * 2.0, 24);
      const ringMesh = new THREE.Mesh(ringGeom, ringMaterial);
      ringMesh.position.copy(surfacePos);
      ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      targetParent.add(ringMesh);

      // C. Anillo radar pulsante animado
      const pulseGeom = new THREE.RingGeometry(coreRadius * 2.2, coreRadius * 2.8, 24);
      const pulseMesh = new THREE.Mesh(pulseGeom, pulseRingMaterial);
      pulseMesh.position.copy(surfacePos);
      pulseMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      targetParent.add(pulseMesh);
      this.pulseRings.push(pulseMesh);

      // D. Hitbox invisible para interacción hover con tooltip
      const hitGeom = new THREE.SphereGeometry(0.024, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.position.copy(surfacePos);
      hitMesh.userData = { node };
      targetParent.add(hitMesh);
      this.interactiveHitboxes.push(hitMesh);
    });

    // 2. Líneas de interconexión de fibra óptica en color rojo (#ef4444)
    const fiberLineMaterial = new THREE.LineBasicMaterial({
      color: BRAND_COLOR,
      linewidth: 2.5,
      transparent: true,
      opacity: 0.95
    });

    // Trazar cruces fronterizos
    this.borderConnections.forEach(([fromId, toId]) => {
      const start = positionsMap.get(fromId);
      const end = positionsMap.get(toId);
      if (start && end) {
        this.createCurvedConnection(targetParent, start, end, fiberLineMaterial, 0.02);
      }
    });

    // Trazar red troncal nacional interconectada
    this.nationalConnections.forEach(([fromId, toId]) => {
      const start = positionsMap.get(fromId);
      const end = positionsMap.get(toId);
      if (start && end) {
        this.createCurvedConnection(targetParent, start, end, fiberLineMaterial, 0.015);
      }
    });
  }

  private createCurvedConnection(
    parent: THREE.Object3D,
    start: THREE.Vector3,
    end: THREE.Vector3,
    material: THREE.Material,
    elevationFactor: number
  ): void {
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    mid.normalize().multiplyScalar(start.length() + distance * elevationFactor);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(32);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);
    parent.add(line);

    // Bolitas de transmisión de datos en color rojo brillante (#d40029)
    const packetGeom = new THREE.SphereGeometry(0.0022, 12, 12);
    const packetMaterial = new THREE.MeshBasicMaterial({
      color: 0xd40029 // Rojo brillante
    });

    // Paquete en sentido A -> B
    const packet1 = new THREE.Mesh(packetGeom, packetMaterial);
    packet1.position.copy(start);
    parent.add(packet1);
    this.dataPackets.push({
      mesh: packet1,
      curve: curve,
      progress: Math.random(),
      speed: 0.004 + Math.random() * 0.003
    });

    // Paquete en sentido B -> A (bidireccional)
    const reverseCurve = new THREE.QuadraticBezierCurve3(end, mid, start);
    const packet2 = new THREE.Mesh(packetGeom, packetMaterial);
    packet2.position.copy(end);
    parent.add(packet2);
    this.dataPackets.push({
      mesh: packet2,
      curve: reverseCurve,
      progress: Math.random(),
      speed: 0.004 + Math.random() * 0.003
    });
  }

  private disposeThreeObject(obj: any): void {
    if (!obj) return;
    if (obj.children) {
      while (obj.children.length > 0) {
        this.disposeThreeObject(obj.children[0]);
        obj.remove(obj.children[0]);
      }
    }
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m: any) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  }

  // Controles
  toggleAutoRotate(): void {
    this.isAutoRotating = !this.isAutoRotating;
    if (this.controls) {
      this.controls.autoRotate = this.isAutoRotating;
    }
  }

  resetCamera(): void {
    if (this.controls && this.camera) {
      this.controls.reset();
      this.camera.position.set(0, 0, 5.2);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  abrirModalInfo(): void {
    this.mostrarModalInfo = true;
    this.cdr.detectChanges();
  }

  cerrarModalInfo(): void {
    this.mostrarModalInfo = false;
    this.cdr.detectChanges();
  }

  volverAlInicio(): void {
    this.router.navigate(['/']);
  }

  // Filtro estricto para aceptar únicamente números (0-9) y limitar a 10 dígitos
  onlyNumbers(event: KeyboardEvent): boolean {
    const allowedKeys = [
      'Backspace',
      'Tab',
      'Enter',
      'Escape',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Delete',
      'Home',
      'End'
    ];
    if (allowedKeys.includes(event.key)) {
      return true;
    }
    // Permitir combinaciones de Ctrl / Cmd (Ctrl+A, Ctrl+C, Ctrl+V, etc.)
    if (event.ctrlKey || event.metaKey) {
      return true;
    }
    // Bloquear cualquier tecla que no sea un número 0-9
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      return false;
    }
    // Bloquear si ya tiene 10 dígitos y no hay selección activa
    const input = event.target as HTMLInputElement;
    const selectionLen = (input.selectionEnd || 0) - (input.selectionStart || 0);
    const currentDigits = (input.value || '').replace(/\D/g, '');
    if (currentDigits.length >= 10 && selectionLen === 0) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = (input.value || '').replace(/\D/g, '').slice(0, 10);
    input.value = digitsOnly;
    this.quoteForm.get('telefono')?.setValue(digitsOnly, { emitEvent: false });
  }

  onPhonePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = (event.clipboardData || (window as any).clipboardData)?.getData('text') || '';
    const digitsOnly = pasted.replace(/\D/g, '').slice(0, 10);
    const input = event.target as HTMLInputElement;
    input.value = digitsOnly;
    this.quoteForm.get('telefono')?.setValue(digitsOnly, { emitEvent: false });
  }

  // Limpieza y corrección de codificación en nombres de ubicación (ej. Almoloya del Río)
  private limpiarUbicacion(texto: string): string {
    if (!texto) return '';
    let limpia = texto
      // Corregir codificaciones corruptas específicas
      .replace(/Almoloya\s+Del\s+R[ãa]o/gi, 'Almoloya del Río')
      .replace(/Almoloya\s+del\s+Rio/gi, 'Almoloya del Río')
      .replace(/R[ãa]o/g, 'Río')
      .replace(/\bdel Rio\b/gi, 'del Río')
      .replace(/Ã¡/g, 'á')
      .replace(/Ã©/g, 'é')
      .replace(/Ã­/g, 'í')
      .replace(/Ã³/g, 'ó')
      .replace(/Ãº/g, 'ú')
      .replace(/Ã±/g, 'ñ')
      .replace(/\bDel\b/g, 'del')
      .replace(/\bDe\b/g, 'de')
      .trim();

    // Normalizar tildes en nombres comunes de México
    limpia = limpia
      .replace(/\bMexico\b/g, 'México')
      .replace(/\bQueretaro\b/g, 'Querétaro')
      .replace(/\bNuevo Leon\b/g, 'Nuevo León')
      .replace(/\bSan Luis Potosi\b/g, 'San Luis Potosí')
      .replace(/\bYucatan\b/g, 'Yucatán')
      .replace(/\bMichoacan\b/g, 'Michoacán');

    return limpia;
  }

  // Detección de la ubicación actual del usuario
  detectarUbicacionActual(): void {
    if (!this.isBrowser) return;
    this.detectandoUbicacion = true;
    this.cdr.detectChanges();

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          this.http.get<any>(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`).subscribe({
            next: (data) => {
              const addr = data?.address || {};
              const ciudad = addr.city || addr.town || addr.municipality || addr.county || '';
              const estado = addr.state || '';
              let ubicacionFinal = '';
              if (ciudad && estado && ciudad !== estado) {
                ubicacionFinal = `${ciudad}, ${estado}`;
              } else {
                ubicacionFinal = ciudad || estado || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
              }
              this.quoteForm.patchValue({ ciudad: this.limpiarUbicacion(ubicacionFinal) });
              this.detectandoUbicacion = false;
              this.cdr.detectChanges();
            },
            error: () => {
              this.detectarPorIp();
            }
          });
        },
        () => {
          this.detectarPorIp();
        },
        { timeout: 6000 }
      );
    } else {
      this.detectarPorIp();
    }
  }

  private detectarPorIp(): void {
    // Usar ipwho.is que maneja UTF-8 limpio sin corrupción de acentos
    this.http.get<any>('https://ipwho.is/').subscribe({
      next: (data) => {
        if (data && data.success && (data.city || data.region)) {
          const ciudad = data.city ? `${data.city}, ${data.region || 'México'}` : data.region;
          this.quoteForm.patchValue({ ciudad: this.limpiarUbicacion(ciudad) });
        } else {
          this.fallbackIpapi();
        }
        this.detectandoUbicacion = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.fallbackIpapi();
      }
    });
  }

  private fallbackIpapi(): void {
    this.http.get<any>('https://ipapi.co/json/').subscribe({
      next: (data) => {
        if (data && (data.city || data.region)) {
          const ciudad = data.city ? `${data.city}, ${data.region || data.country_name}` : data.region;
          this.quoteForm.patchValue({ ciudad: this.limpiarUbicacion(ciudad) });
        } else if (!this.quoteForm.get('ciudad')?.value) {
          this.quoteForm.patchValue({ ciudad: 'Tijuana, Baja California' });
        }
        this.detectandoUbicacion = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (!this.quoteForm.get('ciudad')?.value) {
          this.quoteForm.patchValue({ ciudad: 'Tijuana, Baja California' });
        }
        this.detectandoUbicacion = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Envío del formulario al backend vía SolicitudService.enviarCorreo
  async onQuoteSubmit(): Promise<void> {
    this.formSubmitted = true;
    if (this.quoteForm.invalid || this.enviandoForm) {
      return;
    }

    try {
      this.enviandoForm = true;
      this.cdr.detectChanges();

      const val = this.quoteForm.value;
      const mensajeCompleto =
        `[Cotización de Conectividad ISP & Enlaces Dedicados]\n` +
        `• Empresa: ${val.empresa}\n` +
        `• Contacto: ${val.nombre}\n` +
        `• Teléfono: ${val.telefono}\n` +
        `• Correo: ${val.correo}\n` +
        `• Ciudad / Ubicación: ${val.ciudad}\n` +
        `• Capacidad Requerida: ${val.capacidad}\n` +
        (val.mensaje ? `• Requerimientos adicionales: ${val.mensaje}` : '');

      const payload = {
        nombre: val.nombre,
        empresa: val.empresa,
        telefono: val.telefono,
        correo: val.correo,
        ciudad: val.ciudad,
        capacidad: val.capacidad,
        mensaje: mensajeCompleto
      };

      await firstValueFrom(this.solicitudService.enviarCorreo(payload));

      this.quoteSuccess = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.quoteSuccess = false;
        this.formSubmitted = false;
        this.quoteForm.reset({
          capacidad: '1 Gbps Simétrico'
        });
        this.detectarUbicacionActual();
        this.mostrarModalInfo = false;
        this.cdr.detectChanges();
      }, 4000);

    } catch (error) {
      console.error('Error al enviar cotización a través de SolicitudService:', error);
      alert('Ocurrió un problema al enviar la solicitud por correo. Por favor, intenta de nuevo o contáctanos por WhatsApp.');
    } finally {
      this.enviandoForm = false;
      this.cdr.detectChanges();
    }
  }

  contactarWhatsApp(): void {
    if (!this.isBrowser) return;
    const val = this.quoteForm.value;
    const ciudadLimpia = this.limpiarUbicacion(val.ciudad);

    let mensaje = `*¡Hola! Deseo cotizar Enlaces Dedicados / Conectividad ISP:*\n\n`;
    if (val.nombre) mensaje += `- *Nombre:* ${val.nombre}\n`;
    if (val.empresa) mensaje += `- *Empresa:* ${val.empresa}\n`;
    if (val.telefono) mensaje += `- *Teléfono:* ${val.telefono}\n`;
    if (val.correo) mensaje += `- *Correo:* ${val.correo}\n`;
    if (ciudadLimpia) mensaje += `- *Ubicación / Ciudad:* ${ciudadLimpia}\n`;
    if (val.capacidad) mensaje += `- *Capacidad Requerida:* ${val.capacidad}\n`;
    if (val.mensaje) mensaje += `- *Mensaje:* ${val.mensaje}\n`;

    if (!val.nombre && !val.empresa && !val.telefono) {
      mensaje = `*¡Hola Emenet!* Deseo información y cotización sobre Enlaces Dedicados y Cruces Transfronterizos.`;
    }

    const numeroEmenet = '527131212432';
    const url = `https://api.whatsapp.com/send?phone=${numeroEmenet}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }
}
