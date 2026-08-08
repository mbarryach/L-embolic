import {
  AdditiveBlending,
  Color,
  DoubleSide,
  FrontSide,
  NormalBlending,
  ShaderMaterial,
  type ColorRepresentation,
  type Side,
} from 'three';

export { FrontSide };

const vertexShader = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vPositionView;

  void main() {
    vec3 objectNormal = normal;
    vec3 transformed = position;

    #ifdef USE_INSTANCING
      mat3 instanceRotation = mat3( instanceMatrix );
      objectNormal = instanceRotation * objectNormal;
      transformed = ( instanceMatrix * vec4( transformed, 1.0 ) ).xyz;
    #endif

    vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );

    vNormalView = normalize( normalMatrix * objectNormal );
    vPositionView = mvPosition.xyz;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uRim;
  uniform float uOpacity;
  uniform float uRimPower;
  uniform float uGlow;

  varying vec3 vNormalView;
  varying vec3 vPositionView;

  void main() {
    vec3 normalDir = normalize( vNormalView );
    vec3 viewDir = normalize( -vPositionView );

    // Fresnel: los bordes que miran de canto brillan. Es lo unico que hace
    // falta para que un trozo de geometria parezca vidrio o hielo.
    float fresnel = pow( 1.0 - clamp( dot( normalDir, viewDir ), 0.0, 1.0 ), uRimPower );

    // Dos luces falsas cosidas al shader. No hay ni una luz real en la
    // escena: cero coste, y ademas siempre iluminan igual de bien.
    float key = clamp( dot( normalDir, normalize( vec3( 0.35, 0.9, 0.5 ) ) ), 0.0, 1.0 );
    float fill = clamp( dot( normalDir, normalize( vec3( -0.65, -0.15, 0.7 ) ) ), 0.0, 1.0 );

    vec3 base = uColor * ( 0.2 + key * 0.66 + fill * 0.26 );
    vec3 color = base + uRim * fresnel * uGlow;

    gl_FragColor = vec4( color, clamp( uOpacity + fresnel * 0.45, 0.0, 1.0 ) );

    #include <colorspace_fragment>
  }
`;

export interface NeonMaterialOptions {
  readonly color: ColorRepresentation;
  readonly rim: ColorRepresentation;
  readonly opacity?: number;
  readonly rimPower?: number;
  readonly glow?: number;
  readonly additive?: boolean;
  readonly depthWrite?: boolean;
  /** DoubleSide por defecto. El liquido va a una cara: se ve mas limpio. */
  readonly side?: Side;
}

/**
 * El unico material propio de la escena.
 *
 * Todo — la copa, el hielo, las botellas — sale de aqui cambiando cuatro
 * uniforms. Un solo programa de shader significa que la GPU no anda
 * cambiando de estado en cada draw call, y encima la escena queda coherente
 * de sola: mismo vidrio, mismo borde, mismo idioma.
 *
 * Y sin una sola luz de Three. Todo va cosido en el fragment.
 */
export function createNeonMaterial(options: NeonMaterialOptions): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: options.depthWrite ?? false,
    side: options.side ?? DoubleSide,
    blending: options.additive === true ? AdditiveBlending : NormalBlending,
    uniforms: {
      uColor: { value: new Color(options.color) },
      uRim: { value: new Color(options.rim) },
      uOpacity: { value: options.opacity ?? 0.12 },
      uRimPower: { value: options.rimPower ?? 2.6 },
      uGlow: { value: options.glow ?? 1 },
    },
  });
}

/** Cambia el color de borde de un material sin crear objetos nuevos. */
export function setRimColor(material: ShaderMaterial, color: Color): void {
  const uniform = material.uniforms.uRim;
  if (uniform) (uniform.value as Color).copy(color);
}
