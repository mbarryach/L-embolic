import { query, setCssVar } from '../utils/dom';

/** Si en 5 segundos no ha terminado, se quita igual. Nadie se queda encerrado. */
const ESCAPE_HATCH_MS = 5000;

/**
 * El telon de entrada.
 *
 * No enseña ningun porcentaje. Se dibuja una copa de neon y se enciende un
 * tubo, y en cuanto lo critico esta listo se levanta y desaparece del DOM.
 * Que un loader se quede pegado por un error en otro sitio es de las cosas
 * mas feas que puede hacer una web, asi que ademas lleva red de seguridad.
 */
export class Loader {
  private readonly element: HTMLElement | null;
  private readonly status: HTMLElement | null;
  private timeout: number | null = null;
  private finished = false;

  constructor() {
    this.element = query('[data-loader]');
    this.status = query('[data-loader-status]');
    this.timeout = window.setTimeout(() => {
      this.finish();
    }, ESCAPE_HATCH_MS);
  }

  /** `value` de 0 a 1. Lo unico que se ve es cuanto se ha dibujado la copa. */
  progress(value: number): void {
    if (!this.element || this.finished) return;
    setCssVar('--loader-progress', value.toFixed(3), this.element);
  }

  finish(): void {
    if (this.finished) return;
    this.progress(1);
    this.finished = true;

    if (this.timeout !== null) {
      window.clearTimeout(this.timeout);
      this.timeout = null;
    }

    const element = this.element;
    if (!element) return;

    if (this.status) this.status.textContent = 'Llest.';
    element.dataset.state = 'done';

    // Fuera del DOM en cuanto acaba el barrido, que si no se queda una capa
    // fija comiendose los clics de la gente.
    window.setTimeout(() => {
      element.hidden = true;
    }, 950);
  }
}
