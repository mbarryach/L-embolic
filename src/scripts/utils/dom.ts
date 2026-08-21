/**
 * Ayudas de DOM. Existen para no repetir el mismo `if (!el) return` en
 * treinta sitios y para que TypeScript deje de quejarse con razon.
 */

// Mismo patron que el querySelector nativo: quien llama dice que espera.
// La regla se queja de que T solo aparece una vez, pero es justo lo que
// queremos aqui — sin el generico habria un `as` en cada uso.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function query<T extends Element = HTMLElement>(
  selector: string,
  scope: ParentNode = document,
): T | null {
  return scope.querySelector<T>(selector);
}

export function queryAll<T extends Element = HTMLElement>(
  selector: string,
  scope: ParentNode = document,
): T[] {
  return Array.from(scope.querySelectorAll<T>(selector));
}

/** Lee una custom property de CSS ya resuelta (util para pasar colores a WebGL). */
export function readCssVar(name: string, scope: Element = document.documentElement): string {
  return getComputedStyle(scope).getPropertyValue(name).trim();
}

export function setCssVar(
  name: string,
  value: string,
  scope: HTMLElement = document.documentElement,
): void {
  scope.style.setProperty(name, value);
}

/**
 * Añade un listener y devuelve la funcion que lo quita. Suena a tonteria
 * pero es lo que evita que la pagina acabe con listeners zombis.
 */
export function on<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions,
): () => void;
export function on<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  handler: (event: DocumentEventMap[K]) => void,
  options?: AddEventListenerOptions,
): () => void;
export function on<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions,
): () => void;
export function on(
  target: EventTarget,
  type: string,
  handler: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions,
): () => void {
  target.addEventListener(type, handler, options);
  return () => {
    target.removeEventListener(type, handler, options);
  };
}
