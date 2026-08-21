import type { AppEvents } from '../types';
import type { EventBus } from '../core/EventBus';
import type { MotionPreferences } from './MotionPreferences';
import { isTouchPrimary } from '../utils/device';
import { clamp } from '../utils/math';
import { on, query } from '../utils/dom';

/** Duracion de reserva por si se pregunta antes de tener metadatos. */
const FALLBACK_DURATION = 5.04;

/** El clip va a 24 fps: por debajo de un fotograma no vale la pena buscar. */
const FRAME = 1 / 24;

/**
 * El video que hace de fondo de toda la pagina.
 *
 * No se reproduce solo: el scroll es el cabezal. Bajar de arriba abajo de la
 * web equivale a recorrer los cinco segundos del clip, asi que la copa del
 * principio se va convirtiendo en la otra a medida que se lee. El fondo
 * cuenta lo mismo que el contenido, solo que mas despacio.
 *
 * En tactil no se recorre: buscar dentro de un video con el dedo va a
 * tirones en cuanto el movil se cansa, asi que ahi se reproduce en bucle
 * mientras se ve. Y con reduced motion no se descarga nada: se queda el
 * poster, que son 35 kB en vez de 1,4 MB.
 */
export class BackgroundVideo {
  private readonly video: HTMLVideoElement | null;
  private readonly detachers: (() => void)[] = [];
  private target = 0;
  private seeking = false;
  private lastFraction = -1;

  constructor(
    private readonly bus: EventBus<AppEvents>,
    motion: MotionPreferences,
  ) {
    this.video = query<HTMLVideoElement>('[data-stage-video]');
    if (!this.video) return;

    if (motion.isReduced) {
      // El poster ya ensena una copa. Con eso basta y no cuesta nada.
      return;
    }

    if (isTouchPrimary()) {
      this.startLoop();
      return;
    }

    this.startScrub();
  }

  /** Escritorio: el scroll manda sobre el fotograma. */
  private startScrub(): void {
    const video = this.video;
    if (!video) return;

    video.preload = 'auto';
    video.load();

    this.detachers.push(
      on(video, 'seeked', this.releaseSeek),
      on(video, 'error', this.releaseSeek),
      on(video, 'loadeddata', this.applySeek),
    );

    this.detachers.push(
      this.bus.on('scroll:progress', (progress) => {
        const duration = this.duration();
        const fraction = clamp(progress, 0, 1);
        // Nunca justo al final: si currentTime llega a duration exacta,
        // algunos navegadores rebobinan solos y se ve un parpadeo.
        this.target = Math.min(fraction * duration, duration - FRAME);
        this.publish(fraction);
        this.applySeek();
      }),
    );

    document.documentElement.dataset.bgvideo = 'scrub';
  }

  /** Tactil: reproduccion normal, y solo mientras la pestaña esta delante. */
  private startLoop(): void {
    const video = this.video;
    if (!video) return;

    video.loop = true;
    video.preload = 'auto';
    video.load();

    this.detachers.push(
      on(video, 'timeupdate', () => {
        this.publish(video.currentTime / this.duration());
      }),
    );

    const play = (): void => {
      if (document.hidden) return;
      void video.play().catch(() => {
        // Si el navegador exige un gesto, se queda el poster y ya esta.
      });
    };

    this.detachers.push(
      on(document, 'visibilitychange', () => {
        if (document.hidden) video.pause();
        else play();
      }),
    );

    play();
    document.documentElement.dataset.bgvideo = 'loop';
  }

  private duration(): number {
    const value = this.video?.duration;
    return value !== undefined && Number.isFinite(value) && value > 0 ? value : FALLBACK_DURATION;
  }

  /** Avisa de por donde va el clip, redondeado, para no inundar el bus. */
  private publish(fraction: number): void {
    const rounded = Math.round(clamp(fraction, 0, 1) * 100) / 100;
    if (rounded === this.lastFraction) return;
    this.lastFraction = rounded;
    this.bus.emit('video:fraction', rounded);
  }

  /**
   * Los seeks se encadenan, no se apilan. Asignar currentTime en cada frame
   * del scroll deja al decodificador atras y el video empieza a saltar: se
   * pide uno, se espera, y al terminar se va a donde este el scroll ahora.
   */
  private readonly applySeek = (): void => {
    const video = this.video;
    if (!video || this.seeking || video.readyState < 2) return;
    if (Math.abs(video.currentTime - this.target) < FRAME) return;
    this.seeking = true;
    video.currentTime = this.target;
  };

  private readonly releaseSeek = (): void => {
    this.seeking = false;
    this.applySeek();
  };

  destroy(): void {
    for (const detach of this.detachers) detach();
    this.detachers.length = 0;
    this.video?.pause();
    delete document.documentElement.dataset.bgvideo;
  }
}
