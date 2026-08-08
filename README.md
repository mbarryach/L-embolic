# L'embolic

Web de **L'embolic**, cocteleria i torrades a la Rambla de Jaume I, 67 — Cambrils (Tarragona).

Experiencia de una sola página con narrativa dirigida por scroll: una escena WebGL fija
detrás del contenido por la que la cámara avanza a medida que se baja, de forma que las
cinco secciones se leen como un único espacio y no como bloques apilados.

---

## Objetivo

Reinterpretar la web original manteniendo su personalidad —fondo nocturno, neones,
teal/coral/mostaza, banderines, tono catalán informal y el lema _"el caos més divertit"_—
pero elevando la ejecución a un lenguaje visual de estudio creativo.

El concepto de dirección de arte es **"organized chaos"**: al principio todo está recogido
dentro de una copa; conforme se baja, el hielo y los ingredientes se sueltan y la escena se
complica; al final las partículas se vuelven a juntar detrás del logotipo.

Prioridades, en este orden: identidad → UX → dirección de arte → rendimiento → arquitectura
→ accesibilidad → mantenibilidad → efectos. Los efectos nunca van por delante de la lectura.

---

## Stack

| Pieza        | Elección                      | Motivo                                       |
| ------------ | ----------------------------- | -------------------------------------------- |
| Bundler      | **Vite 7**                    | Dev server rápido, build sin configurar nada |
| Lenguaje     | **TypeScript 5.9** (strict)   | Sin `any`, sin `@ts-ignore`                  |
| 3D           | **Three.js**                  | Geometría procedural, sin modelos externos   |
| Motion       | **GSAP + ScrollTrigger**      | Timelines y scroll sincronizado              |
| Scroll suave | **Lenis**                     | Solo escritorio con ratón (ver más abajo)    |
| Markup       | HTML semántico + parciales    | Plugin propio de ~70 líneas                  |
| Estilos      | CSS moderno con `@layer`      | Sin framework, sin CSS-in-JS                 |
| Tests        | **Vitest** + jsdom            | Utilidades, lifecycle y contratos            |
| Calidad      | ESLint · Prettier · Stylelint | `npm run validate` lo pasa todo              |

No hay React, ni Tailwind, ni ninguna librería de componentes. El markup vive en `.html`,
los estilos en `.css` y el comportamiento en `.ts`, cada uno en su sitio.

---

## Requisitos

- Node.js **20.19+** o **22.12+**
- npm 10+

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173`. Los parciales HTML recargan la página al guardarlos.

## Build y previsualización

```bash
npm run build
```

```bash
npm run preview
```

## Calidad

```bash
npm run validate
```

Ejecuta lint, typecheck, tests y build. Por separado:

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm run test
```

```bash
npm run format
```

---

## Estructura

```
index.html                  Entrada de Vite: <head>, SEO, JSON-LD e includes
vite/htmlPartials.ts        Plugin que expande <!-- @include ... -->
scripts/optimize-images.mjs Pipeline de fotos (AVIF/WebP + tarjeta social)

src/
├── components/             Un directorio por bloque: markup + estilos juntos
│   ├── loader/  bunting/  header/  hero/  marquee/
│   └── about/  cocktails/  location/  footer/  ui/
│
├── styles/
│   ├── index.css           Declara las capas e importa todo lo demás
│   ├── reset.css  tokens.css  typography.css
│   └── globals.css  layout.css  animations.css  utilities.css
│
├── scripts/
│   ├── main.ts             Arranca la App y poco más
│   ├── core/               App · EventBus · Ticker · Viewport · Loader
│   ├── animation/          ScrollManager · MotionPreferences · timelines/
│   ├── three/              Experience (fachada) · Camera · Renderer · World
│   │   ├── materials/      Shader de neón y texturas de canvas
│   │   └── objects/        Glass · Ice · Garnish · Bottles · Particles · NeonSign
│   ├── interactions/       Navigation · MagneticButton · PointerParallax · Bunting
│   └── utils/              math · dom · device · splitChars
│
├── data/cocktails.ts       Índice de la carta (contrato con el markup)
└── assets/
    ├── photos-src/         Originales sin tocar
    └── photos/             Variantes optimizadas (versionadas en el repo)

public/                     favicon, robots.txt, og-image.png
tests/                      Vitest
docs/                       Decisiones de arquitectura, rendimiento y motion
```

