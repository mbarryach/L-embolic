import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { clamp } from '../../utils/math';
import { isTouchPrimary } from '../../utils/device';
import { on, query, queryAll, readCssVar, setCssVar } from '../../utils/dom';
import { DURATION, EASE, STAGGER } from '../motionTokens';
import type { SectionTimeline, TimelineContext } from '../SectionTimeline';

interface CocktailEntry {
  readonly element: HTMLElement;
  readonly image: HTMLImageElement;
  readonly content: HTMLElement;
  readonly id: string;
  readonly accent: string;
}

const DEFAULT_ACCENT = 'var(--c-teal)';
const DESKTOP_QUERY = '(min-width: 1025px) and (pointer: fine)';

/**
 * Carta interactiva.
 *
 * En escritorio, el escenario se fija y cada tramo de scroll sirve una copa.
 * Los botones comparten el mismo estado, por lo que se puede recorrer la carta
 * con rueda, ratón, teclado o pulsación sin mantener dos carruseles distintos.
 * En táctil no se fija la página: flechas, índices y gesto lateral controlan la
 * misma transición cinematográfica.
 */
export function createCocktailMenuTimeline({
  bus,
  motion,
}: TimelineContext): SectionTimeline | null {
  const section = query('.carta');
  const stage = query('[data-cocktail-stage]', section ?? document);
  const track = query('[data-rail-track]', section ?? document);
  if (!section || !stage || !track) return null;
  const menuSection = section;
  const menuStage = stage;

  const entries: CocktailEntry[] = [];
  for (const element of queryAll('.plate', track)) {
    const image = query<HTMLImageElement>('img', element);
    const content = query('.plate__content', element);
    if (!image || !content) continue;
    entries.push({
      element,
      image,
      content,
      id: element.dataset.cocktail ?? '',
      accent: readCssVar('--c-accent', element) || '#76c8c4',
    });
  }
  if (entries.length === 0) return null;

  const selectors = queryAll<HTMLButtonElement>('[data-cocktail-select]', stage);
  const previousButton = query<HTMLButtonElement>('[data-cocktail-previous]', stage);
  const nextButton = query<HTMLButtonElement>('[data-cocktail-next]', stage);
  const currentCounter = query('[data-cocktail-current]', stage);
  const navigator = query('.carta__navigator', stage);
  const orbs = queryAll('[data-carta-orb]', stage);

  const detachers: (() => void)[] = [];
  const media = gsap.matchMedia();
  let pinTrigger: ScrollTrigger | null = null;
  let activeIndex = -1;
  let pointerStart: { x: number; y: number } | null = null;

  function updateState(index: number, animate: boolean): void {
    const nextIndex = clamp(Math.round(index), 0, entries.length - 1);
    if (nextIndex === activeIndex) return;

    const previousIndex = activeIndex;
    const previous = entries[previousIndex];
    const next = entries[nextIndex];
    if (!next) return;

    activeIndex = nextIndex;
    menuStage.dataset.activeCocktail = next.id;
    setCssVar('--c-accent', next.accent);
    setCssVar('--cocktail-progress', String(nextIndex + 1), menuSection);

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      if (!entry) continue;
      const isNext = i === nextIndex;
      const isLeaving = animate && !motion.isReduced && i === previousIndex;
      entry.element.dataset.focus = isNext ? 'true' : isLeaving ? 'transitioning' : 'false';
      entry.element.setAttribute('aria-hidden', String(!isNext));
    }

    for (let i = 0; i < selectors.length; i += 1) {
      selectors[i]?.setAttribute('aria-pressed', String(i === nextIndex));
    }

    if (currentCounter) currentCounter.textContent = String(nextIndex + 1).padStart(2, '0');
    if (previousButton) previousButton.disabled = nextIndex === 0;
    if (nextButton) nextButton.disabled = nextIndex === entries.length - 1;

    bus.emit('cocktail:focus', { id: next.id, accent: next.accent });

    if (!animate || motion.isReduced || !previous) {
      for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        if (!entry) continue;
        gsap.set(entry.element, {
          autoAlpha: i === nextIndex ? 1 : 0,
          clipPath: 'inset(0 0 0 0)',
          scale: 1,
          visibility: i === nextIndex ? 'visible' : 'hidden',
          zIndex: i === nextIndex ? 2 : 1,
        });
      }
      gsap.set(next.image, { scale: 1.07, xPercent: 0, yPercent: 0 });
      gsap.set(next.content, { autoAlpha: 1, x: 0, y: 0, rotationX: 0, rotationY: 0 });
      return;
    }

    const direction = nextIndex > previousIndex ? 1 : -1;
    gsap.killTweensOf([
      previous.element,
      previous.image,
      previous.content,
      next.element,
      next.image,
      next.content,
    ]);
    gsap.set(next.element, { visibility: 'visible', zIndex: 3 });
    gsap.set(previous.element, { visibility: 'visible', zIndex: 2 });

    const transition = gsap.timeline({
      onComplete: () => {
        previous.element.dataset.focus = 'false';
        gsap.set(previous.element, { visibility: 'hidden', zIndex: 1 });
        gsap.set(next.element, { zIndex: 2 });
      },
    });

    transition
      .to(
        previous.element,
        {
          autoAlpha: 0,
          scale: direction > 0 ? 1.025 : 0.985,
          duration: DURATION.medium,
          ease: 'power2.inOut',
        },
        0,
      )
      .fromTo(
        next.element,
        {
          autoAlpha: 0,
          clipPath: direction > 0 ? 'inset(0 0 0 9%)' : 'inset(0 9% 0 0)',
          scale: direction > 0 ? 1.035 : 0.985,
        },
        {
          autoAlpha: 1,
          clipPath: 'inset(0 0 0 0)',
          scale: 1,
          duration: DURATION.slow,
          ease: EASE.emphasis,
        },
        0.04,
      )
      .fromTo(
        next.image,
        { scale: 1.16, xPercent: direction * 1.8 },
        { scale: 1.07, xPercent: 0, duration: 1.25, ease: EASE.emphasis },
        0.04,
      )
      .fromTo(
        next.content,
        { autoAlpha: 0, x: direction * 34, y: 18, rotationY: direction * -3 },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotationY: 0,
          duration: DURATION.slow,
          ease: EASE.emphasis,
        },
        0.16,
      )
      .fromTo(
        queryAll('.plate__index, .plate__name, .plate__recipe', next.content),
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: DURATION.slow,
          ease: EASE.emphasis,
          stagger: STAGGER.tight,
        },
        0.24,
      );
  }

  function navigateTo(index: number): void {
    const nextIndex = clamp(index, 0, entries.length - 1);
    updateState(nextIndex, true);

    if (!pinTrigger || window.innerWidth <= 1024 || motion.isReduced) return;
    const progress = (nextIndex + 0.5) / entries.length;
    const top = pinTrigger.start + (pinTrigger.end - pinTrigger.start) * progress;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  const context = gsap.context(() => {
    updateState(0, false);

    if (!motion.isReduced) {
      gsap.fromTo(
        '.carta__title .display__line',
        { xPercent: (index) => (index === 0 ? -8 : 8), autoAlpha: 0 },
        {
          xPercent: 0,
          autoAlpha: 1,
          duration: DURATION.slow,
          ease: EASE.emphasis,
          stagger: STAGGER.loose,
          scrollTrigger: { trigger: '.carta__head', start: 'top 78%', once: true },
        },
      );

      gsap.fromTo(
        stage,
        { clipPath: 'inset(8% 3%)', y: 70 },
        {
          clipPath: 'inset(0% 0%)',
          y: 0,
          duration: 1.2,
          ease: EASE.emphasis,
          scrollTrigger: { trigger: stage, start: 'top 88%', once: true },
        },
      );

      gsap.fromTo(
        selectors,
        { autoAlpha: 0, x: 22 },
        {
          autoAlpha: 1,
          x: 0,
          duration: DURATION.slow,
          ease: EASE.emphasis,
          stagger: STAGGER.tight,
          scrollTrigger: { trigger: stage, start: 'top 76%', once: true },
        },
      );

      gsap.to(orbs, {
        yPercent: (index) => (index === 0 ? -38 : 54),
        rotation: (index) => (index === 0 ? 24 : -42),
        ease: 'none',
        stagger: STAGGER.loose,
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.1,
        },
      });
    }

    media.add(DESKTOP_QUERY, () => {
      if (motion.isReduced) return undefined;

      pinTrigger = ScrollTrigger.create({
        trigger: stage,
        start: 'top top',
        end: () => `+=${Math.max(window.innerHeight * 0.72, 620) * entries.length}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          updateState(
            Math.min(entries.length - 1, Math.floor(self.progress * entries.length)),
            true,
          );
        },
      });

      return () => {
        pinTrigger = null;
      };
    });

    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onLeave: () => {
        setCssVar('--c-accent', DEFAULT_ACCENT);
      },
      onLeaveBack: () => {
        setCssVar('--c-accent', DEFAULT_ACCENT);
      },
      onEnter: () => {
        const active = entries[activeIndex];
        if (active) setCssVar('--c-accent', active.accent);
      },
      onEnterBack: () => {
        const active = entries[activeIndex];
        if (active) setCssVar('--c-accent', active.accent);
      },
    });
  }, section);

  for (let i = 0; i < selectors.length; i += 1) {
    const selector = selectors[i];
    if (!selector) continue;
    detachers.push(
      on(selector, 'click', () => {
        navigateTo(i);
      }),
    );
  }

  if (previousButton) {
    detachers.push(
      on(previousButton, 'click', () => {
        navigateTo(activeIndex - 1);
      }),
    );
  }
  if (nextButton) {
    detachers.push(
      on(nextButton, 'click', () => {
        navigateTo(activeIndex + 1);
      }),
    );
  }

  if (navigator) {
    detachers.push(
      on(navigator, 'keydown', (event) => {
        const target =
          event.target instanceof Element
            ? event.target.closest<HTMLButtonElement>('[data-cocktail-select]')
            : null;
        const current = target ? selectors.indexOf(target) : activeIndex;
        let next: number;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = current + 1;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = current - 1;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = entries.length - 1;
        else return;

        event.preventDefault();
        next = clamp(next, 0, entries.length - 1);
        selectors[next]?.focus();
        navigateTo(next);
      }),
    );
  }

  detachers.push(
    on(stage, 'pointerdown', (event) => {
      if (event.pointerType === 'mouse') return;
      pointerStart = { x: event.clientX, y: event.clientY };
    }),
    on(stage, 'pointerup', (event) => {
      if (!pointerStart || event.pointerType === 'mouse') return;
      const deltaX = event.clientX - pointerStart.x;
      const deltaY = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
      navigateTo(activeIndex + (deltaX < 0 ? 1 : -1));
    }),
    on(stage, 'pointercancel', () => {
      pointerStart = null;
    }),
  );

  if (!motion.isReduced && !isTouchPrimary()) {
    detachers.push(
      on(stage, 'pointermove', (event) => {
        const active = entries[activeIndex];
        if (!active) return;
        const bounds = stage.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        gsap.to(active.image, {
          xPercent: x * 2.4,
          yPercent: y * 1.4,
          duration: DURATION.slow,
          ease: 'power2.out',
          overwrite: 'auto',
        });
        gsap.to(active.content, {
          rotationY: x * 4,
          rotationX: y * -3,
          duration: DURATION.slow,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }),
      on(stage, 'pointerleave', () => {
        const active = entries[activeIndex];
        if (!active) return;
        gsap.to(active.image, {
          xPercent: 0,
          yPercent: 0,
          duration: DURATION.slow,
          ease: EASE.emphasis,
        });
        gsap.to(active.content, {
          rotationX: 0,
          rotationY: 0,
          duration: DURATION.slow,
          ease: EASE.emphasis,
        });
      }),
    );
  }

  return {
    destroy: () => {
      for (const detach of detachers) detach();
      detachers.length = 0;
      media.revert();
      context.revert();
      setCssVar('--c-accent', DEFAULT_ACCENT);
      section.style.removeProperty('--cocktail-progress');
    },
  };
}
