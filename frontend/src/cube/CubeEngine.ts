import { CubeState } from './CubeState';
import { MoveDefinitions } from './MoveTables';
import { QuaternionLike } from './Cubie';

// Pure math utility to multiply two quaternions and normalize
function multiplyQuaternions(a: QuaternionLike, b: QuaternionLike): QuaternionLike {
  const x = a.x * b.w + a.y * b.z - a.z * b.y + a.w * b.x;
  const y = -a.x * b.z + a.y * b.w + a.z * b.x + a.w * b.y;
  const z = a.x * b.y - a.y * b.x + a.z * b.w + a.w * b.z;
  const w = -a.x * b.x - a.y * b.y - a.z * b.z + a.w * b.w;
  const len = Math.sqrt(x*x + y*y + z*z + w*w);
  return { x: x/len, y: y/len, z: z/len, w: w/len };
}

// Pure math utility to create quaternion from axis-angle
function setFromAxisAngle(axis: {x: number, y: number, z: number}, angle: number): QuaternionLike {
  const halfAngle = angle / 2;
  const s = Math.sin(halfAngle);
  return {
    x: axis.x * s,
    y: axis.y * s,
    z: axis.z * s,
    w: Math.cos(halfAngle),
  };
}

export class CubeEngine {
  public state: CubeState;

  constructor() {
    this.state = new CubeState(); // Starts solved
  }

  public applyMove(moveString: string) {
    const move = MoveDefinitions[moveString];
    if (!move) throw new Error(`Unknown move: ${moveString}`);

    // The rotation quaternion for this move
    const moveQuat = setFromAxisAngle(move.rotationAxis, move.rotationAngle);

    for (const cubie of this.state.cubies) {
      if (move.condition(cubie.position)) {
        // 1. Transform integer coordinates exactly
        const newPos = move.transformCoord(cubie.position.x, cubie.position.y, cubie.position.z);
        cubie.position.x = newPos.x;
        cubie.position.y = newPos.y;
        cubie.position.z = newPos.z;

        // 2. Transform orientation exactly
        // new_orientation = moveQuat * old_orientation
        cubie.orientation = multiplyQuaternions(moveQuat, cubie.orientation);
      }
    }
  }

  public getCubieTransform(id: number) {
    const cubie = this.state.cubies.find(c => c.id === id);
    if (!cubie) throw new Error("Cubie not found");
    return {
      position: { ...cubie.position },
      orientation: { ...cubie.orientation }
    };
  }
}
