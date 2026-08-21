# Rendimiento

Rendimiento tratado como funcionalidad, no como algo que se mira al final.

## Presupuesto de carga

Medido con `npm run build`:

| Recurso      | Sin comprimir     | Gzip    | ¿Bloquea el primer pintado?  |
| ------------ | ----------------- | ------- | ---------------------------- |
| `index.html` | ~21 kB            | ~5 kB   | Sí                           |
| CSS          | ~28 kB            | ~7 kB   | Sí                           |
| JS de la app | ~38 kB            | ~12 kB  | No (módulo)                  |
| GSAP         | ~114 kB           | ~45 kB  | No                           |
| Three        | ~513 kB           | ~129 kB | **No** — `import()` diferido |
| Fotos        | 4 × ~90 kB (AVIF) | —       | No — `loading="lazy"`        |

Lo que hace falta para ver el bar son ~12 kB de gzip entre HTML y CSS. Three llega después,
cuando la página ya está en pantalla.

## El bucle

Un solo `requestAnimationFrame` en toda la página, y es el de GSAP. GSAP lo tiene corriendo de
todas formas, así que Three y Lenis se enganchan ahí en vez de abrir cada uno el suyo.

`Ticker` además:

- Recorta el delta a 50 ms. Al volver de una pestaña en segundo plano llega un salto enorme y
  sin recortar la escena pega un brinco.
- Se desengancha entero con `visibilitychange`. Pestaña oculta = cero trabajo.
- Llama a `gsap.ticker.lagSmoothing(0)`: con scroll suave por medio, la "corrección" de frames
  perdidos de GSAP produce tirones en la cámara.

## Coste de la escena 3D

**Draw calls: ~9.** Copa (2) + hielo (1 instanciado) + cítricos (1 instanciado) + hojas (1
instanciado) + botellas (1 instanciado, 3 unidades) + partículas (1) + aros de neón (2).

**Programas de shader: 3.** El material de neón propio, `MeshBasicMaterial` para las texturas
de canvas y `PointsMaterial` para las partículas.

**Luces: 0.** No hay ni una `Light` en la escena. La iluminación son dos productos escalares
cosidos al fragment shader, con direcciones fijas. Sale gratis y además queda coherente.

**Sombras: 0.** `shadowMap.enabled = false`. Lo que parece volumen es el fresnel.

**Geometría descargada: 0 bytes.** Todo es procedural. Las texturas se dibujan en un canvas al
arrancar (una rodaja de 128², una hoja de 128², un punto de 64²).

## Perfiles de calidad

`detectTier()` mira núcleos, `deviceMemory`, tipo de puntero y tamaño de pantalla:

|                  | `low` | `mid` | `high` |
| ---------------- | ----- | ----- | ------ |
| DPR máximo       | 1     | 1.6   | 2      |
| Antialias        | no    | no    | sí     |
| Partículas       | 90    | 180   | 320    |
| Cubitos          | 6     | 10    | 16     |
| Cítricos / hojas | 3 / 4 | 5 / 7 | 8 / 11 |
| Botellas         | no    | sí    | sí     |

El DPR nunca pasa de 2. Un móvil moderno declara 3, y pintar a 3× son **nueve veces** los
píxeles de 1× para una diferencia que no ve nadie.

## Trabajo por frame

Reglas que se siguen en todo el código del bucle:

- Ni un `querySelector` ni un `getBoundingClientRect` dentro del render.
- Ni un `Vector3`, `Quaternion`, `Euler` o `Matrix4` nuevo por frame. Todos son campos de
  instancia que se reutilizan (ver `Ice`, `Garnish`, `Bottles`, `Camera`).
- `Particles.write()` no toca el buffer si el valor de agrupación no ha cambiado de verdad.
  Mover 320 puntos cuando nadie ha tocado el scroll es trabajo tirado.
- El foco de la carta se obtiene de seis tramos discretos del progreso de `ScrollTrigger`; no
  hay mediciones de layout dentro del callback de scroll.
- La interpolación usa `damp()` (exponencial con delta), no `lerp()` con alfa fija. Con lerp
  fijo, a 144 Hz todo va al triple de velocidad que a 60 y no te enteras hasta que alguien lo
  prueba en un portátil gaming.

## Reduced motion

Con `prefers-reduced-motion: reduce` el renderer **no dibuja cada frame**. Hay un flag `dirty`
que solo se levanta al cambiar el scroll, el tamaño de ventana o el cóctel en foco. La escena
se ve igual de bien y la GPU se queda en silencio.

## CLS y layout

- Todas las `<img>` llevan `width` y `height`, así que el hueco está reservado antes de cargar.
- El canvas es `position: fixed` con `contain: strict`: no participa en el layout del documento.
- Solo se animan `transform` y `opacity`. Ni `top`, ni `left`, ni `width`, ni `height`.
- Las fuentes van con `display=swap` y se esperan antes de calcular los triggers, de modo que
  el intercambio de fuente no descoloca las animaciones.

## Fugas de memoria

`Experience.destroy()` recorre la escena entera liberando geometrías, materiales y todas las
texturas colgadas de cada material, y después llama a `renderer.dispose()` y
`forceContextLoss()`. Three no tiene recolector para lo que vive en la GPU: si no lo sueltas
tú, se queda.

Todos los listeners se registran con el helper `on()`, que devuelve su propia función de baja.
Eso hace muy difícil olvidarse de uno.

## Ideas pendientes

- Auto-hospedar las fuentes (ahora vienen de Google Fonts): ahorraría una conexión externa y
  mejoraría el LCP.
- Un `IntersectionObserver` sobre el canvas para pausar el render cuando la escena esté
  totalmente tapada por contenido.
- Medir Core Web Vitals de campo una vez esté publicada; los números de arriba son de build,
  no de usuarios reales.
