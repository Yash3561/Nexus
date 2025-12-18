"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

// Rotating Earth component
function Earth() {
    const meshRef = useRef<THREE.Mesh>(null);
    const atmosphereRef = useRef<THREE.Mesh>(null);

    // Slow auto-rotation
    useFrame((_, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.1;
        }
        if (atmosphereRef.current) {
            atmosphereRef.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <group>
            {/* Earth sphere */}
            <Sphere ref={meshRef} args={[2, 64, 64]}>
                <meshStandardMaterial
                    color="#1e3a5f"
                    roughness={0.8}
                    metalness={0.2}
                />
            </Sphere>

            {/* Atmosphere glow */}
            <Sphere ref={atmosphereRef} args={[2.1, 64, 64]}>
                <meshBasicMaterial
                    color="#4a9eff"
                    transparent
                    opacity={0.15}
                    side={THREE.BackSide}
                />
            </Sphere>

            {/* Grid lines for tech look */}
            <Sphere args={[2.01, 32, 32]}>
                <meshBasicMaterial
                    color="#3b82f6"
                    wireframe
                    transparent
                    opacity={0.3}
                />
            </Sphere>
        </group>
    );
}

// Animated data pulses around the globe
function DataPulses({ count = 15 }: { count?: number }) {
    const pulsesRef = useRef<THREE.Group>(null);

    // Generate random positions on sphere surface
    const positions = useMemo(() => {
        const pos = [];
        for (let i = 0; i < count; i++) {
            const phi = Math.acos(-1 + (2 * i) / count);
            const theta = Math.sqrt(count * Math.PI) * phi;
            pos.push({
                x: 2.05 * Math.cos(theta) * Math.sin(phi),
                y: 2.05 * Math.sin(theta) * Math.sin(phi),
                z: 2.05 * Math.cos(phi),
                delay: Math.random() * 2,
                speed: 0.5 + Math.random() * 0.5,
            });
        }
        return pos;
    }, [count]);

    useFrame(({ clock }) => {
        if (pulsesRef.current) {
            pulsesRef.current.children.forEach((child, i) => {
                const pos = positions[i];
                const time = clock.getElapsedTime() * pos.speed + pos.delay;
                const scale = 0.5 + Math.sin(time * 2) * 0.5;
                child.scale.setScalar(scale * 0.15);
                (child as THREE.Mesh).material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(0.55 + Math.sin(time) * 0.1, 0.8, 0.6),
                    transparent: true,
                    opacity: 0.3 + scale * 0.5,
                });
            });
        }
    });

    return (
        <group ref={pulsesRef}>
            {positions.map((pos, i) => (
                <mesh key={i} position={[pos.x, pos.y, pos.z]}>
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshBasicMaterial color="#8ab4f8" transparent opacity={0.8} />
                </mesh>
            ))}
        </group>
    );
}

// Connection lines between pulses
function ConnectionLines() {
    const linesRef = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        if (linesRef.current) {
            linesRef.current.children.forEach((child, i) => {
                const line = child as THREE.Line;
                const material = line.material as THREE.LineBasicMaterial;
                material.opacity = 0.1 + Math.sin(clock.getElapsedTime() * 0.5 + i) * 0.1;
            });
        }
    });

    const lines = useMemo(() => {
        const lineData = [];
        for (let i = 0; i < 8; i++) {
            const phi1 = Math.random() * Math.PI;
            const theta1 = Math.random() * Math.PI * 2;
            const phi2 = Math.random() * Math.PI;
            const theta2 = Math.random() * Math.PI * 2;

            const start = new THREE.Vector3(
                2.02 * Math.sin(phi1) * Math.cos(theta1),
                2.02 * Math.cos(phi1),
                2.02 * Math.sin(phi1) * Math.sin(theta1)
            );
            const end = new THREE.Vector3(
                2.02 * Math.sin(phi2) * Math.cos(theta2),
                2.02 * Math.cos(phi2),
                2.02 * Math.sin(phi2) * Math.sin(theta2)
            );

            lineData.push({ start, end });
        }
        return lineData;
    }, []);

    return (
        <group ref={linesRef}>
            {lines.map((line, i) => (
                <line key={i}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={2}
                            array={new Float32Array([
                                line.start.x, line.start.y, line.start.z,
                                line.end.x, line.end.y, line.end.z,
                            ])}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="#8ab4f8" transparent opacity={0.2} />
                </line>
            ))}
        </group>
    );
}

interface EarthGlobeProps {
    className?: string;
    showControls?: boolean;
}

export default function EarthGlobe({ className = "", showControls = true }: EarthGlobeProps) {
    return (
        <div className={`w-full h-full ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 6], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: "transparent" }}
            >
                {/* Lighting */}
                <ambientLight intensity={0.3} />
                <directionalLight position={[5, 3, 5]} intensity={1} color="#ffffff" />
                <pointLight position={[-5, -3, -5]} intensity={0.5} color="#8ab4f8" />

                {/* Stars background */}
                <Stars radius={100} depth={50} count={2000} factor={4} fade speed={1} />

                {/* Earth */}
                <Earth />

                {/* Data activity pulses */}
                <DataPulses count={20} />

                {/* Connection lines */}
                <ConnectionLines />

                {/* Orbit controls for interaction */}
                {showControls && (
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        autoRotate
                        autoRotateSpeed={0.3}
                        minPolarAngle={Math.PI / 3}
                        maxPolarAngle={Math.PI / 1.5}
                    />
                )}
            </Canvas>
        </div>
    );
}
