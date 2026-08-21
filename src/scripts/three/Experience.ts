import type { WebGLRenderer } from 'three';
import type { AppEvents, MotionLevel, PointerState, QualityProfile, ViewportSize } from '../types';
import type { EventBus } from '../core/EventBus';
import type { Ticker } from '../core/Ticker';
import { Camera } from './Camera';
import { createRenderer, resizeRenderer } from './Renderer';
import { World } from './World';

export interface ExperienceOptions {
  readonly canvas: HTMLCanvasElement;
  readonly bus: EventBus<AppEvents>;
  readonly ticker: Ticker;
  readonly quality: QualityProfile;
  readonly size: ViewportSize;
  readonly motion: MotionLevel;
}

/**
 * Fachada de todo lo que es Three.
 *
 * Fuera de esta carpeta nadie sabe que existe una escena, una camara o un
 * renderer: se crea esto, se le va contando el scroll y al final se destruye.
 * Si algun dia hay que cambiar Three por otra cosa, se cambia aqui dentro.
 */
export class Experience {
  private readonly renderer: WebGLRenderer;
  private readonly camera: Camera;
  private readonly world: World;
  private readonly quality: QualityProfile;
  private readonly reduced: boolean;
  private readonly unsubscribes: (() => void)[] = [];
  private progress = 0;
  private dirty = true;
  private heroActive = true;

  constructor(options: ExperienceOptions) {
    const { canvas, bus, ticker, quality, size, motion } = options;

    this.quality = quality;
    this.reduced = motion === 'reduced';
    this.renderer = createRenderer(canvas, size, quality);
    this.camera = new Camera(size);
    this.world = new World(quality, size.aspect);

    this.unsubscribes.push(
      bus.on('scroll:progress', (value) => {
        this.progress = value;
        this.dirty = true;
      }),
    );

    this.unsubscribes.push(
      bus.on('viewport:resize', (next) => {
        this.resize(next);
      }),
    );

    this.unsubscribes.push(
      bus.on('hero:active', (active) => {
        this.heroActive = active;
        // Al volver al hero hay que repintar aunque nadie haya tocado nada:
        // mientras estaba apagado el mundo se ha quedado congelado.
        if (active) this.dirty = true;
      }),
    );

    this.unsubscribes.push(
      bus.on('cocktail:focus', ({ accent }) => {
        this.world.setAccent(accent);
        this.dirty = true;
      }),
    );

    if (!this.reduced) {
      this.unsubscribes.push(
        bus.on('pointer:move', (pointer: PointerState) => {
          this.camera.setPointer(pointer);
        }),
      );
    }

    this.unsubscribes.push(ticker.add(this.frame));
  }

  /**
   * Con reduced motion NO se pinta cada frame: solo cuando algo cambia de
   * verdad (scroll, resize, coctel en foco). La escena se ve igual de bonita
   * y la GPU se queda en silencio, que es justo lo que se ha pedido.
   */
  private readonly frame = (delta: number, elapsed: number): void => {
    // Fuera del hero el canvas esta fundido a cero y tapado por el video:
    // seguir renderizando seria calentar la GPU para que no lo vea nadie.
    if (!this.heroActive) return;

    if (this.reduced) {
      if (!this.dirty) return;
      this.dirty = false;
      this.world.update(this.progress, 0, 1);
      this.camera.apply(this.progress, 1);
      this.renderer.render(this.world.scene, this.camera.instance);
      return;
    }

    this.world.update(this.progress, elapsed, delta);
    this.camera.apply(this.progress, delta);
    this.renderer.render(this.world.scene, this.camera.instance);
  };

  private resize(size: ViewportSize): void {
    resizeRenderer(this.renderer, size, this.quality);
    this.camera.resize(size);
    this.world.setAspect(size.aspect);
    this.dirty = true;
  }

  destroy(): void {
    for (const unsubscribe of this.unsubscribes) unsubscribe();
    this.unsubscribes.length = 0;
    this.world.dispose();
    this.renderer.dispose();
    // Devolver el contexto WebGL a mano. El navegador solo aguanta unos
    // pocos a la vez y en desarrollo, con el hot reload, se agotan enseguida.
    this.renderer.forceContextLoss();
  }
}
