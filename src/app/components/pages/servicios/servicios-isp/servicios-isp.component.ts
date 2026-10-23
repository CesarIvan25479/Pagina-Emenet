import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
  NgZone
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { PreloaderService } from '../../../../services/preloader.service';

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

  // Estados 3D
  isBrowser = false;
  isLoadingModel = true;
  loadingProgress = 0;
  isAutoRotating = false; // Sin rotación automática: solo se mueve con el mouse

  // Modal de Más Información
  mostrarModalInfo = false;

  // Formulario de cotización
  quoteForm!: FormGroup;
  formSubmitted = false;
  quoteSuccess = false;

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
  // Cruces fronterizos (Rojos): San Diego ⇄ Tijuana, McAllen ⇄ Monterrey
  borderConnections: [string, string][] = [
    ['san-diego', 'tijuana'],
    ['mcallen', 'monterrey']
  ];

  // Red Troncal Nacional (Verdes): Recorre la silueta de México exactamente como en el mapa
  nationalConnections: [string, string][] = [
    ['tijuana', 'ensenada'],
    ['tijuana', 'chihuahua'],
    ['chihuahua', 'monterrey'],
    ['monterrey', 'saltillo'],
    ['monterrey', 'cd-victoria'],
    ['saltillo', 'san-luis'],
    ['cd-victoria', 'san-luis'],
    ['san-luis', 'queretaro'],
    ['queretaro', 'guadalajara'],
    ['queretaro', 'toluca'],
    ['queretaro', 'cdmx'],
    ['toluca', 'cdmx']
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone,
    private fb: FormBuilder,
    private preloader: PreloaderService,
    public router: Router
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.quoteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      empresa: ['', [Validators.required]],
      telefono: ['', [Validators.required, Validators.pattern(/^[0-9+ \-]{8,15}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      ciudad: ['Tijuana / San Diego', [Validators.required]],
      capacidad: ['1 Gbps Simétrico', [Validators.required]],
      mensaje: ['']
    });

    if (this.isBrowser) {
      setTimeout(() => {
        this.preloader.hide();
      }, 400);
    }
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
    this.camera.position.set(0, 0, 3.5);

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
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.controls.update();
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

    // Material de chincheta roja idéntica a la imagen de referencia (Image 1)
    const pinHeadMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Rojo brillante
      roughness: 0.25,
      metalness: 0.2
    });

    const needleMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8, // Aguja metálica plateada
      roughness: 0.3,
      metalness: 0.8
    });

    // 1. Crear cada chincheta/pin en la posición exacta de cada estado
    this.nodes.forEach((node) => {
      const basePos = new THREE.Vector3(...node.pos);
      const normal = basePos.clone().normalize();

      // Posición de la cabeza de la chincheta (elevada sobre la superficie)
      const pinLength = 0.045;
      const headPos = basePos.clone().add(normal.clone().multiplyScalar(pinLength));
      positionsMap.set(node.id, headPos);

      // Aguja metálica inclinada
      const needleGeom = new THREE.CylinderGeometry(0.002, 0.001, pinLength, 8);
      const needleMesh = new THREE.Mesh(needleGeom, needleMaterial);
      const needleCenter = basePos.clone().add(normal.clone().multiplyScalar(pinLength / 2));
      needleMesh.position.copy(needleCenter);
      needleMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      targetParent.add(needleMesh);

      // Cabeza esférica roja
      const headRadius = node.isBorder ? 0.024 : 0.020;
      const headGeom = new THREE.SphereGeometry(headRadius, 16, 16);
      const headMesh = new THREE.Mesh(headGeom, pinHeadMaterial);
      headMesh.position.copy(headPos);
      targetParent.add(headMesh);
    });

    // 2. Trazar arcos de Cruces Fronterizos (Rojos discontinuos/brillantes hacia San Diego y McAllen)
    const borderLineMaterial = new THREE.LineBasicMaterial({
      color: 0xff3b5c,
      linewidth: 3,
      transparent: true,
      opacity: 0.95
    });

    this.borderConnections.forEach(([fromId, toId]) => {
      const start = positionsMap.get(fromId);
      const end = positionsMap.get(toId);
      if (start && end) {
        this.createCurvedConnection(targetParent, start, end, borderLineMaterial, 0.03);
      }
    });

    // 3. Trazar arcos de la Red Troncal Nacional (Verdes como en el diagrama)
    const nationalLineMaterial = new THREE.LineBasicMaterial({
      color: 0x22c55e,
      linewidth: 2,
      transparent: true,
      opacity: 0.9
    });

    this.nationalConnections.forEach(([fromId, toId]) => {
      const start = positionsMap.get(fromId);
      const end = positionsMap.get(toId);
      if (start && end) {
        this.createCurvedConnection(targetParent, start, end, nationalLineMaterial, 0.02);
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
    const points = curve.getPoints(24);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);
    parent.add(line);
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
      this.camera.position.set(0, 0, 3.5);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  abrirModalInfo(): void {
    this.mostrarModalInfo = true;
  }

  cerrarModalInfo(): void {
    this.mostrarModalInfo = false;
  }

  volverAlInicio(): void {
    this.router.navigate(['/']);
  }

  onQuoteSubmit(): void {
    this.formSubmitted = true;
    if (this.quoteForm.valid) {
      console.log('Cotización solicitada:', this.quoteForm.value);
      this.quoteSuccess = true;
      setTimeout(() => {
        this.quoteSuccess = false;
        this.formSubmitted = false;
        this.quoteForm.reset({
          ciudad: 'Tijuana / San Diego',
          capacidad: '1 Gbps Simétrico'
        });
        this.mostrarModalInfo = false;
      }, 4000);
    }
  }

  contactarWhatsApp(): void {
    if (!this.isBrowser) return;
    const mensaje = encodeURIComponent(
      'Hola, requiero información y cotización sobre Enlaces Dedicados y Cruces Transfronterizos.'
    );
    window.open(`https://wa.me/529999999999?text=${mensaje}`, '_blank');
  }
}
