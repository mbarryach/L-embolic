import { GOOGLE_LISTING } from '../../data/social';
import { query, queryAll } from '../utils/dom';

/** Cuantas estrellas se pintan como maximo. */
const MAX_STARS = 5;

/**
 * Escribe la nota de Google en la seccion de resenyas.
 *
 * Los numeros viven en src/data/social.ts y los actualiza el propietario a
 * mano. Aqui solo se pintan, se formatean con la coma decimal que toca en
 * catalan y castellano, y se dibujan las estrellas.
 *
 * No hay ninguna llamada a Google: para leer las opiniones se va a la
 * ficha, que es donde estan y donde salen al dia.
 */
export class GoogleListingBadge {
  constructor() {
    const { rating, reviewCount, url } = GOOGLE_LISTING;

    const ratingNode = query('[data-google-rating]');
    if (ratingNode) ratingNode.textContent = formatRating(rating);

    const countNode = query('[data-google-count]');
    if (countNode) countNode.textContent = String(reviewCount);

    const stars = query('[data-google-stars]');
    if (stars) {
      stars.textContent = drawStars(rating);
      // El texto son estrellas sueltas; sin esto un lector de pantalla
      // deletrearia "estrella estrella estrella..." y no dice nada.
      stars.setAttribute('aria-label', `${formatRating(rating)} / ${String(MAX_STARS)}`);
    }

    for (const link of queryAll<HTMLAnchorElement>('[data-google-link]')) {
      link.href = url;
    }
  }

  destroy(): void {
    // No engancha nada: no hay nada que soltar.
  }
}

/** 4.8 -> "4,8". En catalan y castellano el decimal va con coma. */
function formatRating(rating: number): string {
  return rating.toFixed(1).replace('.', ',');
}

/** Estrellas llenas hasta la nota, y huecas el resto. */
function drawStars(rating: number): string {
  const filled = Math.round(rating);
  return '★'.repeat(Math.min(filled, MAX_STARS)) + '☆'.repeat(Math.max(MAX_STARS - filled, 0));
}
