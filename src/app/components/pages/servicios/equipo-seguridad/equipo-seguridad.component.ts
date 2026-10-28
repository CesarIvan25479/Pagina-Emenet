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

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type BotaColor = 'cafe' | 'verde' | 'negro';
export type GuanteVariante = 'original' | 'totalBlack' | 'rojo';
export type GuanteTalla = 'S' | 'M' | 'L' | 'XL';

@Component({
  selector: 'app-equipo-seguridad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './equipo-seguridad.component.html',
  styleUrl: './equipo-seguridad.component.scss'
})
export class EquipoSeguridadComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('bootCanvas', { static: false }) bootCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bootContainer', { static: false }) bootContainerRef!: ElementRef<HTMLDivElement>;

  @ViewChild('gloveCanvas', { static: false }) gloveCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('gloveContainer', { static: false }) gloveContainerRef!: ElementRef<HTMLDivElement>;

  // Estado de la Bota
  colorBota: BotaColor = 'cafe';
  autoRotateBota = false;
  loadingBota = true;
  loadingProgressBota = 0;

  // Estado del Guante
  varianteGuante: GuanteVariante = 'original';
  tallaGuante: GuanteTalla = 'M';
  autoRotateGuante = false;
  loadingGuante = true;
  loadingProgressGuante = 0;

  // Three.js Bota
  private bootScene!: THREE.Scene;
  private bootCamera!: THREE.PerspectiveCamera;
  private bootRenderer!: THREE.WebGLRenderer;
  private bootControls!: OrbitControls;
  private bootGroup = new THREE.Group();
  private bootMaterials: Record<string, THREE.MeshStandardMaterial> = {};
  private bootLoadedTextures: Record<string, Record<string, THREE.Texture>> = {};
  private bootAnimId: number | null = null;
  private bootResizeObserver: ResizeObserver | null = null;
  private bootStartTime = 0;

  // Three.js Guantes
  private gloveScene!: THREE.Scene;
  private gloveCamera!: THREE.PerspectiveCamera;
  private gloveRenderer!: THREE.WebGLRenderer;
  private gloveControls!: OrbitControls;
  private gloveGroup = new THREE.Group();
  private gloveMaterials: Record<string, THREE.MeshStandardMaterial> = {};
  private gloveLoadedTextures: Record<string, THREE.Texture> = {};
  private gloveAnimId: number | null = null;
  private gloveResizeObserver: ResizeObserver | null = null;
  private gloveStartTime = 0;

  isBrowser = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    // Inicializar ambos visores 3D en Angular Zone outside para rendimiento óptimo
    this.ngZone.runOutsideAngular(() => {
      this.initBootViewer();
      this.initGloveViewer();
    });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;

    // Limpieza Bota
    if (this.bootAnimId !== null) cancelAnimationFrame(this.bootAnimId);
    if (this.bootResizeObserver) this.bootResizeObserver.disconnect();
    if (this.bootControls) this.bootControls.dispose();
    if (this.bootRenderer) {
      this.bootRenderer.dispose();
      this.bootRenderer.forceContextLoss();
    }
    this.disposeHierarchy(this.bootScene);

    // Limpieza Guantes
    if (this.gloveAnimId !== null) cancelAnimationFrame(this.gloveAnimId);
    if (this.gloveResizeObserver) this.gloveResizeObserver.disconnect();
    if (this.gloveControls) this.gloveControls.dispose();
    if (this.gloveRenderer) {
      this.gloveRenderer.dispose();
      this.gloveRenderer.forceContextLoss();
    }
    this.disposeHierarchy(this.gloveScene);
  }

  private disposeHierarchy(obj: THREE.Object3D | null): void {
    if (!obj) return;
    obj.traverse((child: any) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m: any) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  // =========================================================
  // 1. VISOR 3D: BOTAS TÁCTICAS
  // =========================================================
  private initBootViewer(): void {
    const container = this.bootContainerRef?.nativeElement;
    const canvas = this.bootCanvasRef?.nativeElement;
    if (!container || !canvas) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // Escena
    this.bootScene = new THREE.Scene();
    this.bootScene.background = new THREE.Color(0xfcfcfd);

    // Cámara
    this.bootCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.bootCamera.position.copy(this.getBootCamPos(width / height));

    // Renderer
    this.bootRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.bootRenderer.setSize(width, height);
    this.bootRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.bootRenderer.shadowMap.enabled = true;
    this.bootRenderer.shadowMap.type = THREE.PCFShadowMap;
    this.bootRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.bootRenderer.toneMappingExposure = 1.05;

    // Controles orbitales
    this.bootControls = new OrbitControls(this.bootCamera, this.bootRenderer.domElement);
    this.bootControls.enableDamping = true;
    this.bootControls.dampingFactor = 0.05;
    this.bootControls.minDistance = 1.2;
    this.bootControls.maxDistance = 6.0;
    this.bootControls.minPolarAngle = Math.PI / 6;
    this.bootControls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.bootControls.enablePan = false;

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.bootScene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight1.position.set(5, 7, 5);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.camera.near = 0.5;
    dirLight1.shadow.camera.far = 15;
    dirLight1.shadow.camera.left = -2;
    dirLight1.shadow.camera.right = 2;
    dirLight1.shadow.camera.top = 2;
    dirLight1.shadow.camera.bottom = -2;
    dirLight1.shadow.bias = -0.0001;
    this.bootScene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xe2e8f0, 0.4);
    dirLight2.position.set(-4, 3, -3);
    this.bootScene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xf8fafc, 0.3);
    dirLight3.position.set(0, 4, -5);
    this.bootScene.add(dirLight3);

    const spotLight = new THREE.SpotLight(0xffffff, 0.4);
    spotLight.position.set(0, 6, 2);
    spotLight.angle = 0.6;
    spotLight.penumbra = 0.8;
    this.bootScene.add(spotLight);

    // Sombra de contacto en el piso
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const shadowCanvas = this.createContactShadowTexture();
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.66;
    this.bootScene.add(shadowPlane);

    this.bootScene.add(this.bootGroup);

    // Precargar texturas y cargar modelo
    this.loadBootAssets();

    // ResizeObserver
    this.bootResizeObserver = new ResizeObserver(() => {
      if (!container || !this.bootRenderer || !this.bootCamera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      this.bootCamera.aspect = w / h;
      this.bootCamera.updateProjectionMatrix();
      this.bootRenderer.setSize(w, h);
    });
    this.bootResizeObserver.observe(container);

    // Loop de render
    this.bootStartTime = performance.now();
    const animateBoot = () => {
      this.bootAnimId = requestAnimationFrame(animateBoot);
      const elapsed = (performance.now() - this.bootStartTime) * 0.001;

      if (this.autoRotateBota) {
        this.bootGroup.rotation.y += 0.008;
      }
      this.bootGroup.position.y = Math.sin(elapsed * 1.5) * 0.015;

      this.bootControls.update();
      this.bootRenderer.render(this.bootScene, this.bootCamera);
    };
    animateBoot();
  }

  private loadBootAssets(): void {
    const texLoader = new THREE.TextureLoader();

    const loadSet = (colorName: string) => {
      const files: Record<string, string> = {
        boot: `/textures/${colorName}/military-boots_boot_BaseColor.jpg`,
        bootNormal: `/textures/${colorName}/military-boots_boot_Normal.jpg`,
        bootRoughness: `/textures/${colorName}/military-boots_boot_Roughness.jpg`,
        sole: `/textures/${colorName}/military-boots_sole_BaseColor.jpg`,
        soleNormal: `/textures/${colorName}/military-boots_sole_Normal.jpg`,
        soleRoughness: `/textures/${colorName}/military-boots_sole_Roughness.jpg`,
        lace_loops: `/textures/${colorName}/military-boots_lace_loops_BaseColor.jpg`,
        laces: `/textures/${colorName}/military-boots_laces_BaseColor.jpg`,
        tongue: `/textures/${colorName}/military-boots_tongue_BaseColor.jpg`,
      };

      const setObj: Record<string, THREE.Texture> = {};
      Object.entries(files).forEach(([key, url]) => {
        const tex = texLoader.load(url);
        tex.flipY = false;
        tex.colorSpace = key.toLowerCase().includes('normal') || key.toLowerCase().includes('roughness')
          ? THREE.NoColorSpace
          : THREE.SRGBColorSpace;
        setObj[key] = tex;
      });
      return setObj;
    };

    this.bootLoadedTextures['cafe'] = loadSet('cafe');
    this.bootLoadedTextures['verde'] = loadSet('verde');
    this.bootLoadedTextures['negro'] = loadSet('negro');

    // Cargar modelo GLB
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/bota_tactica_duty.glb',
      (gltf) => {
        const root = gltf.scene;
        root.scale.set(5.0, 5.0, 5.0);
        root.rotation.set(0, Math.PI / 4, 0);

        // Centrar geométricamente la bota
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        root.position.x -= center.x;
        root.position.y -= box.min.y;
        root.position.z -= center.z;
        root.position.y -= 0.65;

        root.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              this.bootMaterials[child.material.name] = child.material;
            }
          }
        });

        this.bootGroup.add(root);
        this.applyBootColor(this.colorBota);

        this.ngZone.run(() => {
          this.loadingBota = false;
          this.cdr.detectChanges();
        });
      },
      (xhr) => {
        if (xhr.total > 0) {
          this.ngZone.run(() => {
            this.loadingProgressBota = Math.round((xhr.loaded / xhr.total) * 100);
            this.cdr.detectChanges();
          });
        }
      },
      (err) => {
        console.error('Error cargando modelo bota:', err);
        this.ngZone.run(() => {
          this.loadingBota = false;
          this.cdr.detectChanges();
        });
      }
    );
  }

  private applyBootColor(color: BotaColor): void {
    const activeTex = this.bootLoadedTextures[color];
    if (!activeTex) return;

    const isNegro = color === 'negro';
    const mat = this.bootMaterials;

    // 1. Cuerpo de la bota
    if (mat['boot']) {
      mat['boot'].map = activeTex['boot'];
      mat['boot'].normalMap = activeTex['bootNormal'];
      if (mat['boot'].normalScale) mat['boot'].normalScale.set(1.4, 1.4);
      mat['boot'].roughnessMap = activeTex['bootRoughness'];
      mat['boot'].color.set(isNegro ? '#585b63' : '#ffffff');
      mat['boot'].roughness = isNegro ? 0.65 : 0.70;
      mat['boot'].metalness = 0.0;
      mat['boot'].metalnessMap = null;
      mat['boot'].envMapIntensity = isNegro ? 0.22 : 0.12;
      mat['boot'].needsUpdate = true;
    }

    // 2. Suela
    if (mat['sole']) {
      mat['sole'].map = activeTex['sole'];
      mat['sole'].normalMap = activeTex['soleNormal'];
      if (mat['sole'].normalScale) mat['sole'].normalScale.set(1.2, 1.2);
      mat['sole'].roughnessMap = activeTex['soleRoughness'];
      mat['sole'].color.set(isNegro ? '#42454a' : '#ffffff');
      mat['sole'].roughness = 0.88;
      mat['sole'].metalness = 0.0;
      mat['sole'].metalnessMap = null;
      mat['sole'].envMapIntensity = 0.10;
      mat['sole'].needsUpdate = true;
    }

    // 3. Herrajes y ojillos
    if (mat['lace_loops']) {
      mat['lace_loops'].map = activeTex['lace_loops'];
      mat['lace_loops'].color.set(isNegro ? '#33353a' : '#ffffff');
      mat['lace_loops'].metalness = 0.0;
      mat['lace_loops'].roughness = 0.85;
      mat['lace_loops'].envMapIntensity = 0.12;
      mat['lace_loops'].needsUpdate = true;
    }

    // 4. Agujetas
    if (mat['laces']) {
      mat['laces'].map = activeTex['laces'];
      mat['laces'].color.set(isNegro ? '#3f4247' : '#ffffff');
      mat['laces'].roughness = 0.90;
      mat['laces'].metalness = 0.0;
      mat['laces'].envMapIntensity = 0.08;
      mat['laces'].needsUpdate = true;
    }

    // 5. Lengüeta
    if (mat['tongue']) {
      mat['tongue'].map = activeTex['tongue'];
      mat['tongue'].color.set(isNegro ? '#585b63' : '#ffffff');
      mat['tongue'].roughness = 0.75;
      mat['tongue'].metalness = 0.0;
      mat['tongue'].envMapIntensity = 0.15;
      mat['tongue'].needsUpdate = true;
    }
  }

  // =========================================================
  // 2. VISOR 3D: GUANTES DE PROTECCIÓN EN 388
  // =========================================================
  private initGloveViewer(): void {
    const container = this.gloveContainerRef?.nativeElement;
    const canvas = this.gloveCanvasRef?.nativeElement;
    if (!container || !canvas) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // Escena
    this.gloveScene = new THREE.Scene();
    this.gloveScene.background = new THREE.Color(0xfcfcfd);

    // Cámara
    this.gloveCamera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.gloveCamera.position.copy(this.getGloveCamPos(width / height));

    // Renderer
    this.gloveRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.gloveRenderer.setSize(width, height);
    this.gloveRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.gloveRenderer.shadowMap.enabled = true;
    this.gloveRenderer.shadowMap.type = THREE.PCFShadowMap;
    this.gloveRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.gloveRenderer.toneMappingExposure = 1.05;

    // Controles orbitales
    this.gloveControls = new OrbitControls(this.gloveCamera, this.gloveRenderer.domElement);
    this.gloveControls.enableDamping = true;
    this.gloveControls.dampingFactor = 0.05;
    this.gloveControls.minDistance = 1.5;
    this.gloveControls.maxDistance = 7.0;
    this.gloveControls.minPolarAngle = Math.PI / 6;
    this.gloveControls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.gloveControls.enablePan = false;

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.gloveScene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.95);
    dirLight1.position.set(5, 7, 5);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.camera.near = 0.5;
    dirLight1.shadow.camera.far = 15;
    dirLight1.shadow.camera.left = -2.5;
    dirLight1.shadow.camera.right = 2.5;
    dirLight1.shadow.camera.top = 2.5;
    dirLight1.shadow.camera.bottom = -2.5;
    dirLight1.shadow.bias = -0.0001;
    this.gloveScene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xe2e8f0, 0.4);
    dirLight2.position.set(-4, 3, -3);
    this.gloveScene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xf8fafc, 0.3);
    dirLight3.position.set(0, 4, -5);
    this.gloveScene.add(dirLight3);

    const spotLight = new THREE.SpotLight(0xffffff, 0.45);
    spotLight.position.set(0, 6, 2);
    spotLight.angle = 0.6;
    spotLight.penumbra = 0.8;
    this.gloveScene.add(spotLight);

    // Sombra de contacto
    const shadowGeo = new THREE.PlaneGeometry(4.0, 4.0);
    const shadowCanvas = this.createContactShadowTexture();
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.50,
      depthWrite: false
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.80;
    this.gloveScene.add(shadowPlane);

    this.gloveScene.add(this.gloveGroup);

    // Precargar texturas de guantes y modelo
    this.loadGloveAssets();

    // ResizeObserver
    this.gloveResizeObserver = new ResizeObserver(() => {
      if (!container || !this.gloveRenderer || !this.gloveCamera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      this.gloveCamera.aspect = w / h;
      this.gloveCamera.updateProjectionMatrix();
      this.gloveRenderer.setSize(w, h);
    });
    this.gloveResizeObserver.observe(container);

    // Loop de render
    this.gloveStartTime = performance.now();
    const animateGlove = () => {
      this.gloveAnimId = requestAnimationFrame(animateGlove);
      const elapsed = (performance.now() - this.gloveStartTime) * 0.001;

      if (this.autoRotateGuante) {
        this.gloveGroup.rotation.y += 0.008;
      }
      this.gloveGroup.position.y = Math.sin(elapsed * 1.5) * 0.015;

      this.gloveControls.update();
      this.gloveRenderer.render(this.gloveScene, this.gloveCamera);
    };
    animateGlove();
  }

  private loadGloveAssets(): void {
    const texLoader = new THREE.TextureLoader();
    const files: Record<string, string> = {
      dorso_original: '/textures/guantes/dorso_original.jpg',
      dorso_totalBlack: '/textures/guantes/dorso_totalBlack.jpg',
      dorso_gris: '/textures/guantes/dorso_gris.jpg',
      dorso_rojo: '/textures/guantes/dorso_rojo.jpg',
      dorsoL_original: '/textures/guantes/dorso_original_L.jpg',
      dorsoL_totalBlack: '/textures/guantes/dorso_totalBlack_L.jpg',
      dorsoL_gris: '/textures/guantes/dorso_gris_L.jpg',
      dorsoL_rojo: '/textures/guantes/dorso_rojo_L.jpg',
      palma_original: '/textures/guantes/palma_original.jpg',
      palma_totalBlack: '/textures/guantes/palma_totalBlack.jpg',
      palma_gris: '/textures/guantes/palma_gris.jpg',
      palma_rojo: '/textures/guantes/palma_rojo.jpg',
      normal: '/textures/guantes/glove_Normal.jpg'
    };

    Object.entries(files).forEach(([key, url]) => {
      const tex = texLoader.load(url);
      tex.flipY = false;
      tex.anisotropy = 8;
      if (key !== 'normal') tex.colorSpace = THREE.SRGBColorSpace;
      this.gloveLoadedTextures[key] = tex;
    });

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/guantes_industriales_en388.glb',
      (gltf) => {
        const root = gltf.scene;
        root.scale.set(0.5, 0.5, 0.5);

        // Centrar geométricamente
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        root.position.x -= center.x;
        root.position.y -= center.y;
        root.position.z -= center.z;

        root.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              this.gloveMaterials[child.material.name] = child.material;
            }
          }
        });

        this.gloveGroup.add(root);
        this.applyGloveVariant(this.varianteGuante);

        this.ngZone.run(() => {
          this.loadingGuante = false;
          this.cdr.detectChanges();
        });
      },
      (xhr) => {
        if (xhr.total > 0) {
          this.ngZone.run(() => {
            this.loadingProgressGuante = Math.round((xhr.loaded / xhr.total) * 100);
            this.cdr.detectChanges();
          });
        }
      },
      (err) => {
        console.error('Error cargando modelo guantes:', err);
        this.ngZone.run(() => {
          this.loadingGuante = false;
          this.cdr.detectChanges();
        });
      }
    );
  }

  private applyGloveVariant(v: GuanteVariante): void {
    const mat = this.gloveMaterials;
    const tex = this.gloveLoadedTextures;
    const normalTex = tex['normal'];

    const setMat = (m: THREE.MeshStandardMaterial | undefined, mapTex: THREE.Texture, rough: number) => {
      if (!m) return;
      m.map = mapTex;
      if (normalTex) m.normalMap = normalTex;
      if (m.normalScale) m.normalScale.set(0.8, 0.8);
      m.metalness = 0.0;
      m.roughness = rough;
      m.color.set('#ffffff');
      m.envMapIntensity = 0.2;
      m.needsUpdate = true;
    };

    setMat(mat['Dorso'], tex[`dorso_${v}`], 0.90);
    setMat(mat['DorsoL'], tex[`dorsoL_${v}`], 0.90);
    setMat(mat['Palma'], tex[`palma_${v}`], 0.65);
  }

  // En pantallas verticales (móvil) se aleja la cámara para que el modelo quepa completo
  private getBootCamPos(aspect: number): THREE.Vector3 {
    const k = aspect < 1 ? Math.min(1.9, 1 / Math.max(aspect, 0.5)) : 1;
    return new THREE.Vector3(0, 0.4 * k, 2.2 * k);
  }

  private getGloveCamPos(aspect: number): THREE.Vector3 {
    const k = aspect < 1 ? Math.min(1.7, 1 / Math.max(aspect, 0.55)) : 1;
    return new THREE.Vector3(0, 0.2 * k, 3.2 * k);
  }

  // Generador procedural de textura de sombra suave circular
  private createContactShadowTexture(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, 'rgba(20, 20, 22, 0.85)');
      gradient.addColorStop(0.3, 'rgba(30, 30, 35, 0.5)');
      gradient.addColorStop(0.7, 'rgba(40, 40, 45, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
    return canvas;
  }

  // =========================================================
  // MÉTODOS PÚBLICOS DE INTERACCIÓN (UI)
  // =========================================================

  cambiarColorBota(color: BotaColor): void {
    this.colorBota = color;
    this.applyBootColor(color);
  }

  toggleAutoRotateBota(): void {
    this.autoRotateBota = !this.autoRotateBota;
  }

  resetBootCamera(): void {
    if (this.bootControls) {
      this.bootControls.reset();
      this.bootCamera.position.copy(this.getBootCamPos(this.bootCamera.aspect));
      this.bootControls.update();
    }
  }

  descargarCapturaBota(): void {
    const canvas = this.bootCanvasRef?.nativeElement;
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.setAttribute('download', `bota_tactica_duty_${this.colorBota}.png`);
    a.setAttribute('href', image);
    a.click();
  }

  cambiarVarianteGuante(v: GuanteVariante): void {
    this.varianteGuante = v;
    this.applyGloveVariant(v);
  }

  cambiarTallaGuante(talla: GuanteTalla): void {
    this.tallaGuante = talla;
  }

  toggleAutoRotateGuante(): void {
    this.autoRotateGuante = !this.autoRotateGuante;
  }

  resetGloveCamera(): void {
    if (this.gloveControls) {
      this.gloveControls.reset();
      this.gloveCamera.position.copy(this.getGloveCamPos(this.gloveCamera.aspect));
      this.gloveControls.update();
    }
  }

  descargarCapturaGuante(): void {
    const canvas = this.gloveCanvasRef?.nativeElement;
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.setAttribute('download', `guantes_en388_${this.varianteGuante}.png`);
    a.setAttribute('href', image);
    a.click();
  }

  scrollToSeccion(id: string): void {
    if (!this.isBrowser) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  volverAlInicio(): void {
    this.router.navigate(['/']);
  }
}
