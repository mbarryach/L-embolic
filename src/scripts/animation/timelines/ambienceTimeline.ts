import gsap from 'gsap';
import { query } from '../../utils/dom';
import { DURATION, EASE, STAGGER } from '../motionTokens';
import type { SectionTimeline, TimelineContext } from '../SectionTimeline';

export function createAmbienceTimeline({ motion }: TimelineContext): SectionTimeline | null {
  const section = query('.ambience');
  if (!section) return null;

  if (motion.isReduced) {
    gsap.set('.ambience-card__line', { '--card-line': 1 });
    return null;
  }

  const context = gsap.context(() => {
    gsap.fromTo(
      '.ambience__title .display__line',
      { yPercent: 108 },
      {
        yPercent: 0,
        duration: DURATION.slow,
        ease: EASE.emphasis,
        stagger: STAGGER.loose,
        scrollTrigger: { trigger: '.ambience__title', start: 'top 84%', once: true },
      },
    );

    gsap.fromTo(
      '[data-ambience-card]',
      { autoAlpha: 0, y: 90, rotationX: -12, scale: 0.96 },
      {
        autoAlpha: 1,
        y: 0,
        rotationX: 0,
        scale: 1,
        duration: 1.15,
        ease: EASE.emphasis,
        stagger: 0.14,
        scrollTrigger: { trigger: '.ambience__cards', start: 'top 86%', once: true },
      },
    );

    gsap.to('.ambience-card__line', {
      '--card-line': 1,
      duration: DURATION.slow,
      ease: EASE.emphasis,
      stagger: STAGGER.loose,
      scrollTrigger: { trigger: '.ambience__cards', start: 'top 72%', once: true },
    });

    gsap.to('[data-ambience-portal]', {
      yPercent: -18,
      rotation: 24,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
      },
    });

    gsap.to('.ambience__quote', {
      xPercent: 10,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top 40%',
        end: 'bottom top',
        scrub: 1.1,
      },
    });
  }, section);

  return {
    destroy: () => {
      context.revert();
    },
  };
}
