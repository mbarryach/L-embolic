import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { SectionTimeline, TimelineContext, TimelineFactory } from './SectionTimeline';

/**
 * Guarda todas las timelines de la pagina y, sobre todo, sabe matarlas.
 *
 * Que cada seccion se registre aqui evita el clasico "monte un ScrollTrigger
 * en un fichero y me olvide de limpiarlo": al destruir el manager se va
 * todo de golpe, contextos de GSAP incluidos.
 */
export class AnimationManager {
  private readonly timelines: SectionTimeline[] = [];

  constructor(private readonly context: TimelineContext) {}

  register(factory: TimelineFactory): SectionTimeline | null {
    const timeline = factory(this.context);
    if (timeline) this.timelines.push(timeline);
    return timeline;
  }

  /** Tras cambiar de tamaño hay que recalcular donde empieza y acaba cada trigger. */
  refresh(): void {
    ScrollTrigger.refresh();
  }

  destroy(): void {
    for (const timeline of this.timelines) timeline.destroy();
    this.timelines.length = 0;
  }
}
