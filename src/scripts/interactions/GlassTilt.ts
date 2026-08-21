import gsap from 'gsap';
import { on } from '../utils/dom';

const MAX_ROTATION = 5;
const MAX_SHIFT = 4;

export class GlassTilt {
  private readonly detachers: (() => void)[] = [];
  private readonly rotateX: gsap.QuickToFunc;
  private readonly rotateY: gsap.QuickToFunc;
  private readonly shiftX: gsap.QuickToFunc;
  private readonly shiftY: gsap.QuickToFunc;
  private bounds: DOMRect | null = null;

  constructor(private readonly element: HTMLElement) {
    gsap.set(element, { transformPerspective: 900, transformOrigin: 'center' });
    this.rotateX = gsap.quickTo(element, 'rotationX', { duration: 0.65, ease: 'power3.out' });
    this.rotateY = gsap.quickTo(element, 'rotationY', { duration: 0.65, ease: 'power3.out' });
    this.shiftX = gsap.quickTo(element, 'x', { duration: 0.65, ease: 'power3.out' });
    this.shiftY = gsap.quickTo(element, 'y', { duration: 0.65, ease: 'power3.out' });

    this.detachers.push(on(element, 'pointerenter', this.onEnter));
    this.detachers.push(on(element, 'pointermove', this.onMove));
    this.detachers.push(on(element, 'pointerleave', this.reset));
    this.detachers.push(on(element, 'blur', this.reset));
  }

  private readonly onEnter = (): void => {
    this.bounds = this.element.getBoundingClientRect();
  };

  private readonly onMove = (event: PointerEvent): void => {
    const bounds = this.bounds;
    if (!bounds || event.pointerType !== 'mouse') return;
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    this.rotateX(y * MAX_ROTATION * -2);
    this.rotateY(x * MAX_ROTATION * 2);
    this.shiftX(x * MAX_SHIFT * 2);
    this.shiftY(y * MAX_SHIFT * 2);
  };

  private readonly reset = (): void => {
    this.bounds = null;
    this.rotateX(0);
    this.rotateY(0);
    this.shiftX(0);
    this.shiftY(0);
  };

  destroy(): void {
    for (const detach of this.detachers) detach();
    this.detachers.length = 0;
    gsap.killTweensOf(this.element);
    gsap.set(this.element, { clearProps: 'transform,transformOrigin' });
  }
}
