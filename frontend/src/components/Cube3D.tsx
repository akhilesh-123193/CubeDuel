"use client";

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { CubeEngine } from '@/cube/CubeEngine';
import { CubeAnimator } from '@/cube/CubeAnimator';

const CUBE_SPACING = 1.02;

const FACE_COLORS: Record<string, string> = {
  R: '#ef4444', L: '#f97316', U: '#ffffff', D: '#eab308', F: '#22c55e', B: '#3b82f6'
};

const createMaterial = (color: string) => new THREE.MeshPhysicalMaterial({ 
  color, 
  roughness: 0.1, 
  metalness: 0.1,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
});

const materials = [
  createMaterial(FACE_COLORS.R),
  createMaterial(FACE_COLORS.L),
  createMaterial(FACE_COLORS.U),
  createMaterial(FACE_COLORS.D),
  createMaterial(FACE_COLORS.F),
  createMaterial(FACE_COLORS.B),
];
const blackMaterial = new THREE.MeshPhysicalMaterial({ 
  color: '#0a0a0a', 
  roughness: 0.6,
  metalness: 0.8
});

interface CubeProps {
  movesQueue: string[];
  initialMoves?: string[];
  onQueueEmpty?: () => void;
  speed?: number;
  isPaused?: boolean;
  stepCounter?: number;
  onMoveComplete?: (index: number) => void;
}

function CubeRenderer({ movesQueue, initialMoves = [], onQueueEmpty, speed = 1, isPaused = false, stepCounter = 0, onMoveComplete }: CubeProps) {
  const engineRef = useRef<CubeEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new CubeEngine();
    for (const m of initialMoves) {
      engineRef.current.applyMove(m);
    }
  }
  const animatorRef = useRef(new CubeAnimator(engineRef.current));
  
  // Apply live speed and pause settings
  useEffect(() => {
    animatorRef.current.speedMultiplier = speed;
    animatorRef.current.isPaused = isPaused;
  }, [speed, isPaused]);
  
  const meshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const geometry = useMemo(() => new THREE.BoxGeometry(0.96, 0.96, 0.96), []);

  const queueRef = useRef(movesQueue);
  const currentMoveIndex = useRef(0);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    queueRef.current = movesQueue;
    currentMoveIndex.current = 0;
    
    if (animatorRef.current.animating) {
      animatorRef.current.forceComplete();
    }
    
    if (movesQueue.length > 0 && !isPlayingRef.current) {
      isPlayingRef.current = true;
      processNextMove();
    }
  }, [movesQueue]);

  const lastStepCounter = useRef(stepCounter);
  useEffect(() => {
    if (stepCounter !== lastStepCounter.current) {
      lastStepCounter.current = stepCounter;
      if (animatorRef.current.animating) {
        animatorRef.current.forceComplete();
      } else if (isPlayingRef.current) {
        processNextMove();
      }
    }
  }, [stepCounter]);

  const processNextMove = () => {
    if (currentMoveIndex.current < queueRef.current.length) {
      const nextMove = queueRef.current[currentMoveIndex.current];
      animatorRef.current.startMove(nextMove);
      currentMoveIndex.current++;
    } else {
      isPlayingRef.current = false;
      if (onQueueEmpty) onQueueEmpty();
    }
  };

  useFrame((_, delta) => {
    const finished = animatorRef.current.tick(delta, meshesRef.current, CUBE_SPACING);
    if (finished && isPlayingRef.current) {
      if (onMoveComplete) onMoveComplete(currentMoveIndex.current - 1);
      processNextMove();
    }
  });

  return (
    <group>
      {engineRef.current!.state.cubies.map((cubie) => {
        // Initial materials mapping (only outer faces get colors)
        const mats = [
          cubie.stickers.R ? materials[0] : blackMaterial,
          cubie.stickers.L ? materials[1] : blackMaterial,
          cubie.stickers.U ? materials[2] : blackMaterial,
          cubie.stickers.D ? materials[3] : blackMaterial,
          cubie.stickers.F ? materials[4] : blackMaterial,
          cubie.stickers.B ? materials[5] : blackMaterial,
        ];

        return (
          <mesh
            key={cubie.id}
            geometry={geometry}
            material={mats}
            ref={(el) => {
              if (el && !meshesRef.current.has(cubie.id)) {
                // Initial placement
                el.position.set(cubie.position.x * CUBE_SPACING, cubie.position.y * CUBE_SPACING, cubie.position.z * CUBE_SPACING);
                el.quaternion.set(cubie.orientation.x, cubie.orientation.y, cubie.orientation.z, cubie.orientation.w);
                meshesRef.current.set(cubie.id, el);
              }
            }}
          >
            <lineSegments>
              <edgesGeometry args={[geometry]} />
              <lineBasicMaterial color="#000000" linewidth={2} />
            </lineSegments>
          </mesh>
        );
      })}
    </group>
  );
}

export default function Cube3D(props: CubeProps) {
  return (
    <div className="w-full h-full min-h-[500px]">
      <Canvas camera={{ position: [5, 4, 6], fov: 40 }} dpr={[1, 2]}>
        <ambientLight intensity={0.7} />
        <Environment preset="studio" />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
        <directionalLight position={[-10, -20, -10]} intensity={0.5} />
        <spotLight position={[0, 10, 0]} intensity={0.8} angle={0.5} penumbra={1} />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <CubeRenderer {...props} />
        </Float>
        
        <ContactShadows position={[0, -2.5, 0]} opacity={0.7} scale={12} blur={2.5} far={4} color="#000000" />
        <OrbitControls enablePan={false} enableZoom={false} minDistance={4} maxDistance={12} />
      </Canvas>
    </div>
  );
}
