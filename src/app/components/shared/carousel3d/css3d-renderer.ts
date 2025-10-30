import * as THREE from 'three';

export class CSS3DObject extends THREE.Object3D {
  element: HTMLElement;
  constructor(element: HTMLElement) {
    super();
    this.element = element;
    this.element.style.position = 'absolute';
    this.element.style.transformStyle = 'preserve-3d';
  }
}

export class CSS3DRenderer {
  domElement: HTMLElement;
  private camera: THREE.Camera;
  private width: number = 0;
  private height: number = 0;
  private widthHalf: number = 0;
  private heightHalf: number = 0;
  private matrix = new THREE.Matrix4();
  private matrix2 = new THREE.Matrix4();
  private vector = new THREE.Vector3();
  private viewMatrix = new THREE.Matrix4();
  private viewProjectionMatrix = new THREE.Matrix4();
  private cache = {
    camera: { fov: 0, style: '' },
    objects: new WeakMap(),
  };

  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.style.overflow = 'hidden';
    this.domElement.style.pointerEvents = 'none';
    this.camera = new THREE.PerspectiveCamera(50, 1, 1, 5000);
  }

  setSize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.widthHalf = width / 2;
    this.heightHalf = height / 2;
    this.domElement.style.width = width + 'px';
    this.domElement.style.height = height + 'px';
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    if (!(camera instanceof THREE.PerspectiveCamera)) {
      console.error('CSS3DRenderer: Only PerspectiveCamera is supported.');
      return;
    }
    
    // Store camera reference
    this.camera = camera;

    const fov = camera.projectionMatrix.elements[5] * this.heightHalf;

    if (this.cache.camera.fov !== fov) {
      this.domElement.style.perspective = fov + 'px';
      this.cache.camera.fov = fov;
    }

    this.viewMatrix.copy(camera.matrixWorldInverse);
    this.viewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      this.viewMatrix
    );

    this.renderObject(scene, scene);
  }

  private renderObject(object: THREE.Object3D, scene: THREE.Scene) {
    if (object instanceof CSS3DObject) {
      object.matrixWorld.decompose(
        this.vector,
        new THREE.Quaternion(),
        new THREE.Vector3()
      );

      const element = object.element;
      const style = this.getObjectCSSMatrix(object.matrixWorld);

      if (element.style.transform !== style) {
        element.style.transform = style;
      }

      if (element.parentNode !== this.domElement) {
        this.domElement.appendChild(element);
      }
    } else if (object instanceof THREE.Scene) {
      // Use the perspective camera's near value if available
      const near = (this.camera as THREE.PerspectiveCamera).near || 1;
      this.domElement.style.transform = `translateZ(${near}px)`;
    }

    for (let i = 0, l = object.children.length; i < l; i++) {
      this.renderObject(object.children[i], scene);
    }
  }

  private getObjectCSSMatrix(matrix: THREE.Matrix4) {
    const elements = matrix.elements;
    const matrix3d = 'matrix3d(' +
      this.fixed(elements[0]) + ',' +
      this.fixed(elements[1]) + ',' +
      this.fixed(elements[2]) + ',' +
      this.fixed(elements[3]) + ',' +
      this.fixed(elements[4]) + ',' +
      this.fixed(elements[5]) + ',' +
      this.fixed(elements[6]) + ',' +
      this.fixed(elements[7]) + ',' +
      this.fixed(elements[8]) + ',' +
      this.fixed(elements[9]) + ',' +
      this.fixed(elements[10]) + ',' +
      this.fixed(elements[11]) + ',' +
      this.fixed(elements[12]) + ',' +
      this.fixed(elements[13]) + ',' +
      this.fixed(elements[14]) + ',' +
      this.fixed(elements[15]) + ')';

    return 'translate(-50%,-50%)' + matrix3d;
  }

  private fixed(num: number) {
    return parseFloat(num.toFixed(6));
  }
}
