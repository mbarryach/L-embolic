import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  TorusGeometry,
} from 'three';

interface Halo {
  readonly mesh: Mesh;
  readonly material: MeshBasicMaterial;
  readonly speed: number;
  readonly phase: number;
}

export class BarArchitecture {
  readonly group = new Group();
  private readonly halos: Halo[] = [];

  constructor() {
    this.group.position.set(0, 0.08, -3.7);

    const shelfMaterial = new MeshBasicMaterial({
      color: new Color('#c9a96b'),
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const shelfGeometry = new BoxGeometry(7.2, 0.018, 0.08);

    for (const y of [-1.3, -0.08, 1.18]) {
      const shelf = new Mesh(shelfGeometry, shelfMaterial);
      shelf.position.y = y;
      shelf.frustumCulled = false;
      this.group.add(shelf);
    }

    const mullionMaterial = new MeshBasicMaterial({
      color: new Color('#f5efe5'),
      transparent: true,
      opacity: 0.028,
      depthWrite: false,
    });
    const mullionGeometry = new BoxGeometry(0.014, 4.4, 0.014);
    for (const x of [-3.3, -1.65, 0, 1.65, 3.3]) {
      const mullion = new Mesh(mullionGeometry, mullionMaterial);
      mullion.position.x = x;
      mullion.frustumCulled = false;
      this.group.add(mullion);
    }

    this.addHalo(3.35, 0.012, 0.2, 0.035, 0.2, -0.2);
    this.addHalo(4.65, 0.008, 0.11, -0.022, 1.8, -0.6);
  }

  private addHalo(
    radius: number,
    tube: number,
    opacity: number,
    speed: number,
    phase: number,
    z: number,
  ): void {
    const material = new MeshBasicMaterial({
      color: new Color('#76c8c4'),
      transparent: true,
      opacity,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const mesh = new Mesh(new TorusGeometry(radius, tube, 4, 96, Math.PI * 1.62), material);
    mesh.position.z = z;
    mesh.rotation.set(0.18, 0.12, phase);
    mesh.frustumCulled = false;
    this.halos.push({ mesh, material, speed, phase });
    this.group.add(mesh);
  }

  write(progress: number, elapsed: number): void {
    this.group.rotation.y = Math.sin(elapsed * 0.08) * 0.035 + (progress - 0.5) * 0.08;
    this.group.position.y = 0.08 + Math.sin(elapsed * 0.12) * 0.035 - progress * 0.12;

    for (const halo of this.halos) {
      halo.mesh.rotation.z = halo.phase + elapsed * halo.speed + progress * 0.4;
      halo.mesh.rotation.x = 0.18 + Math.sin(elapsed * 0.1 + halo.phase) * 0.08;
    }
  }

  tint(color: Color): void {
    for (const halo of this.halos) halo.material.color.copy(color);
  }
}
