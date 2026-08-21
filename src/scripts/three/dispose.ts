import type { Material, Object3D, Texture } from 'three';

function isTexture(value: unknown): value is Texture {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { isTexture?: boolean }).isTexture === true
  );
}

function disposeMaterial(material: Material): void {
  // Las texturas cuelgan del material como propiedades sueltas (map,
  // alphaMap, lo que sea). Se recorren todas porque olvidarse de una es
  // dejar unos cuantos megas de VRAM ocupados para siempre.
  for (const value of Object.values(material)) {
    if (isTexture(value)) value.dispose();
  }
  material.dispose();
}

interface Disposables {
  geometry?: { dispose(): void };
  material?: Material | Material[];
}

/**
 * Libera geometrias, materiales y texturas de un arbol entero.
 *
 * Three no tiene recolector de basura para lo que vive en la GPU: si no lo
 * sueltas tu, se queda. Y no se nota hasta que alguien deja la pestaña
 * abierta media hora y el portatil despega.
 */
export function disposeObject(root: Object3D): void {
  root.traverse((child) => {
    const node = child as Object3D & Disposables;
    node.geometry?.dispose();
    const material = node.material;
    if (Array.isArray(material)) {
      for (const item of material) disposeMaterial(item);
    } else if (material) {
      disposeMaterial(material);
    }
  });
  root.clear();
}
