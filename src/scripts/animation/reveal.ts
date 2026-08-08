import gsap from 'gsap';
import { queryAll } from '../utils/dom';
import { DURATION, EASE, STAGGER } from './motionTokens';
import type { SectionTimeline, TimelineContext } from './SectionTimeline';

/**
 * Entrada generica para todo lo marcado con [data-reveal].
 *
 * Es el movimiento de fondo, el que casi no se ve: sube 22 px y aparece.
 * Los efectos con personalidad van en la timeline de cada seccion; si todo
 * entrase igual, la pagina seria un desfile y aburriria a las piedras.
 */
export function createRevealTimeline({ motion }: TimelineContext): SectionTimeline | null {
  const targets = queryAll('[data-reveal]');
  if (targets.length === 0) return null;

  // Con reduced motion no hay nada que revelar: el CSS ya los deja visibles.
  if (motion.isReduced) return null;

  const context = gsap.context(() => {
    for (const target of targets) {
      gsap.fromTo(
        target,
        { autoAlpha: 0, y: 22 },
        {
          autoAlpha: 1,
          y: 0,
          duration: DURATION.slow,
          ease: EASE.emphasis,
          stagger: STAGGER.tight,
          scrollTrigger: {
            trigger: target,
            start: 'top 88%',
            once: true,
          },
        },
      );
    }
  });

  return {
    destroy: () => {
      context.revert();
    },
  };
}
