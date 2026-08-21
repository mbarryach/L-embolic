import { App } from './core/App';

/**
 * Punto de entrada. Poca cosa a proposito: monta la App y se quita de en
 * medio. Toda la logica esta en modulos, aqui solo se enciende la luz.
 */
const app = new App();

void app.start().catch((error: unknown) => {
  console.error("[l'embolic] arranque fallido:", error);
  // Pase lo que pase, el telon se levanta. La pagina funciona sin JS, asi
  // que dejarla tapada por un error seria el peor de los mundos.
  document.querySelector('[data-loader]')?.setAttribute('hidden', '');
});

// Hot reload en desarrollo: sin esto se van acumulando escenas, contextos
// WebGL y ScrollTriggers uno encima de otro hasta que el navegador se rinde.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.destroy();
  });
}
