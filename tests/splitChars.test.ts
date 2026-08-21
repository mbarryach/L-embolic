import { describe, expect, it } from 'vitest';
import { splitChars } from '../src/scripts/utils/splitChars';

function makeElement(text: string): HTMLElement {
  const element = document.createElement('p');
  element.textContent = text;
  return element;
}

describe('splitChars', () => {
  it('crea un span por caracter', () => {
    const element = makeElement('abc');
    const split = splitChars(element);
    expect(split.chars).toHaveLength(3);
    expect(element.querySelectorAll('.char')).toHaveLength(3);
  });

  it('no se come ningun caracter por el camino', () => {
    const element = makeElement("l'embolic");
    splitChars(element);
    expect(element.textContent).toBe("l'embolic");
  });

  it('mantiene los espacios interiores', () => {
    const element = makeElement('el caos');
    const split = splitChars(element);
    expect(split.chars).toHaveLength(7);
    expect(split.chars[2]?.textContent).toBe(' ');
  });

  it('restore devuelve el elemento a como estaba', () => {
    const element = makeElement('hola');
    const split = splitChars(element);
    split.restore();
    expect(element.querySelectorAll('.char')).toHaveLength(0);
    expect(element.textContent).toBe('hola');
  });

  it('con el elemento vacio no monta un drama', () => {
    const element = makeElement('');
    const split = splitChars(element);
    expect(split.chars).toHaveLength(0);
    expect(() => {
      split.restore();
    }).not.toThrow();
  });
});
