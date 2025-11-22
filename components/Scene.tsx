/* eslint-disable react/no-unknown-property */
"use client";
import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AccumulativeShadows, Environment, Float, Lightformer, OrbitControls, PerspectiveCamera, RandomizedLight, SpotLight, StatsGl, useFBO } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom, DepthOfField, Vignette, SMAA } from "@react-three/postprocessing";
import { ACESFilmicToneMapping } from "three";

const PALETTE = {
  deepBlue: "#003049",
  purple: "#6639a6",
  neonBlue: "#a2d2ff",
  neonAmber: "#ffb703",
  clothing: "#222222"
};

function ManWalker() {
  const group = useRef<THREE.Group>(null!);
  const leftLeg = useRef<THREE.Mesh>(null!);
  const rightLeg = useRef<THREE.Mesh>(null!);
  const leftArm = useRef<THREE.Mesh>(null!);
  const rightArm = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const speed = 1.4;
    const phase = t * speed;
    leftLeg.current.rotation.x = Math.sin(phase) * 0.6;
    rightLeg.current.rotation.x = Math.sin(phase + Math.PI) * 0.6;
    leftArm.current.rotation.x = Math.sin(phase + Math.PI) * 0.4;
    rightArm.current.rotation.x = Math.sin(phase) * 0.4;
    group.current.position.z = -t * 0.8; // walking forward
    group.current.position.x = Math.sin(t * 0.2) * 0.2; // subtle sway
  });

  return (
    <group ref={group}>
      {/* Torso */}
      <mesh castShadow position={[0, 1.35, 0]}>
        <capsuleGeometry args={[0.22, 0.8, 8, 16]} />
        <meshStandardMaterial color={PALETTE.clothing} roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color={"#111111"} roughness={0.5} />
      </mesh>
      {/* Legs */}
      <mesh ref={leftLeg} castShadow position={[-0.13, 0.7, 0]}>
        <capsuleGeometry args={[0.11, 0.7, 8, 16]} />
        <meshStandardMaterial color={PALETTE.clothing} roughness={0.2} metalness={0.15} />
      </mesh>
      <mesh ref={rightLeg} castShadow position={[0.13, 0.7, 0]}>
        <capsuleGeometry args={[0.11, 0.7, 8, 16]} />
        <meshStandardMaterial color={PALETTE.clothing} roughness={0.2} metalness={0.15} />
      </mesh>
      {/* Arms */}
      <mesh ref={leftArm} castShadow position={[-0.35, 1.35, 0]}>
        <capsuleGeometry args={[0.08, 0.6, 8, 16]} />
        <meshStandardMaterial color={PALETTE.clothing} roughness={0.2} />
      </mesh>
      <mesh ref={rightArm} castShadow position={[0.35, 1.35, 0]}>
        <capsuleGeometry args={[0.08, 0.6, 8, 16]} />
        <meshStandardMaterial color={PALETTE.clothing} roughness={0.2} />
      </mesh>
    </group>
  );
}

function RainParticles() {
  const count = 2000;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = Math.random() * 6 + 2;
      arr[i * 3 + 2] = -Math.random() * 40;
    }
    return arr;
  }, []);
  const velocities = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) arr[i] = 10 + Math.random() * 10;
    return arr;
  }, []);
  const ref = useRef<THREE.Points>(null!);
  useFrame((_, dt) => {
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) - velocities[i] * dt;
      if (y < 0.05) y = Math.random() * 6 + 2;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} count={count} />
      </bufferGeometry>
      <pointsMaterial color={PALETTE.neonBlue} size={0.02} sizeAttenuation transparent opacity={0.6} />
    </points>
  );
}

function Steam({ x = 0 }: { x?: number }) {
  const group = useRef<THREE.Group>(null!);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.current.position.y = 0.1 + Math.sin(t * 0.8 + x) * 0.03;
  });
  return (
    <group ref={group} position={[x, 0.05, -6]}>
      <mesh>
        <cylinderGeometry args={[0.15, 0.2, 0.02, 16]} />
        <meshStandardMaterial color={"#333"} roughness={1} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color={"#cccccc"} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

function Puddles() {
  const puddleMat = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#0b1f2c"),
      metalness: 0.6,
      roughness: 0.05,
      ior: 1.45,
      transmission: 0,
      reflectivity: 1
    });
    return mat;
  }, []);

  const puddlePositions: Array<[number, number, number, number]> = [
    [-1.5, 0.051, -3, 1.2],
    [0.5, 0.051, -5, 0.9],
    [2.0, 0.051, -8, 1.6]
  ];
  return (
    <group>
      {puddlePositions.map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2}]}>
          <circleGeometry args={[p[3], 32]} />
          <meshPhysicalMaterial {...puddleMat} />
        </mesh>
      ))}
    </group>
  );
}

