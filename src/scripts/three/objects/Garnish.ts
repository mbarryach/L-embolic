import {
  DoubleSide,
  Euler,
  Group,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
  type Texture,
} from 'three';
import { createCitrusTexture, createLeafTexture } from '../materials/textures';

interface Floater {
  readonly orbit: number;
  readonly height: number;
  readonly speed: number;
  readonly tilt: number;
  readonly scale: number;
  readonly phase: number;
}

interface Swarm {
  readonly mesh: InstancedMesh;
  readonly items: Floater[];
}

/**
 * Rodajas de citrico y hojas de menta.
 *
 * Son planos con una textura dibujada a mano en canvas, no geometria de
 * verdad. Ilusion 2.5D pura: a este tamaño en pantalla nadie distingue una
 * rodaja modelada de una pintada, y cuesta la centesima parte.
 *
 * Dos InstancedMesh, dos draw calls, y quince cosas flotando.
 */
export class Garnish {
  readonly group = new Group();
  private readonly swarms: Swarm[] = [];
  private readonly textures: Texture[] = [];

  private readonly matrix = new Matrix4();
  private readonly position = new Vector3();
  private readonly quaternion = new Quaternion();
  private readonly scale = new Vector3();
  private readonly euler = new Euler();

  constructor(citrusCount: number, leafCount: number) {
    this.addSwarm(createCitrusTexture('#e8b94a'), citrusCount, 0.32, 0);
    this.addSwarm(createLeafTexture('#8fbf9f'), leafCount, 0.2, 1.7);
  }

  private addSwarm(texture: Texture | null, count: number, size: number, seed: number): void {
    if (!texture || count <= 0) return;
    this.textures.push(texture);

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      opacity: 0.92,
    });

    const mesh = new InstancedMesh(new PlaneGeometry(size, size), material, count);
    mesh.frustumCulled = false;

    const items: Floater[] = [];
    for (let i = 0; i < count; i += 1) {
      items.push({
        orbit: 0.55 + (i % 4) * 0.28,
        height: -0.5 + ((i * 0.37 + seed) % 1.6),
        speed: 0.12 + (i % 5) * 0.045,
        tilt: (i % 7) * 0.42 + seed,
        scale: 0.75 + (i % 4) * 0.22,
        phase: i * 1.31 + seed,
      });
    }

    this.swarms.push({ mesh, items });
    this.group.add(mesh);
  }

  /**
   * `spread` abre la orbita con el scroll: al principio los ingredientes
   * rondan la copa y al final cruzan la pantalla por delante y por detras.
   */
  write(spread: number, elapsed: number): void {
    for (const swarm of this.swarms) {
      for (let i = 0; i < swarm.items.length; i += 1) {
        const item = swarm.items[i];
        if (!item) continue;

        const angle = item.phase + elapsed * item.speed;
        const radius = item.orbit * (1 + spread * 2.4);

        this.position.set(
          Math.cos(angle) * radius,
          item.height + Math.sin(elapsed * 0.4 + item.phase) * 0.09 + spread * 0.5,
          Math.sin(angle) * radius * 0.7,
        );

        this.euler.set(
          item.tilt + elapsed * 0.18,
          angle * 0.6,
          Math.sin(elapsed * 0.3 + item.phase) * 0.5,
        );
        this.quaternion.setFromEuler(this.euler);
        this.scale.setScalar(item.scale);

        this.matrix.compose(this.position, this.quaternion, this.scale);
        swarm.mesh.setMatrixAt(i, this.matrix);
      }
      swarm.mesh.instanceMatrix.needsUpdate = true;
    }
  }
}
