import { PerspectiveCamera, Vector3 } from 'three';
import { clamp, damp, progressBetween } from '../utils/math';
import type { PointerState, ViewportSize } from '../types';

interface CameraKey {
  readonly at: number;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

/**
 * El recorrido de camara, escena a escena. El scroll no mueve la pagina
 * sobre la escena: mueve la camara DENTRO de ella, que es lo que hace que
 * todo parezca el mismo sitio y no seis secciones apiladas.
 *
 *  0.00  hero      — de frente y cerca, la copa llena el encuadre
 *  0.16  marquesina— empieza a retirarse, la escena se abre
 *  0.34  qui som   — se va a la derecha para dejar sitio al texto
 *  0.58  la carta  — atras del todo, aparecen las botellas y hay profundidad
 *  0.82  on som    — casi todo en la niebla, solo quedan motas
 *  1.00  outro     — vuelve al centro y se acerca al nucleo de particulas
 */
const KEYS: readonly CameraKey[] = [
  { at: 0, position: [0.55, 0.05, 5.1], target: [0.75, -0.28, 0] },
  { at: 0.16, position: [1.2, 0.5, 6.1], target: [0.35, -0.1, 0] },
  { at: 0.34, position: [2.5, 0.24, 5.3], target: [1.15, -0.05, 0] },
  { at: 0.58, position: [0.4, -0.32, 8.2], target: [0.2, -0.15, 0] },
  { at: 0.82, position: [-1.1, 0.28, 9.8], target: [-0.1, 0.08, 0] },
  { at: 1, position: [0, 0.1, 5.4], target: [0, 0, 0] },
];

/** Cuanto se deja llevar la camara por el raton. Poquisimo, y a proposito. */
const POINTER_INFLUENCE = 0.24;
const POINTER_SMOOTHING = 2.6;

/** Campo de vision. Mas abierto en vertical, que si no no cabe nada. */
const FOV_WIDE = 38;
const FOV_TALL = 60;

export class Camera {
  readonly instance: PerspectiveCamera;

  // Vectores reutilizados: ni uno nuevo por frame.
  private readonly position = new Vector3();
  private readonly target = new Vector3();
  private readonly pointer = { x: 0, y: 0 };
  private readonly pointerTarget = { x: 0, y: 0 };

  constructor(size: ViewportSize) {
    this.instance = new PerspectiveCamera(FOV_WIDE, size.aspect, 0.1, 40);
    // Se llama ya en el constructor: si solo se ajustase en el resize, el
    // primer frame en movil saldria con el campo de vision de escritorio y
    // la copa ocuparia la pantalla entera hasta que alguien girase el movil.
    this.resize(size);
    this.apply(0, 0);
  }

  setPointer(pointer: PointerState): void {
    this.pointerTarget.x = pointer.x;
    this.pointerTarget.y = pointer.y;
  }

  resize(size: ViewportSize): void {
    this.instance.aspect = size.aspect;
    // En pantallas altas y estrechas se abre el campo de vision, si no la
    // copa se sale por los lados y el movil se queda mirando un trozo.
    this.instance.fov = size.aspect < 0.9 ? FOV_TALL : FOV_WIDE;
    this.instance.updateProjectionMatrix();
  }

  /** Interpola entre las claves y aplica el parallax del raton. */
  apply(progress: number, delta: number): void {
    const p = clamp(progress, 0, 1);

    let from = KEYS[0];
    let to = KEYS[KEYS.length - 1];
    for (let i = 0; i < KEYS.length - 1; i += 1) {
      const current = KEYS[i];
      const next = KEYS[i + 1];
      if (!current || !next) continue;
      if (p >= current.at && p <= next.at) {
        from = current;
        to = next;
        break;
      }
    }
    if (!from || !to) return;

    const local = smoothstep(progressBetween(p, from.at, to.at));

    this.position.set(
      mix(from.position[0], to.position[0], local),
      mix(from.position[1], to.position[1], local),
      mix(from.position[2], to.position[2], local),
    );
    this.target.set(
      mix(from.target[0], to.target[0], local),
      mix(from.target[1], to.target[1], local),
      mix(from.target[2], to.target[2], local),
    );

    this.pointer.x = damp(this.pointer.x, this.pointerTarget.x, POINTER_SMOOTHING, delta);
    this.pointer.y = damp(this.pointer.y, this.pointerTarget.y, POINTER_SMOOTHING, delta);

    this.position.x += this.pointer.x * POINTER_INFLUENCE;
    this.position.y -= this.pointer.y * POINTER_INFLUENCE * 0.6;

    this.instance.position.copy(this.position);
    this.instance.lookAt(this.target);
  }
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Suaviza los extremos: sin esto se nota el cambio de clave a clave. */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
