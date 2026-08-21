# Arquitectura

Notas sobre cómo está montado esto y, sobre todo, por qué. Lo obvio no está documentado; lo
que se documenta es lo que sorprendería a alguien que abra el repo por primera vez.

## Separación de responsabilidades

La regla es literal, no aspiracional:

- **`.html`** — todo el contenido. Ni un texto de la carta vive en TypeScript.
- **`.css`** — toda la presentación, incluidos los colores de acento de cada cóctel.
- **`.ts`** — solo comportamiento. No construye markup con strings ni escribe estilos.

Las dos excepciones, ambas acotadas:

1. `splitChars()` crea un `<span>` por letra con `createElement` para poder animarlas. Solo se
   usa sobre texto decorativo marcado con `aria-hidden`.
2. Se escriben custom properties de CSS desde JS (`--scroll-progress`, `--c-accent`). Eso es
   pasar un dato al CSS, no aplicar estilos: quién decide el aspecto sigue siendo la hoja.

## Flujo de arranque

```
main.ts
  └─ App.start()
       ├─ Viewport            mide la ventana y avisa por el bus
       ├─ Ticker.start()      engancha el bucle único al ticker de GSAP
       ├─ ScrollManager       Lenis (si toca) + progreso global 0..1
       ├─ Navigation, MagneticButton, PointerParallax, Bunting
       ├─ AnimationManager    registra las timelines de cada sección
       ├─ await fuentes       ANTES de medir nada
       ├─ import('./three/Experience')   ← chunk aparte, diferido
       ├─ ScrollTrigger.refresh()
       ├─ Loader.finish()
       └─ heroTimeline.play()
```

Esperar a las fuentes antes de refrescar ScrollTrigger no es opcional: las fuentes cambian el
ancho de los titulares, los titulares cambian la altura del documento y la altura del documento
decide dónde empieza y acaba cada trigger. Si se mide antes, todos los triggers quedan
desplazados y no se nota hasta que alguien tiene la caché fría.

## El bus de eventos

`EventBus` es un pub/sub tipado de unas treinta líneas. Existe para que el `Viewport` no
conozca a la escena 3D, y para que la carta pueda anunciar "ahora manda el mostaza" sin saber
quién escucha.

Eventos: `viewport:resize`, `scroll:progress`, `pointer:move`, `cocktail:focus`.

Detalle que importa: `emit()` recorre una **copia** del set de handlers, porque un handler que
se da de baja a sí mismo durante el propio emit rompería la iteración. Hay un test para eso.

## Lifecycle y limpieza

Todo lo que se crea en `App` acaba en un array `teardowns` y muere en orden inverso al
destruirse. Cada pieza sabe soltar lo suyo:

| Pieza           | Qué suelta                                                         |
| --------------- | ------------------------------------------------------------------ |
| `Ticker`        | Su callback en `gsap.ticker` y el listener de `visibilitychange`   |
| `Viewport`      | `resize`, `orientationchange` y el timeout pendiente               |
| `ScrollManager` | El ScrollTrigger maestro, el tick de Lenis y la instancia de Lenis |
| Timelines       | `gsap.context().revert()` — se lleva también sus ScrollTriggers    |
| `Navigation`    | Todos los listeners y el `overflow` del body                       |
| `Experience`    | Geometrías, materiales, texturas, renderer y el contexto WebGL     |

`main.ts` engancha `import.meta.hot.dispose` a `App.destroy()`. Sin eso, en desarrollo se van
apilando contextos WebGL hasta que el navegador se planta (el límite ronda los 16).

## Escenas y cámara

No hay una escena por sección. Hay **una escena** y una cámara que la recorre según el
progreso global de scroll. De ahí que la web se sienta como un único espacio.

`Camera` guarda seis puntos clave (posición + punto de mira) e interpola entre ellos con
`smoothstep` para que no se note el salto de tramo. Los vectores se reutilizan: ni un `Vector3`
nuevo por frame.

`World` decide cómo se comportan los objetos a partir de tres valores derivados del progreso:

- `spread` (0.08 → 0.60): cuánto se ha desmontado la copa.
- `exit` (0.76 → 0.97): cuánto se han ido al fondo la copa y las botellas.
- `gather` (0.86 → 1.00): cuánto se recogen las partículas detrás del logotipo.

## Composición responsive de la escena

La escena tiene **dos composiciones**, no una encogida:

- **Apaisado** — la copa vive a la derecha (`x ≈ 0.95`) y el rótulo se queda con la mitad
  izquierda entera. Campo de visión 38°.
- **Vertical** — no hay sitio para ese juego: la copa se centra, baja y se escala al 72 %.
  Campo de visión 60°.

El cambio lo dispara el aspect ratio, no un breakpoint de CSS, porque lo que importa aquí es la
forma del encuadre. `Camera.resize()` se llama también desde el constructor: si solo se llamara
en el evento `resize`, el primer frame en móvil saldría con el campo de visión de escritorio y
la copa ocuparía la pantalla entera.

## Patrones usados (y los que no)

- **Facade** — `Experience` es la única puerta a Three. Fuera de `three/` nadie sabe que existe
  un renderer.
- **Observer** — el `EventBus`.
- **Strategy** — los perfiles de calidad de `device.ts` y las dos ramas de la carta (escenario
  anclado por scroll o selector táctil sin pin).

No hay factories, ni repositorios, ni servicios, ni contenedor de inyección. No hay dominio que
lo justifique.
