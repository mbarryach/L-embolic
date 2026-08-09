import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { clamp } from '../../utils/math';
import { on, query, queryAll, readCssVar, setCssVar } from '../../utils/dom';
import { DURATION, EASE, STAGGER } from '../motionTokens';
import type { SectionTimeline, TimelineContext } from '../SectionTimeline';

interface CocktailEntry {
  readonly element: HTMLElement;
  readonly id: string;
  readonly accent: string;
}

const DEFAULT_ACCENT = 'var(--c-teal)';

/** Cuanto hay que arrastrar antes de considerarlo arrastre y no clic. */
const DRAG_THRESHOLD = 6;

/**
 * Carta en galeria horizontal.
 *
 * El mecanismo es el scroll nativo del riel con scroll-snap. Eso es
 * deliberado: el navegador ya sabe hacerlo con inercia en el trackpad, con
 * el dedo en movil y con la rueda, respeta el snap y no hay que recalcular
 * nada al cambiar de tamaño. Antes esto era un pin con seis tramos de
 * scroll y por eso se rompia en pantallas estrechas.
 *
 * Lo que añade este modulo son atajos por encima: flechas, puntos, teclado
 * y arrastre con el raton (que es lo unico que el navegador no da gratis en
 * escritorio). Si JS no llega, el riel se sigue recorriendo igual.
 *
 * La lamina que queda a la izquierda del riel es la que manda: se enciende
 * y su color se propaga a toda la pagina.
 */
