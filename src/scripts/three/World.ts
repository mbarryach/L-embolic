import { Color, FogExp2, Group, Scene } from 'three';
import type { QualityProfile } from '../types';
import { clamp, damp, progressBetween } from '../utils/math';
import { disposeObject } from './dispose';
import { setRimColor } from './materials/neonMaterial';
import { Bottles } from './objects/Bottles';
import { Garnish } from './objects/Garnish';
import { Glass } from './objects/Glass';
import { Ice } from './objects/Ice';
import { NeonSign } from './objects/NeonSign';
import { Particles } from './objects/Particles';

const ACCENT_SMOOTHING = 3.2;

/**
 * Sitio de reposo del escenario. Descentrado a mano, no por accidente.
 *
 * En apaisado la copa se va a la derecha y el rotulo se queda con la
 * izquierda entera. En vertical no hay sitio para ese juego, asi que se
 * centra y el rotulo se apoya encima. Dos composiciones, no una encogida.
 */
const HOME_WIDE = { x: 0.95, y: -0.42, scale: 1 } as const;
const HOME_TALL = { x: 0.12, y: -0.78, scale: 0.72 } as const;

/**
 * Todo lo que hay dentro de la escena y como se comporta segun el scroll.
 *
 * El guion, en una linea: al principio esta todo ordenado dentro de la copa;
 * segun se baja, el hielo y los ingredientes se van soltando y la escena se
 * complica; al final las motas vuelven a juntarse detras del rotulo.
 * "Organized chaos" — se desmonta, pero se desmonta con criterio.
 */
export class World {
  readonly scene = new Scene();
  private readonly stage = new Group();
  private readonly glass: Glass;
  private readonly ice: Ice;
  private readonly garnish: Garnish;
  private readonly neon: NeonSign;
  private readonly particles: Particles;
  private readonly bottles: Bottles | null;

  private readonly accent = new Color('#4dd9e8');
  private readonly accentTarget = new Color('#4dd9e8');
  private home: { x: number; y: number; scale: number } = HOME_WIDE;

  constructor(quality: QualityProfile, aspect: number) {
    this.home = aspect < 0.9 ? HOME_TALL : HOME_WIDE;

    // Niebla exponencial: lo que se aleja se disuelve en el color del fondo
    // en vez de recortarse contra el. Es medio truco de profundidad y medio
    // excusa para no dibujar nada mas alla de cierta distancia.
    this.scene.fog = new FogExp2(0x0c0b0f, 0.085);

    this.glass = new Glass();
    this.ice = new Ice(quality.iceCount);
    this.garnish = new Garnish(quality.citrusCount, quality.leafCount);
    this.neon = new NeonSign();
    this.particles = new Particles(quality.particleCount);
    this.bottles = quality.bottles ? new Bottles() : null;

    this.stage.add(this.glass.group, this.ice.mesh, this.garnish.group);
    if (this.bottles) this.stage.add(this.bottles.mesh);
    this.stage.position.set(this.home.x, 0, 0);
    this.glass.group.position.y = this.home.y;

    this.scene.add(this.neon.group, this.stage, this.particles.points);
  }

  /** Al cambiar de forma la ventana, cambia la composicion. */
  setAspect(aspect: number): void {
    this.home = aspect < 0.9 ? HOME_TALL : HOME_WIDE;
  }

  /** El color del coctel en foco. La escena lo alcanza poco a poco. */
  setAccent(css: string): void {
    try {
      this.accentTarget.set(css);
    } catch {
      // Si el CSS trae algo que Three no sabe leer, nos quedamos como estamos.
    }
  }

  update(progress: number, elapsed: number, delta: number): void {
    const p = clamp(progress, 0, 1);

    // Cuanto se ha desmontado la copa. Arranca en el hero y llega al maximo
    // justo antes de la carta.
    const spread = progressBetween(p, 0.08, 0.6);
    // Cuanto se recogen las motas al final.
    const gather = progressBetween(p, 0.86, 1);
    // El cierre: la copa y las botellas se van al fondo y se las come la
    // niebla, para que el ultimo plano sea solo el rotulo y el polvo.
    const exit = progressBetween(p, 0.76, 0.97);

    this.ice.write(spread, elapsed);
    this.garnish.write(spread, elapsed);
    this.particles.write(gather);
    this.neon.write(elapsed);
    this.bottles?.write(elapsed);

    // La copa gira despacio siempre, y se inclina y se hunde a medida que
    // el resto se le escapa.
    this.glass.group.rotation.y = elapsed * 0.11;
    this.glass.group.rotation.z = spread * 0.34;
    this.glass.group.position.y = this.home.y - spread * 0.55;
    this.glass.group.scale.setScalar(this.home.scale * (1 - spread * 0.18));

    // El escenario no esta centrado: vive a la derecha y un poco por debajo
    // para que el rotulo tenga su propio hueco. Si la copa se pone en medio
    // se come el titular, y el titular es el que manda en el hero.
    this.stage.position.x = this.home.x - spread * 0.5;
    this.stage.position.z = -exit * 9;
    this.stage.rotation.y = spread * 0.22;

    this.accent.r = damp(this.accent.r, this.accentTarget.r, ACCENT_SMOOTHING, delta);
    this.accent.g = damp(this.accent.g, this.accentTarget.g, ACCENT_SMOOTHING, delta);
    this.accent.b = damp(this.accent.b, this.accentTarget.b, ACCENT_SMOOTHING, delta);

    this.neon.tint(this.accent);
    setRimColor(this.glass.liquid, this.accent);
  }

  dispose(): void {
    disposeObject(this.scene);
    this.scene.fog = null;
  }
}
