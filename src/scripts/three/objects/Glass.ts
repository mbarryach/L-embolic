import { Group, LatheGeometry, Mesh, Vector2, type ShaderMaterial } from 'three';
import { createNeonMaterial, FrontSide } from '../materials/neonMaterial';

/**
 * Perfil de la copa, de la base al borde. Son los puntos que Three hace
 * girar sobre el eje Y; con doce coordenadas sale una copa entera.
 *
 * Sin modelos GLB, sin Draco, sin descargar 8 MB. Una copa es una silueta
 * girando, y eso ya sabe hacerlo la libreria.
 */
const GLASS_PROFILE: readonly [number, number][] = [
  [0, -1.1],
  [0.4, -1.1],
  [0.42, -1.04],
  [0.085, -0.98],
  [0.062, -0.36],
  [0.11, -0.28],
  [0.3, -0.13],
  [0.46, 0.07],
  [0.56, 0.31],
  [0.605, 0.5],
  [0.615, 0.56],
];

/** Superficie del liquido: sube desde el fondo del cuenco y se tapa arriba. */
const LIQUID_PROFILE: readonly [number, number][] = [
  [0, -0.14],
  [0.26, -0.05],
  [0.42, 0.09],
  [0.52, 0.24],
  [0.548, 0.3],
  [0, 0.3],
];

const SEGMENTS = 44;

function lathe(profile: readonly [number, number][]): LatheGeometry {
  return new LatheGeometry(
    profile.map(([x, y]) => new Vector2(x, y)),
    SEGMENTS,
  );
}

/** La copa: el objeto que manda en toda la escena. */
export class Glass {
  readonly group = new Group();
  private readonly liquidMaterial: ShaderMaterial;

  constructor() {
    // Casi todo transparente y un fresnel muy cerrado (rimPower alto): solo
    // se enciende la silueta. Con valores mas suaves el cristal se rellena
    // entero y deja de parecer cristal para parecer plastico pintado.
    const glassMaterial = createNeonMaterial({
      color: '#6fdcea',
      rim: '#4dd9e8',
      opacity: 0.01,
      rimPower: 6.5,
      glow: 0.62,
      additive: true,
    });

    this.liquidMaterial = createNeonMaterial({
      color: '#c9484f',
      rim: '#ffb27f',
      opacity: 0.1,
      rimPower: 3.4,
      glow: 0.28,
      side: FrontSide,
    });

    this.group.add(new Mesh(lathe(GLASS_PROFILE), glassMaterial));
    this.group.add(new Mesh(lathe(LIQUID_PROFILE), this.liquidMaterial));
  }

  /** El acento manda tambien aqui: el liquido cambia con el coctel en foco. */
  get liquid(): ShaderMaterial {
    return this.liquidMaterial;
  }
}
