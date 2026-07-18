export type IntCoord = -1 | 0 | 1;

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface QuaternionLike {
  x: number;
  y: number;
  z: number;
  w: number;
}

export type Color = 'white' | 'yellow' | 'red' | 'orange' | 'green' | 'blue' | 'black';

export interface Cubie {
  id: number;
  position: {
    x: IntCoord;
    y: IntCoord;
    z: IntCoord;
  };
  orientation: QuaternionLike;
  stickers: {
    U?: Color;
    D?: Color;
    F?: Color;
    B?: Color;
    L?: Color;
    R?: Color;
  };
}

// Deep clone a cubie
export function cloneCubie(c: Cubie): Cubie {
  return {
    id: c.id,
    position: { x: c.position.x, y: c.position.y, z: c.position.z },
    orientation: { x: c.orientation.x, y: c.orientation.y, z: c.orientation.z, w: c.orientation.w },
    stickers: { ...c.stickers }
  };
}
