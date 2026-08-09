// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { expandPartials } from '../vite/htmlPartials';

const root = process.cwd();
const from = resolve(root, 'index.html');

function expand(html: string): string {
  return expandPartials(html, { root, from });
}

describe('expandPartials', () => {
  it('mete el contenido del parcial donde estaba el comentario', () => {
    const output = expand('<body>\n  <!-- @include src/components/footer/footer.html -->\n</body>');
    expect(output).toContain('class="outro"');
    expect(output).not.toContain('@include');
  });

  it('respeta la indentacion del sitio donde se pega', () => {
    const output = expand('    <!-- @include src/components/footer/footer.html -->');
    expect(output.split('\n')[0]).toMatch(/^ {4}<footer/);
  });

  it('deja en paz el HTML que no lleva includes', () => {
    const html = '<p>tal cual</p>';
    expect(expand(html)).toBe(html);
  });

  it('canta si el parcial no existe, en vez de dejar un hueco silencioso', () => {
    expect(() => expand('<!-- @include src/components/no-existe.html -->')).toThrow(
      /no encuentro el parcial/i,
    );
  });

  it('avisa de cada parcial que lee para poder vigilarlo en dev', () => {
    const onRead = vi.fn();
    expandPartials('<!-- @include src/components/footer/footer.html -->', { root, from, onRead });
    expect(onRead).toHaveBeenCalledTimes(1);
    expect(String(onRead.mock.calls[0]?.[0])).toContain('footer.html');
  });

  it('el index de verdad se expande sin dejar marcadores sueltos', () => {
    // Comprobacion de humo: si un parcial se renombra y nadie actualiza el
    // index, el build peta aqui y no en produccion.
    const output = expand(readFileSync(from, 'utf8'));
    expect(output).not.toContain('@include');
    expect(output).toContain('id="carta"');
    expect(output).toContain('id="ambient"');
    expect(output).toContain('id="info"');
    expect(output).toContain('data-contact-dock');
    expect(output).toContain('data-stage-canvas');
  });
});
