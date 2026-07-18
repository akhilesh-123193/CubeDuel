import { IntCoord, QuaternionLike } from './Cubie';
import * as THREE from 'three';

type TransformFunc = (x: IntCoord, y: IntCoord, z: IntCoord) => { x: IntCoord, y: IntCoord, z: IntCoord };

export interface MoveDefinition {
  face: string;
  condition: (c: {x: IntCoord, y: IntCoord, z: IntCoord}) => boolean;
  transformCoord: TransformFunc;
  rotationAxis: THREE.Vector3;
  rotationAngle: number;
}

const rotateCW = (a: IntCoord, b: IntCoord): [IntCoord, IntCoord] => [b, -a as IntCoord];
const rotateCCW = (a: IntCoord, b: IntCoord): [IntCoord, IntCoord] => [-b as IntCoord, a];
const rotate180 = (a: IntCoord, b: IntCoord): [IntCoord, IntCoord] => [-a as IntCoord, -b as IntCoord];

export const MoveDefinitions: Record<string, MoveDefinition> = {
  // UP (y = 1) -> Rotate around +Y axis
  'U': {
    face: 'U',
    condition: (p) => p.y === 1,
    transformCoord: (x, y, z) => { const [nx, nz] = rotateCCW(x, z); return { x: nx, y, z: nz }; },
    rotationAxis: new THREE.Vector3(0, 1, 0),
    rotationAngle: -Math.PI / 2
  },
  'U\'': {
    face: 'U\'',
    condition: (p) => p.y === 1,
    transformCoord: (x, y, z) => { const [nx, nz] = rotateCW(x, z); return { x: nx, y, z: nz }; },
    rotationAxis: new THREE.Vector3(0, 1, 0),
    rotationAngle: Math.PI / 2
  },
  'U2': {
    face: 'U2',
    condition: (p) => p.y === 1,
    transformCoord: (x, y, z) => { const [nx, nz] = rotate180(x, z); return { x: nx, y, z: nz }; },
    rotationAxis: new THREE.Vector3(0, 1, 0),
    rotationAngle: -Math.PI
  },

  // DOWN (y = -1) -> Rotate around -Y axis effectively
  'D': {
    face: 'D',
    condition: (p) => p.y === -1,
    transformCoord: (x, y, z) => { const [nx, nz] = rotateCW(x, z); return { x: nx, y, z: nz }; },
    rotationAxis: new THREE.Vector3(0, 1, 0),
    rotationAngle: Math.PI / 2
  },
  'D\'': {
    face: 'D\'',
    condition: (p) => p.y === -1,
    transformCoord: (x, y, z) => { const [nx, nz] = rotateCCW(x, z); return { x: nx, y, z: nz }; },
    rotationAxis: new THREE.Vector3(0, 1, 0),
    rotationAngle: -Math.PI / 2
  },
  'D2': {
    face: 'D2',
    condition: (p) => p.y === -1,
    transformCoord: (x, y, z) => { const [nx, nz] = rotate180(x, z); return { x: nx, y, z: nz }; },
    rotationAxis: new THREE.Vector3(0, 1, 0),
    rotationAngle: Math.PI
  },

  // RIGHT (x = 1) -> Rotate around +X axis
  'R': {
    face: 'R',
    condition: (p) => p.x === 1,
    transformCoord: (x, y, z) => { const [ny, nz] = rotateCW(y, z); return { x, y: ny, z: nz }; },
    rotationAxis: new THREE.Vector3(1, 0, 0),
    rotationAngle: -Math.PI / 2
  },
  'R\'': {
    face: 'R\'',
    condition: (p) => p.x === 1,
    transformCoord: (x, y, z) => { const [ny, nz] = rotateCCW(y, z); return { x, y: ny, z: nz }; },
    rotationAxis: new THREE.Vector3(1, 0, 0),
    rotationAngle: Math.PI / 2
  },
  'R2': {
    face: 'R2',
    condition: (p) => p.x === 1,
    transformCoord: (x, y, z) => { const [ny, nz] = rotate180(y, z); return { x, y: ny, z: nz }; },
    rotationAxis: new THREE.Vector3(1, 0, 0),
    rotationAngle: -Math.PI
  },

  // LEFT (x = -1) -> Rotate around -X axis effectively
  'L': {
    face: 'L',
    condition: (p) => p.x === -1,
    transformCoord: (x, y, z) => { const [ny, nz] = rotateCCW(y, z); return { x, y: ny, z: nz }; },
    rotationAxis: new THREE.Vector3(1, 0, 0),
    rotationAngle: Math.PI / 2
  },
  'L\'': {
    face: 'L\'',
    condition: (p) => p.x === -1,
    transformCoord: (x, y, z) => { const [ny, nz] = rotateCW(y, z); return { x, y: ny, z: nz }; },
    rotationAxis: new THREE.Vector3(1, 0, 0),
    rotationAngle: -Math.PI / 2
  },
  'L2': {
    face: 'L2',
    condition: (p) => p.x === -1,
    transformCoord: (x, y, z) => { const [ny, nz] = rotate180(y, z); return { x, y: ny, z: nz }; },
    rotationAxis: new THREE.Vector3(1, 0, 0),
    rotationAngle: Math.PI
  },

  // FRONT (z = 1) -> Rotate around +Z axis
  'F': {
    face: 'F',
    condition: (p) => p.z === 1,
    transformCoord: (x, y, z) => { const [nx, ny] = rotateCW(x, y); return { x: nx, y: ny, z }; },
    rotationAxis: new THREE.Vector3(0, 0, 1),
    rotationAngle: -Math.PI / 2
  },
  'F\'': {
    face: 'F\'',
    condition: (p) => p.z === 1,
    transformCoord: (x, y, z) => { const [nx, ny] = rotateCCW(x, y); return { x: nx, y: ny, z }; },
    rotationAxis: new THREE.Vector3(0, 0, 1),
    rotationAngle: Math.PI / 2
  },
  'F2': {
    face: 'F2',
    condition: (p) => p.z === 1,
    transformCoord: (x, y, z) => { const [nx, ny] = rotate180(x, y); return { x: nx, y: ny, z }; },
    rotationAxis: new THREE.Vector3(0, 0, 1),
    rotationAngle: -Math.PI
  },

  // BACK (z = -1) -> Rotate around -Z axis effectively
  'B': {
    face: 'B',
    condition: (p) => p.z === -1,
    transformCoord: (x, y, z) => { const [nx, ny] = rotateCCW(x, y); return { x: nx, y: ny, z }; },
    rotationAxis: new THREE.Vector3(0, 0, 1),
    rotationAngle: Math.PI / 2
  },
  'B\'': {
    face: 'B\'',
    condition: (p) => p.z === -1,
    transformCoord: (x, y, z) => { const [nx, ny] = rotateCW(x, y); return { x: nx, y: ny, z }; },
    rotationAxis: new THREE.Vector3(0, 0, 1),
    rotationAngle: -Math.PI / 2
  },
  'B2': {
    face: 'B2',
    condition: (p) => p.z === -1,
    transformCoord: (x, y, z) => { const [nx, ny] = rotate180(x, y); return { x: nx, y: ny, z }; },
    rotationAxis: new THREE.Vector3(0, 0, 1),
    rotationAngle: Math.PI
  },
};