function Street() {
  const asphalt = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0e1720"),
      roughness: 0.25,
      metalness: 0.2
    });
    return mat;
  }, []);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}>
        <planeGeometry args={[20, 60]} />
        <meshStandardMaterial {...asphalt} />
      </mesh>
      {/* Side walls */}
      <mesh receiveShadow rotation={[0, 0, 0]} position={[-5, 1.5, -12]}>
        <boxGeometry args={[0.5, 3, 36]} />
        <meshStandardMaterial color={PALETTE.deepBlue} roughness={0.6} />
      </mesh>
      <mesh receiveShadow rotation={[0, 0, 0]} position={[5, 1.5, -12]}>
        <boxGeometry args={[0.5, 3, 36]} />
        <meshStandardMaterial color={PALETTE.purple} roughness={0.6} />
      </mesh>
    </group>
  );
}

function StreetLights() {
  const group = useRef<THREE.Group>(null!);
  const colorNeon = new THREE.Color(PALETTE.neonBlue);
  const colorAmber = new THREE.Color(PALETTE.neonAmber);

  return (
    <group ref={group}>
      {[...Array(6)].map((_, i) => {
        const z = -i * 6 - 2;
        const x = i % 2 === 0 ? -3.2 : 3.2;
        const hueLamp = i % 2 === 0 ? colorNeon : colorAmber;
        return (
          <group key={i} position={[x, 2.5, z]}>
            <mesh castShadow position={[0, -1.2, 0]}>
              <boxGeometry args={[0.08, 2.2, 0.08]} />
              <meshStandardMaterial color={"#222"} roughness={0.8} />
            </mesh>
            <mesh castShadow position={[0, 0, 0]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial emissive={hueLamp} emissiveIntensity={5} color={"#111"} />
            </mesh>
            <spotLight
              color={hueLamp}
              intensity={2.1}
              angle={0.6}
              penumbra={0.6}
              distance={7}
              decay={2}
              position={[0, 0.1, 0]}
              target-position={[0, -2, -1]}
              castShadow
            />
          </group>
        );
      })}
    </group>
  );
}

function NeonSigns() {
  return (
    <group>
      <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.5} position={[-4.5, 2.4, -8]}>
        <mesh>
          <boxGeometry args={[1.8, 0.5, 0.08]} />
          <meshStandardMaterial color={"#101010"} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[1.6, 0.35, 0.02]} />
          <meshStandardMaterial emissive={PALETTE.neonBlue} emissiveIntensity={4} color={"#0a0a0a"} />
        </mesh>
      </Float>
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.5} position={[4.5, 2.0, -12]}>
        <mesh>
          <boxGeometry args={[1.4, 0.4, 0.08]} />
          <meshStandardMaterial color={"#101010"} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[1.2, 0.28, 0.02]} />
          <meshStandardMaterial emissive={PALETTE.neonAmber} emissiveIntensity={3.5} color={"#0a0a0a"} />
        </mesh>
      </Float>
    </group>
  );
}

function CameraRig() {
  const cam = useRef<THREE.PerspectiveCamera>(null!);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // follow the man walking forward; we offset z based on time
    const followZ = -t * 0.8 + 1.4;
    cam.current.position.set(1.2 + Math.sin(t * 0.2) * 0.1, 1.6, followZ);
    cam.current.rotation.y = -0.1 + Math.sin(t * 0.15) * 0.01;
    cam.current.rotation.x = -0.02 + Math.sin(t * 0.1) * 0.005;
  });
  return <PerspectiveCamera ref={cam} makeDefault fov={50} near={0.1} far={100} />;
}

function Lighting() {
  return (
    <>
      <color attach="background" args={["#0b0f14"]} />
      <fog attach="fog" args={["#0b0f14", 5, 30]} />
      <ambientLight intensity={0.03} />
      <directionalLight
        position={[2, 6, 2]}
        intensity={0.2}
        color={PALETTE.deepBlue}
        castShadow
      />
      <Environment resolution={256}>
        <Lightformer intensity={0.4} color={PALETTE.purple} position={[0, 3, -10]} scale={[10, 1, 1]} />
        <Lightformer intensity={0.6} color={PALETTE.neonBlue} position={[0, 5, -20]} scale={[10, 1, 1]} />
      </Environment>
    </>
  );
}

function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom intensity={1.0} luminanceThreshold={0.2} luminanceSmoothing={0.2} mipmapBlur />
      <DepthOfField focusDistance={0.02} focalLength={0.025} bokehScale={2.5} />
      <Vignette offset={0.25} darkness={0.85} eskil />
    </EffectComposer>
  );
}

function SceneInner() {
  return (
    <>
      <CameraRig />
      <Lighting />
      <Street />
      <NeonSigns />
      <StreetLights />
      <Puddles />
      <Steam x={-1.2} />
      <Steam x={1.4} />
      <ManWalker />
      <RainParticles />
      <Effects />
      {/* <StatsGl /> */}
    </>
  );
}

export function Scene() {
  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        toneMapping: ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace
      }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.setClearColor("#0b0f14");
      }}
    >
      <SceneInner />
    </Canvas>
  );
}

