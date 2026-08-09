# Sistema de motion

## Quién hace qué

Tres tecnologías, tres trabajos, sin solaparse:

|           | Se encarga de                              | Ejemplos                                                                         |
| --------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| **CSS**   | Estados e interacciones pequeñas           | Hover de enlaces, banderines, marquesina, parpadeo del neón, foco de las láminas |
| **GSAP**  | Timelines y todo lo que dependa del scroll | Entrada del hero, revelados, raíl anclado, parallax                              |
| **Three** | Profundidad y objetos reales               | Cámara, copa, hielo, ingredientes, partículas                                    |

La prueba del algodón: si CSS puede resolverlo, lo resuelve CSS. Los banderines se mueven con
`animation` y `nth-child` en vez de con veintidós tweens de GSAP corriendo aunque no se vean.

## Tokens

Tres duraciones y dos curvas. Se declaran dos veces —en `tokens.css` para CSS y en
`motionTokens.ts` para GSAP— y hay que mantenerlas a la par.

```
--dur-fast    180ms   DURATION.fast    0.18
--dur-medium  420ms   DURATION.medium  0.42
--dur-slow    900ms   DURATION.slow    0.90

--ease-standard  cubic-bezier(0.4, 0, 0.2, 1)    EASE.standard  power2.out
--ease-emphasis  cubic-bezier(0.16, 1, 0.3, 1)   EASE.emphasis  expo.out
```

Dos curvas, no diez: `standard` para lo funcional y `emphasis` para lo que tiene que
lucirse. Si algún día hace falta una tercera, se añade aquí y en `tokens.css`, no suelta
dentro de un tween.

Cuando una web usa treinta easings distintos se nota, y no para bien.

## Ciclo de vida de una timeline

Cada sección expone una factory que devuelve `{ play?, destroy }`:

```ts
export function createAboutTimeline({ motion }: TimelineContext): SectionTimeline | null {
  const section = query('.about');
  if (!section || motion.isReduced) return null;

  const context = gsap.context(() => {
    // los tweens y ScrollTriggers viven aquí dentro
  }, section);

  return {
    destroy: () => {
      context.revert();
    },
  };
}
```

Devolver `null` es una respuesta válida: significa "en estas condiciones esta sección no anima".
`AnimationManager` las guarda todas y las mata de golpe. Como todo va dentro de un
`gsap.context()` con scope, `revert()` se lleva también los ScrollTriggers creados dentro — que
es justo lo que se olvida siempre y acaba en fugas.

## Jerarquía de movimiento

No todo se mueve, y lo que se mueve no se mueve igual. Cada sección tiene su propio gesto a
propósito: si todas entraran igual, la página sería un desfile.

| Sección  | Gesto                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------- |
| Hero     | Los tubos del neón encienden **de uno en uno y en desorden**, con dos parpadeos                     |
| Qui som  | Las líneas del titular suben desde debajo de su ventanilla; los nombres de cóctel se subrayan solos |
| La carta | El escenario se revela, la foto cambia por capas y cada tramo de scroll sirve un cóctel             |
| On som   | La dirección entra entera, de una pieza, y luego deriva despacio                                    |
| Outro    | Único sitio con revelado letra a letra                                                              |

El revelado genérico (`[data-reveal]`, subir 22 px y aparecer) es el movimiento de fondo, el que
casi no se ve.

## El encendido del neón

Detalle no obvio: el parpadeo lento en bucle está en CSS bajo la clase `.neon--lit`, y GSAP la
añade **al terminar** la entrada.

Tiene que ser así. Una animación CSS gana en la cascada a un `style` inline, así que si la clase
estuviera puesta desde el principio, el bucle pisaría las opacidades que GSAP escribe durante la
entrada y el encendido se vería a saltos.

## Scroll

`ScrollManager` normaliza el scroll de la página a `0..1` y lo publica de dos formas: como
custom property `--scroll-progress` (para CSS) y por el bus (para la escena 3D).

El trigger maestro **no usa el `<body>` como referencia**:

```ts
ScrollTrigger.create({
  start: 0,
  end: () => ScrollTrigger.maxScroll(window),
  invalidateOnRefresh: true,
  refreshPriority: -1,
  // ...
});
```

Con `trigger: body` y `end: 'bottom bottom'`, la altura se mide al crear el trigger — antes de
que la carta se ancle y meta ~3000 px de relleno. El progreso llegaba a 1 a media página y la
cámara terminaba su recorrido en la sección equivocada. El `refreshPriority: -1` lo deja
recalcularse el último, cuando los pines ya han dicho cuánto ocupan.

## Lenis

Se activa solo si hay ratón y no hay `prefers-reduced-motion`. Integración:

- `autoRaf: false`, y `lenis.raf()` se llama desde el ticker de GSAP. Un solo bucle.
- `lenis.on('scroll', ...)` dispara `ScrollTrigger.update()`, si no el scroll va por un lado y
  las animaciones por otro.
- `gsap.ticker.lagSmoothing(0)`.
- Los enlaces internos pasan por `ScrollManager.scrollTo()`, que usa Lenis si está y
  `scrollIntoView` si no. También mueven el foco al destino, para que el teclado no se quede
  arriba.
- `<html>` lleva `data-lenis="on"` mientras esté activo, y el CSS usa ese atributo para no
  aplicar `scroll-behavior: smooth` a la vez (dos suavizados peleándose se nota mucho).

## Reduced motion

Cada factory decide qué hacer; no hay un interruptor global que lo apague todo:

- La mayoría devuelve `null` y el contenido se queda visible (`[data-motion="reduced"]
[data-reveal] { opacity: 1 }`).
- `aboutTimeline` pinta los subrayados de golpe en vez de animarlos: el adorno existe, pero
  quieto.
- `heroTimeline` marca el neón como encendido directamente y se salta la secuencia.
- `cocktailMenuTimeline` no ancla nada; los índices, flechas, teclado y gesto táctil siguen
  cambiando la copa sin animaciones espaciales.
- Los bucles ambientales (grano, banderines, marquesina) se paran en `animations.css`, y las
  transiciones bajan a 120 ms.
