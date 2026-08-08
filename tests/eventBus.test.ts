import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../src/scripts/core/EventBus';

interface TestEvents {
  ping: number;
  pong: string;
}

describe('EventBus', () => {
  it('avisa a quien se ha apuntado', () => {
    const bus = new EventBus<TestEvents>();
    const spy = vi.fn();
    bus.on('ping', spy);
    bus.emit('ping', 42);
    expect(spy).toHaveBeenCalledWith(42);
  });

  it('no mezcla eventos distintos', () => {
    const bus = new EventBus<TestEvents>();
    const spy = vi.fn();
    bus.on('ping', spy);
    bus.emit('pong', 'hola');
    expect(spy).not.toHaveBeenCalled();
  });

  it('la funcion que devuelve on() da de baja', () => {
    const bus = new EventBus<TestEvents>();
    const spy = vi.fn();
    const off = bus.on('ping', spy);
    off();
    bus.emit('ping', 1);
    expect(spy).not.toHaveBeenCalled();
  });

  it('aguanta que un handler se borre a si mismo durante el emit', () => {
    // Justo el caso que rompe si se recorre el Set original en vez de una
    // copia. Por eso esta el spread dentro de emit().
    const bus = new EventBus<TestEvents>();
    const calls: string[] = [];

    const off = bus.on('ping', () => {
      calls.push('primero');
      off();
    });
    bus.on('ping', () => calls.push('segundo'));

    expect(() => {
      bus.emit('ping', 0);
    }).not.toThrow();
    expect(calls).toEqual(['primero', 'segundo']);

    bus.emit('ping', 0);
    expect(calls).toEqual(['primero', 'segundo', 'segundo']);
  });

  it('emitir sin nadie escuchando no revienta', () => {
    const bus = new EventBus<TestEvents>();
    expect(() => {
      bus.emit('ping', 1);
    }).not.toThrow();
  });

  it('clear se lleva todo por delante', () => {
    const bus = new EventBus<TestEvents>();
    const spy = vi.fn();
    bus.on('ping', spy);
    bus.clear();
    bus.emit('ping', 1);
    expect(spy).not.toHaveBeenCalled();
  });
});