---

## Escenas

El scroll de toda la página se normaliza a un valor `0..1` y ese valor mueve una cámara por
un recorrido de seis puntos clave. No hay una escena 3D por sección: hay **una sola escena**
y la cámara la recorre.

| Progreso | Sección    | Qué pasa                                                      |
| -------- | ---------- | ------------------------------------------------------------- |
| 0.00     | Hero       | Copa montada, hielo suspendido, cámara cerca                  |
| 0.16     | Marquesina | La cámara se retira, el hielo empieza a soltarse              |
| 0.34     | Qui som    | La escena se va a la derecha y deja sitio al texto            |
| 0.58     | La carta   | Profundidad: entran las botellas, el acento cambia por cóctel |
| 0.82     | On som     | Casi todo en la niebla, solo quedan partículas                |
| 1.00     | Outro      | Las partículas se agrupan detrás del logotipo                 |

La sección de la carta es un raíl horizontal. En escritorio se ancla (`pin`) y avanza con el
scroll; en táctil es un carrusel nativo con `scroll-snap`. En ambos casos, la lámina que cruza
la línea de foco se ilumina y **su color se propaga a toda la página**: barra de progreso,
subrayados y las luces de la escena 3D.

---

## Rendimiento

- **Un único bucle.** El ticker de GSAP mueve Three y Lenis. No hay tres
  `requestAnimationFrame` compitiendo. Se para solo cuando la pestaña se oculta.
- **Three va en un chunk aparte** y se carga con `import()` después del primer pintado. Si
  tarda o falla, la página ya se ve.
- **Sin modelos 3D.** La copa y las botellas son perfiles girados (`LatheGeometry`); las
  rodajas y las hojas son planos con texturas dibujadas en canvas. Cero descargas, ~9 draw
  calls.
- **Sin luces ni sombras.** Un único `ShaderMaterial` con fresnel y dos luces falsas cosidas
  al fragment shader. Un solo programa para toda la escena.
- **Tres perfiles de calidad** (`low`/`mid`/`high`) según núcleos, memoria y tipo de puntero.
  Ajustan DPR, antialias, número de partículas y si se dibujan las botellas.
- **DPR limitado a 2** como mucho, a 1 en gama baja.
- **Fotos** en AVIF y WebP, tres anchos, `loading="lazy"` y `width`/`height` declarados para
  no provocar saltos de layout.
- Solo se animan `transform` y `opacity`.

Detalle en [`docs/performance.md`](docs/performance.md).

---

## Fotografía y assets

Los originales viven en `src/assets/photos-src/`. Para regenerar las variantes:

```bash
npm run assets:images
```

Genera AVIF y WebP a 420/700/1040 px en `src/assets/photos/`, más `public/og-image.png`
recortada a 1200×630. Los resultados están versionados, así que **no hace falta `sharp` para
compilar**: solo para añadir o cambiar fotos.

> Ahora mismo hay foto de Tiki, Cocotro, Old Fashioned y Dry Basil. Mojito Meduixa y Margarita
> muestran su ilustración de trazo hasta que haya foto: basta con dejar el archivo en
> `photos-src/`, ejecutar el script y cambiar el `<div class="plate__sketch">` por un bloque
> `<figure class="plate__shot">` en `src/components/cocktails/cocktails.html`.

---

## Accesibilidad

Objetivo WCAG 2.2 AA razonable.

