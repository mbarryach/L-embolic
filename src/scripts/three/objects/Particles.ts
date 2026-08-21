import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Points,
  PointsMaterial,
  type Texture,
} from 'three';
import { createSparkTexture } from '../materials/textures';
import { lerp } from '../../utils/math';

const FIELD_RADIUS = 7;

/**
 * El polvo del bar: motas en suspension a contraluz.
 *
 * Un unico Points con su atributo de posiciones. Al final de la pagina las
 * motas se van juntando hacia el centro, detras del rotulo — de ahi que el
 * cierre parezca que el nombre se recompone solo.
 */
export class Particles {
  readonly points: Points;
  private readonly texture: Texture | null;
  private readonly scattered: Float32Array;
  private readonly gathered: Float32Array;
  private readonly positions: Float32Array;
  private readonly count: number;
  private lastGather = -1;

  constructor(count: number) {
    this.count = count;
    this.scattered = new Float32Array(count * 3);
    this.gathered = new Float32Array(count * 3);
    this.positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      // Disposicion dispersa: esfera irregular alrededor de la camara.
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = FIELD_RADIUS * (0.35 + Math.random() * 0.65);
      this.scattered[i3] = Math.sin(phi) * Math.cos(theta) * radius;
      this.scattered[i3 + 1] = Math.cos(phi) * radius * 0.55;
      this.scattered[i3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;

      // Disposicion recogida: un nucleo apretado en el centro.
      const gatherRadius = 0.45 + Math.random() * 0.9;
      this.gathered[i3] = (Math.random() - 0.5) * gatherRadius * 3;
      this.gathered[i3 + 1] = (Math.random() - 0.5) * gatherRadius * 1.4;
      this.gathered[i3 + 2] = (Math.random() - 0.5) * gatherRadius * 2;

      this.positions[i3] = this.scattered[i3] ?? 0;
      this.positions[i3 + 1] = this.scattered[i3 + 1] ?? 0;
      this.positions[i3 + 2] = this.scattered[i3 + 2] ?? 0;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(this.positions, 3));

    this.texture = createSparkTexture();
    const material = new PointsMaterial({
      size: 0.055,
      sizeAttenuation: true,
      color: '#f2e9dc',
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    if (this.texture) material.map = this.texture;

    this.points = new Points(geometry, material);
    this.points.frustumCulled = false;
  }

  /**
   * `gather` va de 0 (disperso) a 1 (nucleo). Solo se reescribe el buffer
   * si el valor ha cambiado de verdad: mover 320 puntos cada frame cuando
   * nadie ha tocado el scroll es trabajo tirado.
   */
  write(gather: number): void {
    if (Math.abs(gather - this.lastGather) < 0.002) return;
    this.lastGather = gather;

    for (let i = 0; i < this.count * 3; i += 1) {
      this.positions[i] = lerp(this.scattered[i] ?? 0, this.gathered[i] ?? 0, gather);
    }
    const attribute = this.points.geometry.getAttribute('position');
    attribute.needsUpdate = true;
  }
}
