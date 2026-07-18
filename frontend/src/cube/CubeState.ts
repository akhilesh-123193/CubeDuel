import { Cubie, cloneCubie } from './Cubie';

export class CubeState {
  public cubies: Cubie[] = [];

  constructor(cubies?: Cubie[]) {
    if (cubies) {
      this.cubies = cubies.map(cloneCubie);
    } else {
      this.initializeSolvedState();
    }
  }

  private initializeSolvedState() {
    let id = 0;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cubie: Cubie = {
            id: id++,
            position: { x: x as -1|0|1, y: y as -1|0|1, z: z as -1|0|1 },
            orientation: { x: 0, y: 0, z: 0, w: 1 },
            stickers: {}
          };
          
          if (y === 1) cubie.stickers.U = 'white';
          if (y === -1) cubie.stickers.D = 'yellow';
          if (x === 1) cubie.stickers.R = 'red';
          if (x === -1) cubie.stickers.L = 'orange';
          if (z === 1) cubie.stickers.F = 'green';
          if (z === -1) cubie.stickers.B = 'blue';

          this.cubies.push(cubie);
        }
      }
    }
  }

  public clone(): CubeState {
    return new CubeState(this.cubies);
  }

  public getCubieAt(x: number, y: number, z: number): Cubie | undefined {
    return this.cubies.find(c => c.position.x === x && c.position.y === y && c.position.z === z);
  }
}
