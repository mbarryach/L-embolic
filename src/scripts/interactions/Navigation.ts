import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { query, queryAll, on } from '../utils/dom';
import type { ScrollManager } from '../animation/ScrollManager';

const CONDENSE_AT = 90;

/**
 * Cabecera y navegacion.
 *
 * Tres cosas: encoger la barra al bajar, abrir y cerrar el menu de movil
 * sin dejar a nadie tirado con el teclado, y llevar los enlaces internos
 * al sitio correcto descontando lo que ocupa la propia cabecera.
 */
export class Navigation {
  private readonly header: HTMLElement | null;
  private readonly toggle: HTMLButtonElement | null;
  private readonly panel: HTMLElement | null;
  private readonly label: HTMLElement | null;
  private readonly detachers: (() => void)[] = [];
  private condenseTrigger: ScrollTrigger | null = null;
  private open = false;

  constructor(private readonly scroll: ScrollManager) {
    this.header = query('[data-header]');
    this.toggle = query<HTMLButtonElement>('[data-menu-toggle]');
    this.panel = query('[data-menu-panel]');
    this.label = query('[data-menu-label]');

    this.setupCondense();
    this.setupMenu();
    this.setupAnchors();
  }

  private setupCondense(): void {
    const header = this.header;
    if (!header) return;

    this.condenseTrigger = ScrollTrigger.create({
      start: `top -${CONDENSE_AT}`,
      end: 99999,
      onToggle: (self) => {
        header.dataset.condensed = String(self.isActive);
      },
    });
  }

  private setupMenu(): void {
    const { toggle, panel } = this;
    if (!toggle || !panel) return;

    this.detachers.push(
      on(toggle, 'click', () => {
        this.setMenu(!this.open);
      }),
    );

    this.detachers.push(
      on(document, 'keydown', (event) => {
        if (event.key === 'Escape' && this.open) {
          this.setMenu(false);
          toggle.focus();
        }
      }),
    );

    // Al elegir destino, el menu se cierra solo. Que se quede abierto
    // tapando la seccion a la que acabas de ir es de chiste.
    for (const link of queryAll('a', panel)) {
      this.detachers.push(
        on(link, 'click', () => {
          this.setMenu(false);
        }),
      );
    }
  }

  private setMenu(next: boolean): void {
    const { toggle, panel, header, label } = this;
    if (!toggle || !panel || !header) return;

    this.open = next;
    toggle.setAttribute('aria-expanded', String(next));
    panel.hidden = !next;
    header.dataset.menuOpen = String(next);
    if (label) {
      label.textContent = next
        ? (label.dataset.labelOpen ?? 'Tanca')
        : (label.dataset.labelClosed ?? 'Menú');
    }

    if (next) {
      this.scroll.stop();
      document.body.style.overflow = 'hidden';
      query<HTMLAnchorElement>('a', panel)?.focus();
    } else {
      this.scroll.start();
      document.body.style.removeProperty('overflow');
    }
  }

  private setupAnchors(): void {
    for (const link of queryAll<HTMLAnchorElement>('a[href^="#"]')) {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') continue;

      this.detachers.push(
        on(link, 'click', (event) => {
          const target = document.querySelector<HTMLElement>(targetId);
          if (!target) return;
          event.preventDefault();
          this.scroll.scrollTo(target, -this.headerHeight);
          // El hash se actualiza igual para que atras/adelante siga yendo.
          history.pushState(null, '', targetId);
          // Y el foco se va con el, si no el teclado se queda arriba.
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }),
      );
    }
  }

  private get headerHeight(): number {
    return this.header?.offsetHeight ?? 0;
  }

  destroy(): void {
    this.condenseTrigger?.kill();
    this.condenseTrigger = null;
    for (const detach of this.detachers) detach();
    this.detachers.length = 0;
    document.body.style.removeProperty('overflow');
  }
}
