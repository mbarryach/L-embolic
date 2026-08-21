import gsap from 'gsap';
import { on } from '../utils/dom';
import { DURATION, EASE } from '../animation/motionTokens';

/** Cuanto se deja arrastrar el boton, en pixeles. */
const PULL = 7;

/**
 * Iman muy flojito. El boton se acerca un poco al cursor y vuelve.
 *
 * Siete pixeles. Ni uno mas. Los botones que salen corriendo detras del
 * raton quedan muy bien en un video de Twitter y muy mal cuando intentas
 * darle a "Trucar ara" con prisa.
 */
export class MagneticButton {
  private readonly detachers: (() => void)[] = [];
  private readonly moveX: gsap.QuickToFunc;
  private readonly moveY: gsap.QuickToFunc;
  private bounds: DOMRect | null = null;

  constructor(private readonly element: HTMLElement) {
    this.moveX = gsap.quickTo(element, 'x', { duration: DURATION.medium, ease: EASE.emphasis });
    this.moveY = gsap.quickTo(element, 'y', { duration: DURATION.medium, ease: EASE.emphasis });

    // Se mide al entrar, no en cada movimiento del raton. Un
    // getBoundingClientRect por pointermove es la receta del jank.
    this.detachers.push(on(element, 'pointerenter', this.onEnter));
    this.detachers.push(on(element, 'pointermove', this.onMove));
    this.detachers.push(on(element, 'pointerleave', this.onLeave));
    this.detachers.push(on(element, 'blur', this.onLeave));
  }

  private readonly onEnter = (): void => {
    this.bounds = this.element.getBoundingClientRect();
  };

  private readonly onMove = (event: PointerEvent): void => {
    const bounds = this.bounds;
    if (!bounds) return;
    const dx = (event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2);
    const dy = (event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2);
    this.moveX(dx * PULL);
    this.moveY(dy * PULL);
  };

  private readonly onLeave = (): void => {
    this.bounds = null;
    this.moveX(0);
    this.moveY(0);
  };

  destroy(): void {
    for (const detach of this.detachers) detach();
    this.detachers.length = 0;
    gsap.killTweensOf(this.element);
    gsap.set(this.element, { clearProps: 'transform' });
  }
}
