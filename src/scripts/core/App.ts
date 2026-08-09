import type { AppEvents } from '../types';
import { EventBus } from './EventBus';
import { Loader } from './Loader';
import { Ticker } from './Ticker';
import { Viewport } from './Viewport';
import { MotionPreferences } from '../animation/MotionPreferences';
import { ScrollManager } from '../animation/ScrollManager';
import { AnimationManager } from '../animation/AnimationManager';
import { createRevealTimeline } from '../animation/reveal';
import { createHeroTimeline } from '../animation/timelines/heroTimeline';
import { createAboutTimeline } from '../animation/timelines/aboutTimeline';
import { createCocktailMenuTimeline } from '../animation/timelines/cocktailMenuTimeline';
import { createAmbienceTimeline } from '../animation/timelines/ambienceTimeline';
import { createLocationTimeline } from '../animation/timelines/locationTimeline';
import { createOutroTimeline } from '../animation/timelines/outroTimeline';
import { Navigation } from '../interactions/Navigation';
import { MagneticButton } from '../interactions/MagneticButton';
import { PointerParallax } from '../interactions/PointerParallax';
import { Bunting } from '../interactions/Bunting';
import { LocaleSwitcher } from '../interactions/LocaleSwitcher';
import { GlassTilt } from '../interactions/GlassTilt';
import { ContactDock } from '../interactions/ContactDock';
import { detectTier, isTouchPrimary, qualityFor, supportsWebGL } from '../utils/device';
import { query, queryAll } from '../utils/dom';

interface Teardown {
  destroy(): void;
}

/**
 * El director de orquesta.
 *
 * Monta las piezas en el orden correcto y, sobre todo, sabe desmontarlas.
 * La regla es simple: si algo se crea aqui, se guarda en `teardowns` y se
 * muere cuando App se muere. Asi no hay listeners sueltos ni ScrollTriggers
 * fantasma paseando por ahi.
 */
export class App {
  private readonly bus = new EventBus<AppEvents>();
  private readonly ticker = new Ticker();
  private readonly motion = new MotionPreferences();
  private readonly loader = new Loader();
  private readonly teardowns: Teardown[] = [];
  private viewport: Viewport | null = null;
  private scroll: ScrollManager | null = null;
  private animations: AnimationManager | null = null;

  async start(): Promise<void> {
    this.loader.progress(0.2);

    this.viewport = new Viewport(this.bus);
    this.teardowns.push(this.viewport);

    this.ticker.start();

    this.scroll = new ScrollManager({
      bus: this.bus,
      ticker: this.ticker,
      motion: this.motion,
    });
    this.teardowns.push(this.scroll);

    this.setupInteractions(this.scroll);
    const heroTimeline = this.setupTimelines();

    this.loader.progress(0.45);

    // Las fuentes cambian el ancho de los titulares, y los titulares
    // deciden donde empiezan y acaban los ScrollTrigger. Primero llegan
    // ellas, luego se mide. Al reves salen todos los triggers desplazados.
    await waitForFonts();
    this.loader.progress(0.7);

    await this.setupExperience();
    this.loader.progress(1);

    this.animations?.refresh();
    this.loader.finish();
    heroTimeline?.play?.();
  }

  private setupInteractions(scroll: ScrollManager): void {
    this.teardowns.push(new LocaleSwitcher());
    this.teardowns.push(new Navigation(scroll));
    this.teardowns.push(new Bunting());
    this.teardowns.push(new ContactDock());

    // El iman y el parallax son cosa de raton. En tactil no pintan nada.
    if (!isTouchPrimary() && !this.motion.isReduced) {
      this.teardowns.push(new PointerParallax(this.bus));
      for (const element of queryAll('[data-magnetic]')) {
        this.teardowns.push(new MagneticButton(element));
      }
      for (const element of queryAll('[data-tilt]')) {
        this.teardowns.push(new GlassTilt(element));
      }
    }

    this.bus.on('viewport:resize', () => {
      this.animations?.refresh();
    });

    // Se puede activar "reducir movimiento" con la pagina ya abierta.
    this.motion.subscribe((level) => {
      scroll.applyMotion(level);
    });
  }

  private setupTimelines() {
    const animations = new AnimationManager({ bus: this.bus, motion: this.motion });
    this.animations = animations;
    this.teardowns.push(animations);

    const hero = animations.register(createHeroTimeline);
    animations.register(createRevealTimeline);
    animations.register(createAboutTimeline);
    animations.register(createAmbienceTimeline);
    animations.register(createCocktailMenuTimeline);
    animations.register(createLocationTimeline);
    animations.register(createOutroTimeline);

    return hero;
  }

  private async setupExperience(): Promise<void> {
    const canvas = query<HTMLCanvasElement>('[data-stage-canvas]');
    const viewport = this.viewport;
    if (!canvas || !viewport || !supportsWebGL()) return;

    try {
      // Three viaja en su propio chunk y se pide DESPUES de que la pagina
      // ya se vea. Si tarda o si peta, arriba sigue habiendo un bar.
      const { Experience } = await import('../three/Experience');
      this.teardowns.push(
        new Experience({
          canvas,
          bus: this.bus,
          ticker: this.ticker,
          quality: qualityFor(detectTier()),
          size: viewport.size,
          motion: this.motion.level,
        }),
      );
      document.body.dataset.webgl = 'on';
    } catch (error) {
      // Sin escena 3D. El degradado de CSS se queda y nadie se entera.
      console.warn("[l'embolic] la escena 3D no ha arrancado:", error);
    }
  }

  destroy(): void {
    for (const teardown of [...this.teardowns].reverse()) teardown.destroy();
    this.teardowns.length = 0;
    this.ticker.destroy();
    this.motion.destroy();
    this.bus.clear();
    delete document.body.dataset.webgl;
  }
}

/**
 * Espera a las fuentes, pero sin fiarse: si document.fonts no existe o
 * tarda demasiado, se sigue adelante. Mas vale un titular en Arial durante
 * medio segundo que una pantalla negra durante ocho.
 */
async function waitForFonts(timeoutMs = 2500): Promise<void> {
  if (!('fonts' in document)) return;
  await Promise.race([
    document.fonts.ready,
    new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
}
