import { AdditiveBlending, Color, Group, Mesh, MeshBasicMaterial, TorusGeometry } from 'three';

interface Ring {
  readonly mesh: Mesh;
  readonly material: MeshBasicMaterial;
  readonly speed: number;
  readonly offset: number;
}

/**
 * Los aros de neon del fondo. No dibujan nada reconocible a proposito: son
 * el resplandor de un rotulo que queda fuera de plano, como cuando entras
 * en un bar y ves el reflejo antes que el cartel.
 *
 * Aqui es donde mas se nota el color del coctel en foco.
 */
export class NeonSign {
  readonly group = new Group();
  private readonly rings: Ring[] = [];

  constructor() {
    // Arcos, no circulos cerrados. Un aro entero detras del titular parece
    // una diana y canta a fondo generico; un tubo abierto parece neon.
    this.addRing(1.85, 0.009, 0.5, 0.055, Math.PI * 1.25, 0.4);
    this.addRing(2.8, 0.006, 0.28, -0.035, Math.PI * 0.8, 2.5);
  }

  private addRing(
    radius: number,
    tube: number,
    opacity: number,
    speed: number,
    arc: number,
    offset: number,
  ): void {
    const material = new MeshBasicMaterial({
      color: new Color('#76c8c4'),
      transparent: true,
      opacity,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const mesh = new Mesh(new TorusGeometry(radius, tube, 5, 72, arc), material);
    mesh.position.z = -2.4;
    mesh.rotation.z = offset;
    mesh.frustumCulled = false;
    this.rings.push({ mesh, material, speed, offset });
    this.group.add(mesh);
  }

  write(elapsed: number): void {
    for (const ring of this.rings) {
      ring.mesh.rotation.z = ring.offset + elapsed * ring.speed;
      ring.mesh.rotation.x = Math.sin(elapsed * 0.12) * 0.14;
    }
  }

  /** Tinte comun de los aros. Lo llama World cuando cambia el acento. */
  tint(color: Color): void {
    for (const ring of this.rings) ring.material.color.copy(color);
  }
}
