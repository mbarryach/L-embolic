import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { query } from '../../utils/dom';
import { DURATION, EASE, STAGGER } from '../motionTokens';
import type { SectionTimeline, TimelineContext } from '../SectionTimeline';

/**
 * Fraccion del clip a partir de la cual la copa ya se ha convertido en la
 * otra. Va en fraccion y no en segundos para que siga cuadrando si algun
 * dia se reencoda el video con otra duracion.
 */
const MORPH_AT = 0.62;

/**
 * SCENE — d'una copa a l'altra.
 *
 * La bisagra hacia la carta. Es la unica seccion que no pinta nada suyo:
 * levanta el velo del fondo para que se vea el video a plena luz y pone
 * nombre a lo que se esta viendo. Primero descubres que una copa puede ser
 * otra, y justo despues llegan las seis de la carta.
 */
export function createSignatureTimeline({ bus, motion }: TimelineContext): SectionTimeline | null {
  const section = query('.signature');
  if (!section) return null;

  const labels = query('[data-signature-labels]');

  // La etiqueta sigue al video tambien sin animaciones: no es movimiento,
  // es saber que coctel tienes delante.
  const unsubscribe = bus.on('video:fraction', (fraction) => {
    if (!labels) return;
    const next = fraction >= MORPH_AT ? 'tiki' : 'cocotro';
    if (labels.dataset.active !== next) labels.dataset.active = next;
  });

  if (motion.isReduced) {
    return { destroy: unsubscribe };
  }

  const context = gsap.context(() => {
    gsap.fromTo(
      '.signature__title .display__line',
      { yPercent: 108 },
      {
        yPercent: 0,
        duration: DURATION.slow,
        ease: EASE.emphasis,
        stagger: STAGGER.loose,
        scrollTrigger: { trigger: section, start: 'top 72%', once: true },
      },
    );

    // Mientras se cruza esta seccion, el velo del fondo se retira casi del
    // todo. Lo lee globals.css; aqui solo se levanta la bandera.
    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      end: 'bottom 40%',
      onToggle: (self) => {
        document.documentElement.dataset.stageClear = String(self.isActive);
      },
    });
  }, section);

  return {
    destroy: () => {
      unsubscribe();
      context.revert();
      delete document.documentElement.dataset.stageClear;
    },
  };
}
