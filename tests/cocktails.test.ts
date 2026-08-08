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
});
