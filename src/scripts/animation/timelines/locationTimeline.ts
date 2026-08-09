import gsap from 'gsap';
import { query } from '../../utils/dom';
import { DURATION, EASE, STAGGER } from '../motionTokens';
import type { SectionTimeline, TimelineContext } from '../SectionTimeline';

/**
 * SCENE 04 — on som.
 *
 * Aqui la direccion es el dibujo, asi que no se le hace nada raro: entra
 * entera, de una pieza, y luego deriva despacio mientras se hace scroll.
 * Las filas del horario caen en cadena como si alguien las fuera apuntando.
 */
export function createLocationTimeline({ motion }: TimelineContext): SectionTimeline | null {
  const section = query('.info');
  if (!section || motion.isReduced) return null;

  const context = gsap.context(() => {
    gsap.fromTo(
      '.info__address .display__line',
      { autoAlpha: 0, yPercent: 40 },
      {
        autoAlpha: 1,
        yPercent: 0,
        duration: DURATION.slow,
        ease: EASE.emphasis,
        stagger: STAGGER.loose,
        scrollTrigger: { trigger: '.info__address', start: 'top 85%', once: true },
      },
    );

    gsap.fromTo(
      '.hours__row',
      { autoAlpha: 0, x: -14 },
      {
        autoAlpha: 1,
        x: 0,
        duration: DURATION.medium,
        ease: EASE.standard,
        stagger: STAGGER.loose,
        scrollTrigger: { trigger: '.hours', start: 'top 84%', once: true },
      },
    );

    gsap.fromTo(
      '.info__contact li, .info__go',
      { autoAlpha: 0, y: 20 },
      {
        autoAlpha: 1,
        y: 0,
        duration: DURATION.medium,
        ease: EASE.emphasis,
        stagger: STAGGER.loose,
        scrollTrigger: { trigger: '.info__contact', start: 'top 86%', once: true },
      },
    );

    // Deriva lenta del bloque grande. Muy poca: si se pasa, marea al leer.
    gsap.to('.info__address', {
      yPercent: -9,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });

    gsap.to('.info__kicker', {
      xPercent: 16,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.15,
      },
    });
  }, section);

  return {
    destroy: () => {
      context.revert();
    },
  };
}
