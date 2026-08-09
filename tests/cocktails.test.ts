import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COCKTAILS } from '../src/data/cocktails';

// Con el entorno jsdom, import.meta.url no es un file:// de verdad, asi que
// las rutas se cuelgan de la raiz del proyecto y en paz.
const markup = readFileSync(
  resolve(process.cwd(), 'src/components/cocktails/cocktails.html'),
  'utf8',
);

function parsePlates(): HTMLElement[] {
  const root = document.createElement('div');
  root.innerHTML = markup;
  return Array.from(root.querySelectorAll<HTMLElement>('.plate'));
}

/**
 * Contrato entre el markup y los datos.
 *
 * La carta esta escrita en HTML (que es donde va el contenido) y el indice
 * en TypeScript (que es lo que lee el JS). Si alguien añade un coctel en un
 * sitio y se olvida del otro, salta esto en vez de salir un color raro en
 * produccion tres semanas despues.
 */
describe('la carta del markup y la del indice van a la par', () => {
  it('hay los mismos cocteles y en el mismo orden', () => {
    const ids = parsePlates().map((plate) => plate.dataset.cocktail);
    expect(ids).toEqual(COCKTAILS.map((cocktail) => cocktail.id));
  });

  it('los nombres coinciden con los del indice', () => {
    const names = parsePlates().map((plate) =>
      plate.querySelector('.plate__name')?.textContent.trim(),
    );
    expect(names).toEqual(COCKTAILS.map((cocktail) => cocktail.name));
  });

  it('cada lamina declara el acento que le toca', () => {
    const accents = parsePlates().map((plate) => plate.dataset.accent);
    expect(accents).toEqual(COCKTAILS.map((cocktail) => cocktail.accent));
  });

  it('ninguna lamina se queda sin ingredientes', () => {
    for (const plate of parsePlates()) {
      const recipe = plate.querySelector('.plate__recipe')?.textContent.trim() ?? '';
      expect(recipe.length).toBeGreaterThan(10);
    }
  });

  it('los indices visibles van del 01 al 06 sin saltos', () => {
    const indexes = parsePlates().map((plate) =>
      plate.querySelector('.plate__index')?.textContent.trim(),
    );
    expect(indexes).toEqual(['01', '02', '03', '04', '05', '06']);
  });

  it('la galería ofrece un punto de navegación por cada cóctel', () => {
    const root = document.createElement('div');
    root.innerHTML = markup;
    const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-gallery-dot]'));

    expect(dots.map((button) => button.dataset.galleryDot)).toEqual(['0', '1', '2', '3', '4', '5']);
    expect(dots.map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
      'false',
      'false',
      'false',
    ]);
  });

  it('cada punto dice a qué cóctel lleva, aunque solo se vea una rayita', () => {
    // El punto es una raya de 2 px: sin el texto oculto, un lector de
    // pantalla anunciaria seis botones sin nombre.
    const root = document.createElement('div');
    root.innerHTML = markup;
    const labels = Array.from(root.querySelectorAll('[data-gallery-dot] .visually-hidden')).map(
      (node) => node.textContent.trim(),
    );

    expect(labels).toEqual(COCKTAILS.map((cocktail) => cocktail.name));
  });

  it('las flechas de la galería llevan etiqueta accesible', () => {
    const root = document.createElement('div');
    root.innerHTML = markup;
    for (const selector of ['[data-gallery-prev]', '[data-gallery-next]']) {
      const button = root.querySelector(selector);
      expect(button?.getAttribute('aria-label')?.length ?? 0).toBeGreaterThan(3);
    }
  });
});
