import type { AppEvents } from '../types';
import type { EventBus } from '../core/EventBus';
import { on } from '../utils/dom';
import { clamp } from '../utils/math';

/**
 * Traduce la posicion del raton a un par de numeros de -1 a 1 y lo cuenta
 * por el bus. Aqui no se suaviza nada: el amortiguado va en el bucle de
 * render, que es quien sabe cuanto ha pasado desde el frame anterior.
 *
 * Y solo se publica la posicion. Que hacer con ella lo decide la escena,
 * que para eso es la que sabe cuanto puede moverse la camara sin marear.
 */
export class PointerParallax {
  private readonly detach: () => void;

  constructor(private readonly bus: EventBus<AppEvents>) {
    this.detach = on(window, 'pointermove', this.onMove, { passive: true });
  }

  private readonly onMove = (event: PointerEvent): void => {
    // El raton de un lapiz o un dedo no cuenta: en tactil este efecto sobra.
    if (event.pointerType !== 'mouse') return;
    this.bus.emit('pointer:move', {
      x: clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1),
      y: clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1),
    });
  };

  destroy(): void {
    this.detach();
  }
}
