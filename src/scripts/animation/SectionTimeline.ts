import type { AppEvents } from '../types';
import type { EventBus } from '../core/EventBus';
import type { MotionPreferences } from './MotionPreferences';

/** Lo que recibe cada timeline de seccion para poder hacer su trabajo. */
export interface TimelineContext {
  readonly bus: EventBus<AppEvents>;
  readonly motion: MotionPreferences;
}

/**
 * Contrato de una seccion animada: se crea, opcionalmente se le dice que
 * arranque, y siempre se puede destruir sin dejar basura detras.
 */
export interface SectionTimeline {
  play?(): void;
  destroy(): void;
}

export type TimelineFactory = (context: TimelineContext) => SectionTimeline | null;
