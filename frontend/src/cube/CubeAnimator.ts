import * as THREE from 'three';
import { CubeEngine } from './CubeEngine';

export interface VisualTransform {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

export class CubeAnimator {
  public engine: CubeEngine;
  public animating: boolean = false;
  
  private progress: number = 0;
  private duration: number = 0.25;
  private oldTransforms: Map<number, VisualTransform> = new Map();
  private newTransforms: Map<number, VisualTransform> = new Map();

  public speedMultiplier: number = 1.0;
  public isPaused: boolean = false;

  constructor(engine: CubeEngine) {
    this.engine = engine;
  }

  public startMove(move: string) {
    if (this.animating) return;

    this.oldTransforms.clear();
    for (const cubie of this.engine.state.cubies) {
      this.oldTransforms.set(cubie.id, {
        position: new THREE.Vector3(cubie.position.x, cubie.position.y, cubie.position.z),
        quaternion: new THREE.Quaternion(cubie.orientation.x, cubie.orientation.y, cubie.orientation.z, cubie.orientation.w)
      });
    }

    // Instantly apply pure logical math
    this.engine.applyMove(move);

    this.newTransforms.clear();
    for (const cubie of this.engine.state.cubies) {
      this.newTransforms.set(cubie.id, {
        position: new THREE.Vector3(cubie.position.x, cubie.position.y, cubie.position.z),
        quaternion: new THREE.Quaternion(cubie.orientation.x, cubie.orientation.y, cubie.orientation.z, cubie.orientation.w)
      });
    }

    this.progress = 0;
    this.animating = true;
  }

  public forceComplete() {
    this.progress = 1.0;
  }

  public tick(delta: number, meshes: Map<number, THREE.Mesh>, spacing: number) {
    if (!this.animating) {
      for (const cubie of this.engine.state.cubies) {
        const mesh = meshes.get(cubie.id);
        if (mesh) {
          mesh.position.set(cubie.position.x * spacing, cubie.position.y * spacing, cubie.position.z * spacing);
          mesh.quaternion.set(cubie.orientation.x, cubie.orientation.y, cubie.orientation.z, cubie.orientation.w);
        }
      }
      return false;
    }

    if (this.isPaused && this.progress < 1.0) {
      return false;
    }

    this.progress += (delta * this.speedMultiplier) / this.duration;
    let finished = false;
    let t = this.progress;

    if (t >= 1.0) {
      t = 1.0;
      finished = true;
    }

    const ease = t * t * (3 - 2 * t);
    const identityQuat = new THREE.Quaternion();

    for (const [id, oldT] of this.oldTransforms.entries()) {
      const newT = this.newTransforms.get(id)!;
      const mesh = meshes.get(id);

      if (mesh) {
        if (oldT.position.equals(newT.position) && oldT.quaternion.equals(newT.quaternion)) {
          continue; // Static piece
        }

        // Calculate delta rotation that transforms old orientation to new orientation
        const deltaQuat = oldT.quaternion.clone().invert().premultiply(newT.quaternion);
        
        // Interpolate the delta rotation
        const currentDelta = new THREE.Quaternion().slerp(deltaQuat, ease);

        // Apply interpolated delta to original position (creates a perfect arc)
        mesh.position.copy(oldT.position).applyQuaternion(currentDelta).multiplyScalar(spacing);
        
        // Apply interpolated delta to original orientation
        mesh.quaternion.copy(oldT.quaternion).premultiply(currentDelta);
      }
    }

    if (finished) {
      this.animating = false;
    }

    return finished;
  }
}
