import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { query, queryAll, readCssVar, setCssVar, on } from '../../utils/dom';
import { DURATION, EASE, STAGGER } from '../motionTokens';
import { isTouchPrimary } from '../../utils/device';
import type { SectionTimeline, TimelineContext } from '../SectionTimeline';

/** Datos que cacheamos de cada lamina para no medir nada dentro del scroll. */
interface PlateEntry {
  readonly element: HTMLElement;
  readonly id: string;
  readonly accent: string;
  center: number;
}

const DEFAULT_ACCENT = 'var(--c-teal)';

/**
 * Donde esta la "linea de foco", en tanto por uno del ancho de pantalla.
 *
 * No es el centro a proposito: si fuese 0.5, al arrancar el rail la primera
 * lamina ya habria pasado de largo y no se enfocaria NUNCA, porque el rail
 * solo se mueve hacia la izquierda. A un tercio, entran todas por orden.
 */
const FOCUS_LINE = 0.34;

/**
 * SCENE 03 — el tauler.
 *
 * Seis laminas en fila india, a distintas alturas y tamaños. En escritorio
 * la seccion se queda clavada y el raíl se desplaza con el scroll; en tactil
 * es un carrusel normal con snap, porque pelearse con el dedo de la gente no
 * sale a cuenta.
 *
 * Lo bueno: la lamina que queda en el centro se lleva el foco y su color se
 * propaga a TODA la pagina (barra de progreso, marcas, luces del canvas).
 * De ahi lo de "cocktail spotlight": no es un hover, es que cambia el humor
 * de la escena entera.
 */
export function createCocktailsTimeline({ bus, motion }: TimelineContext): SectionTimeline | null {
  const section = query('.carta');
  const stage = query('[data-rail]', section ?? document);
  const track = query('[data-rail-track]', section ?? document);
  if (!section || !stage || !track) return null;

  const plates: PlateEntry[] = queryAll('.plate', track).map((element) => ({
    element,
    id: element.dataset.cocktail ?? '',
    // El color lo manda el CSS; aqui solo lo leemos una vez y lo guardamos.
    accent: readCssVar('--c-accent', element) || '#4dd9e8',
    center: 0,
  }));
  if (plates.length === 0) return null;

  let focusedIndex = -1;
  const detachers: (() => void)[] = [];

  function measure(): void {
    for (const plate of plates) {
      plate.center = plate.element.offsetLeft + plate.element.offsetWidth / 2;
    }
  }

  /**
   * `offset` son los pixeles que el rail lleva desplazados. Todo sale de
   * numeros ya cacheados: ni un getBoundingClientRect por frame.
   */
  function updateFocus(offset: number): void {
    const focusPoint = offset + window.innerWidth * FOCUS_LINE;

    let nearest = 0;
    let smallest = Number.POSITIVE_INFINITY;
    for (let i = 0; i < plates.length; i += 1) {
      const plate = plates[i];
      if (!plate) continue;
      const distance = Math.abs(plate.center - focusPoint);
      if (distance < smallest) {
        smallest = distance;
        nearest = i;
      }
    }

    if (nearest === focusedIndex) return;
    focusedIndex = nearest;

    for (let i = 0; i < plates.length; i += 1) {
      plates[i]?.element.setAttribute('data-focus', String(i === nearest));
    }

    const active = plates[nearest];
    if (!active) return;
    setCssVar('--c-accent', active.accent);
    bus.emit('cocktail:focus', { id: active.id, accent: active.accent });
  }

  const context = gsap.context(() => {
    // Titular: las dos lineas entran desde lados opuestos. Distinto al de
    // "qui som" a proposito — cada seccion tiene su propio gesto.
    if (!motion.isReduced) {
      gsap.fromTo(
        '.carta__title .display__line',
        { xPercent: (i) => (i === 0 ? -8 : 8), autoAlpha: 0 },
        {
          xPercent: 0,
          autoAlpha: 1,
          duration: DURATION.slow,
          ease: EASE.emphasis,
          stagger: STAGGER.loose,
          scrollTrigger: { trigger: '.carta__head', start: 'top 78%', once: true },
        },
      );
    }

    const pinnable = !motion.isReduced && !isTouchPrimary() && window.innerWidth > 1024;

    if (pinnable) {
      const distance = (): number => Math.max(0, track.scrollWidth - window.innerWidth);

      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance() + window.innerHeight * 0.5}`,
          pin: true,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: measure,
          onUpdate: (self) => {
            updateFocus(distance() * self.progress);
          },
        },
      });
    } else {
      // Carrusel nativo: escuchamos su scrollLeft y ya esta.
      measure();
      updateFocus(stage.scrollLeft);
      detachers.push(
        on(
          stage,
          'scroll',
          () => {
            updateFocus(stage.scrollLeft);
          },
          { passive: true },
        ),
      );
    }

    // Al salir de la carta el acento vuelve a casa, que si no la pagina se
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
        const active = plates[focusedIndex];
        if (active) setCssVar('--c-accent', active.accent);
      },
      onEnterBack: () => {
        const active = plates[focusedIndex];
        if (active) setCssVar('--c-accent', active.accent);
      },
    });
  }, section);

  measure();
  updateFocus(0);

  return {
    destroy: () => {
      for (const detach of detachers) detach();
      detachers.length = 0;
      context.revert();
      setCssVar('--c-accent', DEFAULT_ACCENT);
    },
  };
}
