import { query } from '../utils/dom';

/**
 * Los banderines se mueven con CSS, pero seguir animando 22 triangulos que
 * ya no se ven es tirar bateria. Esto los pausa en cuanto salen de pantalla.
 */
export class Bunting {
  private readonly observer: IntersectionObserver | null = null;

  constructor() {
    const element = query('[data-bunting]');
    if (!element || typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          element.dataset.visible = String(entry.isIntersecting);
        }
      },
      { threshold: 0 },
    );
    this.observer.observe(element);
  }

  destroy(): void {
    this.observer?.disconnect();
  }
}
