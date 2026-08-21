import { Euler, InstancedMesh, LatheGeometry, Matrix4, Quaternion, Vector2, Vector3 } from 'three';
import { createNeonMaterial } from '../materials/neonMaterial';

/** Silueta de botella. Otra vez el truco del torno: perfil girado y listo. */
const BOTTLE_PROFILE: readonly [number, number][] = [
  [0, -0.62],
  [0.24, -0.62],
  [0.26, -0.56],
  [0.26, 0.1],
  [0.22, 0.24],
  [0.11, 0.36],
  [0.085, 0.62],
  [0.1, 0.68],
  [0.075, 0.7],
];

interface Placement {
  readonly position: Vector3;
  readonly spin: number;
  readonly scale: number;
}

const PLACEMENTS: readonly Placement[] = [
  { position: new Vector3(-2.6, -0.4, -3.1), spin: 0.055, scale: 1.05 },
  { position: new Vector3(2.7, -0.3, -3.8), spin: -0.042, scale: 1.2 },
  { position: new Vector3(-1.7, -0.6, -5.2), spin: 0.031, scale: 0.9 },
  { position: new Vector3(-3.25, 0.82, -4.4), spin: -0.026, scale: 0.82 },
  { position: new Vector3(-0.7, 0.74, -4.8), spin: 0.038, scale: 1.08 },
  { position: new Vector3(1.55, 0.86, -4.2), spin: -0.033, scale: 0.92 },
  { position: new Vector3(3.35, 0.76, -5.4), spin: 0.024, scale: 0.78 },
];

/**
 * Las botellas del fondo. Giran despacio, muy despacio, lo justo para que
 * la estanteria no parezca una foto pegada. Solo aparecen en equipos que
 * pueden con ellas — en gama baja ni se crean.
 */
export class Bottles {
  readonly mesh: InstancedMesh;

  private readonly matrix = new Matrix4();
  private readonly quaternion = new Quaternion();
  private readonly scale = new Vector3();
  private readonly euler = new Euler();

  constructor() {
    const geometry = new LatheGeometry(
      BOTTLE_PROFILE.map(([x, y]) => new Vector2(x, y)),
      26,
    );
    // Muy bajitas de tono: son la estanteria del fondo, no las
    // protagonistas. Si se ven demasiado le roban el sitio al texto.
    const material = createNeonMaterial({
      color: '#21494b',
      rim: '#76c8c4',
      opacity: 0.045,
      rimPower: 4.2,
      glow: 0.5,
    });

    this.mesh = new InstancedMesh(geometry, material, PLACEMENTS.length);
    this.mesh.frustumCulled = false;
    this.write(0);
  }

  write(elapsed: number): void {
    for (let i = 0; i < PLACEMENTS.length; i += 1) {
      const placement = PLACEMENTS[i];
      if (!placement) continue;

      this.euler.set(0, elapsed * placement.spin, 0);
      this.quaternion.setFromEuler(this.euler);
      this.scale.setScalar(placement.scale);
      this.matrix.compose(placement.position, this.quaternion, this.scale);
      this.mesh.setMatrixAt(i, this.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
