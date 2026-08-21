export interface SplitResult {
  readonly chars: HTMLElement[];
  /** Devuelve el elemento a su texto de siempre. */
  restore(): void;
}

/**
 * Parte el texto de un elemento en un span por caracter.
 *
 * Ojo con esto: crea nodos, no markup en strings, y solo debe usarse en
 * texto decorativo o marcado como aria-hidden. Si un lector de pantalla se
 * encuentra nueve spans sueltos puede acabar deletreando la palabra, y
 * escuchar "ele - apostrofe - e - eme..." no se lo merece nadie.
 */
export function splitChars(element: HTMLElement): SplitResult {
  const original = element.textContent;
  const chars: HTMLElement[] = [];
  const fragment = document.createDocumentFragment();

  for (const character of original.trim()) {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = character;
    fragment.append(span);
    chars.push(span);
  }

  element.replaceChildren(fragment);

  return {
    chars,
    restore: () => {
      element.textContent = original;
    },
  };
}
