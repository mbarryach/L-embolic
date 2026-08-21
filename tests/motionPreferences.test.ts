import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MotionPreferences } from '../src/scripts/animation/MotionPreferences';

type ChangeListener = () => void;

/** matchMedia de mentira con un interruptor para cambiar de opinion en vivo. */
function stubMatchMedia(initial: boolean) {
  const listeners = new Set<ChangeListener>();
  let matches = initial;

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return matches;
      },
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: (_type: string, listener: ChangeListener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: ChangeListener) => listeners.delete(listener),
      dispatchEvent: () => true,
    })),
  );

  return {
    flip(next: boolean) {
      matches = next;
      for (const listener of listeners) listener();
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

describe('MotionPreferences', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-motion');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detecta que se ha pedido menos movimiento', () => {
    stubMatchMedia(true);
    const motion = new MotionPreferences();
    expect(motion.level).toBe('reduced');
    expect(motion.isReduced).toBe(true);
    motion.destroy();
  });

  it('por defecto va a todo movimiento', () => {
    stubMatchMedia(false);
    const motion = new MotionPreferences();
    expect(motion.level).toBe('full');
    motion.destroy();
  });

  it('deja el nivel escrito en el <html> para que lo lea el CSS', () => {
    stubMatchMedia(true);
    const motion = new MotionPreferences();
    expect(document.documentElement.dataset.motion).toBe('reduced');
    motion.destroy();
  });

  it('reacciona si se cambia la preferencia a mitad de sesion', () => {
    const media = stubMatchMedia(false);
    const motion = new MotionPreferences();
    const seen: string[] = [];
    motion.subscribe((level) => seen.push(level));

    media.flip(true);

    expect(seen).toEqual(['reduced']);
    expect(document.documentElement.dataset.motion).toBe('reduced');
    motion.destroy();
  });

  it('destroy suelta el listener del media query', () => {
    const media = stubMatchMedia(false);
    const motion = new MotionPreferences();
    expect(media.listenerCount).toBe(1);
    motion.destroy();
    expect(media.listenerCount).toBe(0);
  });
});
