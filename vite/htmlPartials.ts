import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

/**
 * Sintaxis soportada dentro del HTML:
 *
 *   <!-- @include src/components/hero/hero.html -->
 *
 * La ruta es relativa a la raiz del proyecto. Se pueden anidar includes
 * dentro de los parciales (un parcial puede incluir a otro).
 */
const INCLUDE_RE = /^([ \t]*)<!--\s*@include\s+([^\s>]+)\s*-->[ \t]*$/gm;

const MAX_DEPTH = 8;

export interface ExpandOptions {
  /** Raiz del proyecto. Las rutas de los includes cuelgan de aqui. */
  readonly root: string;
  /** Fichero desde el que se pide el include (solo para los mensajes de error). */
  readonly from: string;
  /** Se le va avisando de cada parcial leido, para poder vigilarlo en dev. */
  readonly onRead?: (file: string) => void;
}

/**
 * Expande los `@include` de un HTML y devuelve el resultado.
 *
 * Funcion pura y sin dependencias de Vite a proposito: asi se puede probar
 * sin levantar un servidor entero, que es la mitad de la gracia.
 */
export function expandPartials(html: string, options: ExpandOptions): string {
  return expand(html, options, [resolve(options.from)]);
}

function expand(html: string, options: ExpandOptions, stack: readonly string[]): string {
  const { root, onRead } = options;

  if (stack.length > MAX_DEPTH) {
    throw new Error(
      `[html-partials] Demasiados includes anidados (>${String(MAX_DEPTH)}). Cadena: ${stack.join(' -> ')}`,
    );
  }

  return html.replace(INCLUDE_RE, (_match, indent: string, rawPath: string) => {
    const file = isAbsolute(rawPath) ? rawPath : resolve(root, rawPath);

    if (stack.includes(file)) {
      const chain = [...stack, file].map((p) => relative(root, p)).join(' -> ');
      throw new Error(`[html-partials] Include circular detectado: ${chain}`);
    }

    if (!existsSync(file)) {
      const source = relative(root, stack[stack.length - 1] ?? root);
      throw new Error(
        `[html-partials] No encuentro el parcial "${rawPath}" (pedido desde ${source})`,
      );
    }

    onRead?.(file);

    const raw = readFileSync(file, 'utf8').replace(/\s+$/, '');
    const expanded = expand(raw, options, [...stack, file]);

    // Reindentamos para que el HTML final no parezca un accidente.
    return expanded
      .split('\n')
      .map((line) => (line.trim().length > 0 ? indent + line : line))
      .join('\n');
  });
}

export interface HtmlPartialsOptions {
  readonly root: string;
}

/**
 * Mete parciales HTML dentro del index sin arrastrar Handlebars ni Nunjucks.
 *
 * Son setenta lineas y hacen exactamente lo que necesitamos: pegar markup
 * estatico. Ni logica, ni condicionales, ni bucles. Si algun dia hace falta
 * eso, ya lloraremos entonces — pero mientras tanto no hay una dependencia
 * mas que mantener ni que auditar.
 */
export function htmlPartials({ root }: HtmlPartialsOptions): Plugin {
  // Que ficheros hemos leido, para recargar en dev cuando alguno cambie.
  const partials = new Set<string>();
  let server: ViteDevServer | undefined;

  return {
    name: 'lembolic:html-partials',
    enforce: 'pre',

    configureServer(devServer) {
      server = devServer;
      devServer.watcher.on('change', (file) => {
        if (partials.has(resolve(file))) {
          devServer.ws.send({ type: 'full-reload', path: '*' });
        }
      });
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const from = ctx.filename || resolve(root, 'index.html');
        // En build se empieza de cero; si no, acabamos vigilando fantasmas.
        if (!server) partials.clear();

        return expandPartials(html, {
          root,
          from,
          onRead: (file) => {
            partials.add(file);
            server?.watcher.add(file);
          },
        });
      },
    },
  };
}