export function createCocktailMenuTimeline({
  bus,
  motion,
}: TimelineContext): SectionTimeline | null {
  const section = query('.carta');
  const galleryRoot = query('[data-gallery]', section ?? document);
  const railRoot = query('[data-gallery-rail]', section ?? document);
  if (!section || !galleryRoot || !railRoot) return null;

  // Alias despues de comprobar: TypeScript pierde el estrechamiento dentro
  // de las funciones declaradas mas abajo y se pondria a pedir `?.` en cada
  // uso, que es ruido para algo que ya sabemos que existe.
  const gallery = galleryRoot;
  const rail = railRoot;

  const entries: CocktailEntry[] = queryAll('.plate', rail).map((element) => ({
    element,
    id: element.dataset.cocktail ?? '',
    accent: readCssVar('--c-accent', element) || '#76c8c4',
  }));
  if (entries.length === 0) return null;

  const dots = queryAll<HTMLButtonElement>('[data-gallery-dot]', gallery);
  const previousButton = query<HTMLButtonElement>('[data-gallery-prev]', gallery);
  const nextButton = query<HTMLButtonElement>('[data-gallery-next]', gallery);

  const detachers: (() => void)[] = [];
  let activeIndex = -1;
  /** Hacia donde va el riel ahora mismo. Puede ir por delante de activeIndex. */
  let pendingIndex = 0;

  /** Posicion de cada lamina dentro del riel. Se mide en el refresh, no al scrollear. */
  let offsets: number[] = [];

  function measure(): void {
    offsets = entries.map((entry) => entry.element.offsetLeft);
  }

  function setActive(index: number): void {
    if (index === activeIndex) return;
    activeIndex = index;

    for (let i = 0; i < entries.length; i += 1) {
      entries[i]?.element.setAttribute('data-focus', String(i === index));
    }
    for (let i = 0; i < dots.length; i += 1) {
      dots[i]?.setAttribute('aria-pressed', String(i === index));
    }
    if (previousButton) previousButton.disabled = index <= 0;
    if (nextButton) nextButton.disabled = index >= entries.length - 1;

    const active = entries[index];
    if (!active) return;
    setCssVar('--c-accent', active.accent);
    bus.emit('cocktail:focus', { id: active.id, accent: active.accent });
  }

  /** Cual es la lamina mas cercana al borde izquierdo del riel. */
  function syncFromScroll(): void {
    const position = rail.scrollLeft + rail.clientWidth * 0.1;
    let nearest = 0;
    let smallest = Number.POSITIVE_INFINITY;
    for (let i = 0; i < offsets.length; i += 1) {
      const distance = Math.abs((offsets[i] ?? 0) - position);
      if (distance < smallest) {
        smallest = distance;
        nearest = i;
      }
    }
    pendingIndex = nearest;
    setActive(nearest);
  }

  function goTo(index: number): void {
    const next = clamp(index, 0, entries.length - 1);
    const target = entries[next];
    if (!target) return;
    // Se apunta a donde vamos, no a donde estamos. Sin esto, dos clics
    // seguidos en la flecha avanzan una sola lamina: el segundo llega
    // mientras el scroll suave aun esta a medio camino y vuelve a calcular
    // desde la de partida.
    pendingIndex = next;
    rail.scrollTo({
      left: target.element.offsetLeft - rail.offsetLeft,
      behavior: motion.isReduced ? 'auto' : 'smooth',
    });
  }

  // --- scroll del riel ---
  detachers.push(on(rail, 'scroll', syncFromScroll, { passive: true }));

  // --- flechas y puntos ---
  if (previousButton) {
    detachers.push(
      on(previousButton, 'click', () => {
        goTo(pendingIndex - 1);
      }),
    );
  }
  if (nextButton) {
    detachers.push(
      on(nextButton, 'click', () => {
        goTo(pendingIndex + 1);
      }),
    );
  }
  for (let i = 0; i < dots.length; i += 1) {
    const dot = dots[i];
    if (!dot) continue;
    detachers.push(
      on(dot, 'click', () => {
        goTo(i);
      }),
    );
  }

  // --- teclado sobre el riel ---
  detachers.push(
    on(rail, 'keydown', (event) => {
      let next: number;
      if (event.key === 'ArrowRight') next = pendingIndex + 1;
      else if (event.key === 'ArrowLeft') next = pendingIndex - 1;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = entries.length - 1;
      else return;
      event.preventDefault();
      goTo(next);
    }),
  );

  // --- arrastre con el raton ---
  // Lo unico que el navegador no da hecho en escritorio. En tactil no se
  // toca nada: el scroll nativo del dedo ya funciona y meterse por medio
  // solo consigue estropearlo.
  let dragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragged = false;

  detachers.push(
    on(rail, 'pointerdown', (event) => {
      if (event.pointerType !== 'mouse') return;
      dragging = true;
      dragged = false;
      dragStartX = event.clientX;
      dragStartScroll = rail.scrollLeft;
    }),
    on(rail, 'pointermove', (event) => {
      if (!dragging) return;
      const delta = event.clientX - dragStartX;
      if (!dragged && Math.abs(delta) < DRAG_THRESHOLD) return;
      if (!dragged) {
        dragged = true;
        gallery.dataset.dragging = 'true';
        rail.setPointerCapture(event.pointerId);
      }
      rail.scrollLeft = dragStartScroll - delta;
    }),
  );

  const endDrag = (event: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    if (!dragged) return;
    delete gallery.dataset.dragging;
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    // Al soltar, vuelve el snap y se acomoda a la lamina mas cercana.
    goTo(activeIndex);
  };

  detachers.push(on(rail, 'pointerup', endDrag), on(rail, 'pointercancel', endDrag));

  // --- entrada de la seccion ---
  const context = gsap.context(() => {
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
        entries.map((entry) => entry.element),
        { autoAlpha: 0, y: 48 },
        {
          autoAlpha: 1,
          y: 0,
          duration: DURATION.slow,
          ease: EASE.emphasis,
          stagger: STAGGER.tight,
          scrollTrigger: { trigger: rail, start: 'top 86%', once: true },
        },
      );
    }

    // El acento vuelve a casa al salir de la seccion; si no, la pagina se
    // queda con el color del ultimo coctel para siempre.
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

  const remeasure = (): void => {
    measure();
    syncFromScroll();
  };

  detachers.push(bus.on('viewport:resize', remeasure));

  measure();
  setActive(0);

  return {
    destroy: () => {
      for (const detach of detachers) detach();
      detachers.length = 0;
      context.revert();
      setCssVar('--c-accent', DEFAULT_ACCENT);
      delete gallery.dataset.dragging;
    },
  };
}
