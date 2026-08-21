/** Nombre del token de color que usa cada coctel. Los valores viven en CSS. */
export type AccentToken = 'teal' | 'coral' | 'mustard' | 'sage';

export interface Cocktail {
  /** Coincide con el atributo data-cocktail del markup. */
  readonly id: string;
  readonly name: string;
  readonly accent: AccentToken;
}

/**
 * La carta, tal cual esta en el sitio original. Ni un coctel de mas ni un
 * precio inventado — esto es una propuesta de rediseño, no una carta nueva.
 *
 * Aqui NO hay ingredientes ni colores en hexadecimal a proposito:
 *  - el texto vive en cocktails.html, que es donde va el contenido
 *  - los colores viven en tokens.css, que es donde va el diseño
 *
 * Lo unico que hay es el indice: sirve de contrato entre las dos cosas, y
 * hay un test que revienta si el markup y esta lista dejan de coincidir.
 */
export const COCKTAILS: readonly Cocktail[] = [
  { id: 'mojito-meduixa', name: 'Mojito Meduixa', accent: 'teal' },
  { id: 'tiki', name: 'Tiki', accent: 'coral' },
  { id: 'margarita', name: 'Margarita', accent: 'mustard' },
  { id: 'cocotro', name: 'Cocotro / Cocoloco', accent: 'sage' },
  { id: 'old-fashioned', name: 'Old Fashioned', accent: 'coral' },
  { id: 'dry-basil', name: 'Dry Basil', accent: 'teal' },
];
