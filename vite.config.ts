import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { htmlPartials } from './vite/htmlPartials';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  // Rutas relativas: asi el build sirve igual en la raiz de un dominio que
  // colgando de /L-embolic/ en GitHub Pages, sin tocar nada.
  base: './',

  plugins: [htmlPartials({ root })],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/scripts', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
    },
  },

  build: {
    target: 'es2022',
    cssTarget: 'safari16',
    modulePreload: { polyfill: false },
    // three ronda los 510 kB sin comprimir y no hay forma de bajarlo mucho
    // mas. No pasa nada: va en un chunk aparte que se pide con import()
    // despues del primer pintado, asi que no bloquea nada. El aviso por
    // defecto solo seria ruido en cada build.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // three pesa lo suyo: lo mandamos a su propio chunk para que el HTML y
        // el CSS entren solos y la escena 3D llegue detras sin bloquear nada.
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap')) return 'gsap';
          return undefined;
        },
      },
    },
  },

  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
  },
});