- HTML semántico, un solo `<h1>`, jerarquía de encabezados correcta.
- Enlace "salta al contingut" y `:focus-visible` visible en todo.
- Menú móvil con `aria-expanded`, cierre con `Esc` y devolución del foco al botón.
- Áreas táctiles de 44 px como mínimo.
- El canvas es decorativo (`aria-hidden`). **Nada de lo que cuenta la escena 3D es información
  exclusiva**: dirección, horario, teléfono y carta están en el DOM.
- Halo de texto sobre los bloques de lectura para que la escena no reste contraste.

### `prefers-reduced-motion`

No es "apagar las animaciones". Es otra experiencia:

- Lenis no se activa; scroll nativo.
- La escena 3D **se sigue viendo**, pero se renderiza bajo demanda: solo se dibuja un frame
  cuando cambia el scroll, el tamaño o el cóctel en foco. Nada orbita, nada gira.
- Sin parallax de ratón ni cámara animada.
- Todo el contenido está visible desde el primer momento; nada depende de una animación de
  entrada para poder leerse.

### Sin WebGL o sin JavaScript

- Si WebGL no arranca, un fondo pintado con CSS ocupa su lugar. Nunca hay pantalla negra.
- Sin JavaScript la página se lee entera: el loader se oculta por CSS y no hay contenido
  escondido esperando a un script.

---

## SEO

`title`, `description`, `canonical`, OpenGraph, Twitter Card y JSON-LD de tipo `BarOrCafe`
con la dirección, el teléfono y el horario reales del negocio. No hay datos inventados.

> Antes de publicar, cambia `https://mbarryach.github.io/L-embolic/` por el dominio definitivo
> en el `canonical`, las metaetiquetas OpenGraph y el JSON-LD de `index.html`.

---

## Despliegue

El build es estático (`dist/`) y funciona en cualquier hosting de archivos. `base` está en
`'./'`, así que sirve igual en la raíz de un dominio que colgando de un subdirectorio como
GitHub Pages.

---

## Architecture Decisions

**Vanilla en vez de un framework.** No hay estado compartido ni vistas que reconciliar: es una
página con una escena 3D. React añadiría peso y un modelo mental innecesario, y complicaría
mantener markup, estilos y comportamiento separados de verdad.

**Plugin de parciales propio en vez de Handlebars o Nunjucks.** Lo único que hace falta es
pegar markup estático en un `index.html`. Son ~70 líneas, no hay lógica de plantillas, y así
no se arrastra —ni se audita, ni se actualiza— una dependencia más.

**Un único ticker, y es el de GSAP.** GSAP ya tiene su `requestAnimationFrame` corriendo. Abrir
otro para Three y un tercero para Lenis sería pagar tres veces y encima desincronizado.

**El progreso de scroll se mide con `ScrollTrigger.maxScroll`, no con el `<body>`.** La carta se
ancla y añade miles de píxeles _después_ de que se cree el tracker; medir la altura del body una
sola vez hacía que el progreso llegase a 1 a media página.

**Geometría procedural en vez de GLTF.** Una copa es una silueta girada sobre un eje. Un modelo
descargable costaría cientos de kilobytes y un cargador para conseguir lo mismo.

**Un solo `ShaderMaterial` para toda la escena.** Menos cambios de estado en la GPU y, sobre
todo, coherencia visual: mismo vidrio, mismo borde, mismo idioma en todos los objetos.

**Colores en CSS, no en TypeScript.** El acento de cada cóctel se declara en el markup
(`data-accent`) y se resuelve en `tokens.css`. JavaScript lo lee con `getComputedStyle` y se lo
pasa a Three. Una sola fuente de verdad para el color.

**`data/cocktails.ts` es un índice, no el contenido.** El texto de la carta vive en el HTML.
El índice existe para que un test verifique que markup y datos no se separen con el tiempo.

**Lenis solo con ratón.** En táctil el scroll del sistema ya va fino y meterse por medio se
nota. Con `prefers-reduced-motion` no se carga en absoluto.

Más contexto en [`docs/architecture.md`](docs/architecture.md) y
[`docs/animation-system.md`](docs/animation-system.md).
