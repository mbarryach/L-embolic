import gsap from 'gsap';
import { query, queryAll } from '../../utils/dom';
import { DURATION, EASE, STAGGER } from '../motionTokens';
import type { SectionTimeline, TimelineContext } from '../SectionTimeline';

/** Orden en que se encienden los tubos. A propósito desordenado. */
const GLYPH_ORDER = [4, 0, 7, 2, 8, 1, 5, 3, 6];

function drawStrokes(paths: SVGGeometryElement[], timeline: gsap.core.Timeline, at: number): void {
  for (const path of paths) {
    if (typeof path.getTotalLength !== 'function') continue;
    const length = path.getTotalLength();
    timeline.fromTo(
      path,
      { strokeDasharray: length, strokeDashoffset: length },
      { strokeDashoffset: 0, duration: DURATION.slow, ease: EASE.standard },
      at,
    );
  }
}

/**
 * SCENE 01 — la barra.
 *
 * Entrada: el rotulo no aparece, se enciende. Los tubos van uno a uno y en
 * desorden, con un par de parpadeos, como los neones de verdad cuando llevan
 * quince años en la fachada. Despues el garabato se dibuja solo.
 *
 * Salida: al bajar, el contenido sube un poco y se apaga mientras la camara
 * del canvas se aleja. Los dos planos se mueven a la vez, por eso parece un
 * unico espacio y no dos cosas pegadas.
 */
export function createHeroTimeline({ motion }: TimelineContext): SectionTimeline | null {
  const hero = query('.hero');
  if (!hero) return null;

  const neon = query<SVGSVGElement>('.neon', hero);
  const glyphs = queryAll<SVGTSpanElement>('.neon__word tspan', hero);
  const doodle = queryAll<SVGGeometryElement>('.hero__doodle > *', hero);
  const reduced = motion.isReduced;

  let intro: gsap.core.Timeline | null = null;

  const context = gsap.context(() => {
    if (!reduced) {
      intro = gsap.timeline({ paused: true, defaults: { ease: EASE.standard } });

      intro.set(glyphs, { opacity: 0 });
      intro.set(
        [
          '.hero__tagline',
          '.hero__sub',
          '.hero__cta .btn',
          '.hero__mark',
          '.hero__edition',
          '.scroll-cue',
        ],
        {
          opacity: 0,
          y: 18,
        },
      );

      // Los tubos, uno a uno y en desorden.
      GLYPH_ORDER.forEach((index, step) => {
        const glyph = glyphs[index];
        if (!glyph) return;
        intro?.to(glyph, { opacity: 1, duration: 0.08 }, 0.1 + step * 0.075);
      });

      // Dos parpadeos justo despues, que un neon nuevo no se lo cree nadie.
      intro.to(glyphs, { opacity: 0.25, duration: 0.05 }, 0.92);
      intro.to(glyphs, { opacity: 1, duration: 0.07 }, 0.97);
      intro.to(glyphs, { opacity: 0.6, duration: 0.04 }, 1.08);
      intro.to(glyphs, { opacity: 1, duration: 0.22 }, 1.12);

      // A partir de aqui el parpadeo lento lo lleva CSS.
      intro.add(() => neon?.classList.add('neon--lit'), 1.34);

      drawStrokes(doodle, intro, 0.85);

      intro.to('.hero__mark', { opacity: 1, y: 0, duration: DURATION.medium }, 1.0);
      intro.to('.hero__edition', { opacity: 1, y: 0, duration: DURATION.medium }, 1.08);
      intro.to(
        '.hero__tagline',
        { opacity: 1, y: 0, duration: DURATION.slow, ease: EASE.emphasis },
        1.18,
      );
      intro.to(
        '.hero__sub',
        { opacity: 1, y: 0, duration: DURATION.slow, ease: EASE.emphasis },
        1.3,
      );
      intro.to(
        '.hero__cta .btn',
        { opacity: 1, y: 0, duration: DURATION.medium, stagger: STAGGER.loose },
        1.42,
      );
      intro.to('.scroll-cue', { opacity: 1, y: 0, duration: DURATION.medium }, 1.6);
    } else {
      // Sin movimiento: el rotulo ya esta encendido y punto.
      neon?.classList.add('neon--lit');
    }

    if (reduced) return;

    // Salida por scroll. El titular se va mas rapido que el pie: eso es lo
    // que da la sensacion de profundidad sin tocar una sola camara.
    gsap
      .timeline({
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom 25%',
          scrub: 0.5,
        },
      })
      .to('.hero__title', { yPercent: -32, opacity: 0.05, ease: 'none' }, 0)
      .to('.hero__tagline', { yPercent: -60, opacity: 0, ease: 'none' }, 0)
      .to('.hero__doodle', { yPercent: -140, rotate: -18, opacity: 0, ease: 'none' }, 0)
      .to('.hero__foot', { yPercent: -18, opacity: 0, ease: 'none' }, 0.1)
      .to('.hero__edition', { xPercent: 24, opacity: 0, ease: 'none' }, 0)
      .to('.scroll-cue', { opacity: 0, ease: 'none' }, 0);
  }, hero);

  return {
    play: () => {
      intro?.play(0);
    },
    destroy: () => {
      intro?.kill();
      intro = null;
      context.revert();
    },
  };
}
