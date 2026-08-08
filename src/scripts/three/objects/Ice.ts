import { Euler, IcosahedronGeometry, InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import { createNeonMaterial } from '../materials/neonMaterial';

/** Estado inicial de cada cubito. Se calcula una vez y no se vuelve a tocar. */
interface Shard {
  readonly base: Vector3;
  readonly drift: Vector3;
  readonly spin: Vector3;
  readonly scale: number;
  readonly phase: number;
}

/**
 * El hielo. Icosaedros sin subdividir, o sea con las caras planas — que es
 * justo como se rompe el hielo de verdad, asi que nos ahorramos el trabajo.
 *
 * Todo va en un InstancedMesh: dieciseis cubitos, UNA sola draw call.
 */
export class Ice {
  readonly mesh: InstancedMesh;
  private readonly shards: Shard[] = [];

  // Objetos reutilizados en el bucle. Crear un Vector3 nuevo por cubito y
  // por frame es como pedirle al recolector de basura que venga a molestar.
  private readonly matrix = new Matrix4();
  private readonly position = new Vector3();
  private readonly quaternion = new Quaternion();
  private readonly scale = new Vector3();
  private readonly euler = new Euler();

  constructor(count: number) {
    const geometry = new IcosahedronGeometry(0.082, 0);
    const material = createNeonMaterial({
      color: '#cfeff5',
      rim: '#ffffff',
      opacity: 0.1,
      rimPower: 2.4,
      glow: 1.1,
      additive: true,
    });

    this.mesh = new InstancedMesh(geometry, material, count);
    this.mesh.frustumCulled = false;

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 * 1.618;
      const radius = 0.26 + (i % 4) * 0.14;
      this.shards.push({
        base: new Vector3(
          Math.cos(angle) * radius,
          0.34 + (i % 5) * 0.13,
          Math.sin(angle) * radius,
        ),
        drift: new Vector3(Math.cos(angle) * 2.6, 0.6 + (i % 3) * 0.5, Math.sin(angle) * 2.2),
        spin: new Vector3(0.25 + (i % 3) * 0.12, 0.4 + (i % 4) * 0.1, 0.18),
        scale: 0.72 + (i % 5) * 0.16,
        phase: i * 0.83,
      });
    }

    this.write(0, 0);
  }

  /**
   * `spread` va de 0 (todo apretado dentro de la copa) a 1 (el hielo se ha
   * ido a tomar el aire por toda la escena). Lo mueve el scroll.
   */
  write(spread: number, elapsed: number): void {
    for (let i = 0; i < this.shards.length; i += 1) {
      const shard = this.shards[i];
      if (!shard) continue;

      this.position.copy(shard.base).addScaledVector(shard.drift, spread);
      this.position.y += Math.sin(elapsed * 0.5 + shard.phase) * 0.018;

      this.euler.set(
        elapsed * shard.spin.x + shard.phase,
        elapsed * shard.spin.y,
        elapsed * shard.spin.z,
      );
      this.quaternion.setFromEuler(this.euler);
      this.scale.setScalar(shard.scale);

      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.mesh.setMatrixAt(i, this.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
