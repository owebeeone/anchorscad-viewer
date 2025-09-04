import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { Stage, ArcballControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { STLLoader } from 'three-stdlib';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';

function StlModel({ url }: { url: string }) {
    console.log('StlModel: Loading STL from URL:', url);
    const geometry = useLoader(STLLoader, url);
    console.log('StlModel: Successfully loaded geometry:', geometry);
    const { camera } = useThree();
    const controls = useThree((s: any) => s.controls) as any;

    useEffect(() => {
        try {
            geometry.computeBoundingSphere();
            const bs = geometry.boundingSphere;
            if (!bs) return;
            const center = bs.center.clone();
            // Desired isometric-ish angles matching PNG reference
            const phi = THREE.MathUtils.degToRad(55);
            const theta = THREE.MathUtils.degToRad(45);
            const fov = (camera as THREE.PerspectiveCamera).fov ?? 50;
            const radius = bs.radius;
            const distance = radius / Math.sin(THREE.MathUtils.degToRad(fov) / 2) * 1.2;
            const offset = new THREE.Vector3().setFromSphericalCoords(distance, phi, theta);
            camera.up.set(0, 0, 1);
            camera.position.copy(center.clone().add(offset));
            camera.lookAt(center);
            (controls?.target ?? camera)?.copy?.(center);
            controls?.update?.();
        } catch {}
    }, [geometry, camera, controls]);
    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color="#60a5fa" />
        </mesh>
    );
}

export default function ThreeDViewer({ stlPath, pngPath }: { stlPath: string; pngPath?: string }) {
    const glRef = useRef<any>(null);
    const invalidateRef = useRef<(() => void) | null>(null);
    const handleSnapshot = () => {
        try {
            const canvas = glRef.current?.domElement as HTMLCanvasElement | undefined;
            if (!canvas) return;
            // Ensure a fresh frame before capturing
            invalidateRef.current?.();
            requestAnimationFrame(() => {
                const url = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = url;
                const fileName = (() => {
                    if (!pngPath) return 'stl_snap.png';
                    const base = pngPath.split('/').pop() || 'image.png';
                    if (/\.png$/i.test(base)) return base.replace(/\.png$/i, '.stl_snap.png');
                    return `${base}.stl_snap.png`;
                })();
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
        } catch (e) {
            console.error('Failed to capture canvas:', e);
        }
    };
    const handleSaveFile = () => {
        try {
            const a = document.createElement('a');
            a.href = stlPath;
            const name = (stlPath.split('/').pop() || 'model.stl').replace(/\/+$/, '');
            a.download = /\.stl$/i.test(name) ? name : `${name}.stl`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error('Failed to download STL:', e);
        }
    };
    return (
        <div className="relative h-full w-full">
            <Canvas
                camera={{ position: [2, 2, 2], fov: 50 }}
                gl={{ preserveDrawingBuffer: true }}
                onCreated={({ gl, invalidate }) => {
                    glRef.current = gl;
                    invalidateRef.current = invalidate;
                }}
            >
                <Stage environment="studio" intensity={0.6} shadows={{ type: 'contact', opacity: 0.2, blur: 2 }}>
                    <Suspense fallback={null}>
                        {stlPath && <StlModel url={stlPath} />}
                    </Suspense>
                </Stage>
                <ArcballControls makeDefault enablePan rotateSpeed={1.0} zoomSpeed={1.2} />
                <GizmoHelper alignment="bottom-left" margin={[80, 80]}>
                    <GizmoViewport axisColors={["#ff3653", "#8adb00", "#2c8fff"]} labelColor="white" />
                </GizmoHelper>
            </Canvas>
            <div className="absolute bottom-2 left-2 flex gap-2">
                <button
                    onClick={handleSaveFile}
                    className="bg-gray-800/80 text-white text-xs px-2 py-1 rounded shadow hover:bg-gray-700"
                    title="Download STL file"
                >
                    Save
                </button>
                <button
                    onClick={handleSnapshot}
                    className="bg-gray-800/80 text-white text-xs px-2 py-1 rounded shadow hover:bg-gray-700"
                    title="Download snapshot PNG"
                >
                    Snapshot
                </button>
            </div>
        </div>
    );
}
