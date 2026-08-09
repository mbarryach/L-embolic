import gsap from 'gsap';
import { query, queryAll } from '../../utils/dom';
import { DURATION, EASE, STAGGER } from '../motionTokens';
import type { SectionTimeline, TimelineContext } from '../SectionTimeline';

/**
 * SCENE 02 — qui hi ha darrere.
 *
 * El titular sube desde debajo de su ventanilla, linea a linea. Los nombres
 * de los cocteles se subrayan solos cuando el parrafo ya se esta leyendo, no
 * antes: primero el texto, luego el adorno.
 *
 * La nota clavada flota un pelin con el scroll y se sale por abajo hacia la
 * carta — es la bisagra entre las dos secciones.
 */
export function createAboutTimeline({ motion }: TimelineContext): SectionTimeline | null {
  const section = query('.about');
  if (!section) return null;

  if (motion.isReduced) {
    // Los subrayados existen igual, solo que ya pintados.
    for (const mark of queryAll('.mark', section)) mark.style.setProperty('--mark-progress', '1');
    return null;
  }

  const context = gsap.context(() => {
    gsap.fromTo(
      '.about__title .display__line',
      { yPercent: 108 },
      {
        yPercent: 0,
        duration: DURATION.slow,
        ease: EASE.emphasis,
        stagger: STAGGER.loose,
        scrollTrigger: { trigger: '.about__title', start: 'top 82%', once: true },
      },
    );

    gsap.to('.about .mark', {
      '--mark-progress': 1,
      duration: DURATION.slow,
      ease: EASE.emphasis,
      stagger: STAGGER.loose,
      scrollTrigger: { trigger: '.about__body--offset', start: 'top 72%', once: true },
    });

    gsap.fromTo(
      '.about__body:not(.about__body--offset)',
      { xPercent: -8 },
      {
        xPercent: 5,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.1,
        },
      },
    );

    gsap.fromTo(
      '.about__body--offset',
      { xPercent: 7 },
      {
        xPercent: -4,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.1,
        },
      },
    );

    // Deriva de la nota. Poquito: 60 px en toda la seccion.
    gsap.fromTo(
      '.note',
      { '--note-drift': '3rem' },
      {
        '--note-drift': '-1.5rem',
        rotate: -1.6,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.8,
        },
      },
    );
  }, section);

  return {
    destroy: () => {
      context.revert();
    },
  };
}
