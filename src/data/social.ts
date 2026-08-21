/**
 * Datos que el propietario actualiza a mano.
 *
 * IMPORTANTE sobre las resenyas: aqui NO hay textos de resenya, y no es un
 * olvido. Traerlas de verdad exige la Places API de Google (clave, cuenta
 * de facturacion y un proxy que la guarde), y copiarlas a mano seria
 * ponerle a la web opiniones escritas por gente que no ha dado permiso.
 *
 * Asi que la seccion ensena la nota y cuantas opiniones hay — dos numeros
 * que el propietario copia de su ficha — y manda a leerlas a Google, que
 * es donde estan y donde se ven actualizadas.
 *
 * Para ponerlo al dia: abre la ficha del negocio en Google Maps y copia
 * aqui la puntuacion y el numero de opiniones.
 */
export interface GoogleListing {
  /** Puntuacion media, tal cual la muestra Google. */
  readonly rating: number;
  /** Cuantas opiniones hay ahora mismo. */
  readonly reviewCount: number;
  /** Enlace corto a la ficha. */
  readonly url: string;
  /** Cuando se actualizaron estos numeros (AAAA-MM). */
  readonly checked: string;
}

export const GOOGLE_LISTING: GoogleListing = {
  rating: 4.8,
  reviewCount: 96,
  url: 'https://maps.app.goo.gl/USsDxVwN7iSmK5tMA',
  checked: '2026-08',
};

export interface SocialLink {
  readonly id: string;
  readonly label: string;
  readonly url: string;
}

/**
 * Solo hay lo que consta en el proyecto: Instagram, telefono, WhatsApp y la
 * ficha de Google. No se inventan perfiles de TikTok o Facebook — si el bar
 * los tiene, se añaden aqui y aparecen solos en el pie.
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { id: 'instagram', label: '@emboliccambrils', url: 'https://instagram.com/emboliccambrils' },
  { id: 'google', label: 'Google Maps', url: GOOGLE_LISTING.url },
  { id: 'phone', label: '649 98 22 50', url: 'tel:+34649982250' },
];
