import gsap from 'gsap';
import { query } from '../../utils/dom';
import { DURATION, EASE } from '../motionTokens';
import { splitChars } from '../../utils/splitChars';
import type { SectionTimeline, TimelineContext } from '../SectionTimeline';

/**
 * SCENE 05 — l'outro.
 *
 * El nombre vuelve al final, ahora hueco y enorme, y sube letra a letra
 * mientras las particulas del canvas se juntan detras. Es el unico sitio
 * donde partimos texto en caracteres: hacerlo en todos los titulares
 * ademas de cansino se nota muchisimo que es un efecto de plantilla.
 */
export function createOutroTimeline({ motion }: TimelineContext): SectionTimeline | null {
  const word = query('[data-outro-word]');
  if (!word || motion.isReduced) return null;

  const split = splitChars(word);

  const context = gsap.context(() => {
    gsap.fromTo(
      split.chars,
      { yPercent: 105, autoAlpha: 0 },
      {
        yPercent: 0,
        autoAlpha: 1,
        duration: DURATION.slow,
        ease: EASE.emphasis,
        stagger: 0.045,
        scrollTrigger: { trigger: '.outro', start: 'top 75%', once: true },
      },
    );
  }, '.outro');

  return {
    destroy: () => {
      context.revert();
      split.restore();
    },
  };
}
