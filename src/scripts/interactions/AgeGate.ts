import { on, query, queryAll } from '../utils/dom';

const STORAGE_KEY = 'lembolic-age-ok';

/** A donde se manda a quien dice que no. Neutral y sin rastro del bar. */
const EXIT_URL = 'https://www.google.com/';

/**
 * Puerta de edad.
 *
 * Un bar de copas tiene que preguntarlo, asi que es lo primero que aparece
 * y no deja pasar hasta que se responde. Quien dice que si no vuelve a
 * verla; quien dice que no se va fuera.
 *
 * Tres detalles que importan:
 *
 * - El contenido de debajo sigue en el DOM, solo tapado. Si se borrase,
 *   los buscadores no verian la carta ni la direccion.
 * - El foco se queda encerrado dentro del panel mientras esta abierta. Si
 *   no, con el tabulador te vas a los enlaces de detras y la puerta deja
 *   de ser una puerta.
 * - Escape NO cierra. Una puerta que se abre sola no sirve de nada.
 */
export class AgeGate {
  private readonly element: HTMLElement | null;
  private readonly detachers: (() => void)[] = [];
  private lastFocused: HTMLElement | null = null;

  constructor() {
    this.element = query('[data-age-gate]');
    if (!this.element) return;

    if (this.alreadyConfirmed()) return;

    this.open();
  }

  private alreadyConfirmed(): boolean {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      // Sin almacenamiento se pregunta cada visita. Molesta menos que
      // saltarse la comprobacion.
      return false;
    }
  }

  private open(): void {
    const element = this.element;
    if (!element) return;

    this.lastFocused = document.activeElement as HTMLElement | null;
    element.hidden = false;
    document.documentElement.dataset.ageLock = 'on';

    const yes = query<HTMLButtonElement>('[data-age-yes]', element);
    const no = query<HTMLButtonElement>('[data-age-no]', element);

    if (yes)
      this.detachers.push(
        on(yes, 'click', () => {
          this.accept();
        }),
      );
    if (no)
      this.detachers.push(
        on(no, 'click', () => {
          this.reject();
        }),
      );

    this.detachers.push(on(document, 'keydown', this.trapFocus));

    // El foco entra en el panel para que un lector de pantalla lo anuncie.
    window.requestAnimationFrame(() => yes?.focus());
  }

  /** Mantiene el tabulador dando vueltas dentro del panel. */
  private readonly trapFocus = (event: KeyboardEvent): void => {
    const element = this.element;
    if (!element || element.hidden || event.key !== 'Tab') return;

    const focusable = queryAll('button, [href]', element).filter(
      (node) => !node.hasAttribute('disabled'),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  private accept(): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Se volvera a preguntar en la proxima visita. Tampoco pasa nada.
    }
    this.close();
  }

  private reject(): void {
    window.location.replace(EXIT_URL);
  }

  private close(): void {
    const element = this.element;
    if (!element) return;

    element.dataset.state = 'leaving';
    delete document.documentElement.dataset.ageLock;

    window.setTimeout(() => {
      element.hidden = true;
      delete element.dataset.state;
      this.lastFocused?.focus();
    }, 320);

    for (const detach of this.detachers) detach();
    this.detachers.length = 0;
  }

  destroy(): void {
    for (const detach of this.detachers) detach();
    this.detachers.length = 0;
    delete document.documentElement.dataset.ageLock;
  }
}
