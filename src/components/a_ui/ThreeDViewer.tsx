import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { Stage, ArcballControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { STLLoader } from 'three-stdlib';
import { Suspense, useEffect, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import ViewerControls from './ViewerControls';
import { useGripSetter } from '@owebeeone/grip-react';
import { MODEL_LOAD_ERROR_TAP } from '../../grips';
import ErrorBoundary from '../ErrorBoundary';

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
            <meshStandardMaterial color="#b8a60b" />
        </mesh>
    );
}

export default function ThreeDViewer({ stlPath, pngPath }: { stlPath: string; pngPath?: string }) {
    const glRef = useRef<any>(null);
    const invalidateRef = useRef<(() => void) | null>(null);
    const setLoadError = useGripSetter(MODEL_LOAD_ERROR_TAP);

    useLayoutEffect(() => {
        // Force recompute on path or container resize to avoid stale camera fit
        const tick = () => window.dispatchEvent(new Event('resize'));
        const t = window.setTimeout(tick, 50);
        return () => window.clearTimeout(t);
    }, [stlPath]);

    const handleCreated = ({ gl, invalidate }: any) => {
        glRef.current = gl;
        invalidateRef.current = invalidate;
        const canvas: HTMLCanvasElement = gl.domElement;

        const onLost = (e: React.SyntheticEvent<HTMLCanvasElement, WebGLContextEvent>) => {
            e.preventDefault();
            console.warn("WebGL context lost.");
            setLoadError("WebGL context lost. Please wait for it to restore.");
        };

        const onRestored = () => {
            console.info("WebGL context restored.");
            setLoadError(undefined); // Clear error
            invalidate();
        };

        canvas.addEventListener('webglcontextlost', onLost as any, false);
        canvas.addEventListener('webglcontextrestored', onRestored as any, false);
    };

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
            <ErrorBoundary
                resetKey={stlPath}
                onCatch={(error) => setLoadError(`3D Viewer Error: ${error.message}`)}
                onReset={() => setLoadError(undefined)}
            >
                <Canvas
                    camera={{ position: [2, 2, 2], fov: 50 }}
                    gl={{ preserveDrawingBuffer: true }}
                    onCreated={handleCreated}
                    frameloop="demand"
                >
                    <ambientLight intensity={0.5} color={0xffffff} />
                    <directionalLight 
                        position={[5, 5, 5]} 
                        intensity={2.3} 
                        color={0xffffff}
                        castShadow
                    />
                    <directionalLight 
                        position={[-3, -3, 2]} 
                        intensity={4.6} 
                        color={0xc0c00f}
                    />
                    <Suspense fallback={null}>
                        {stlPath && <StlModel key={stlPath} url={stlPath} />}
                    </Suspense>
                    <ArcballControls makeDefault enablePan />
                    <GizmoHelper alignment="bottom-left" margin={[80, 80]}>
                        <GizmoViewport axisColors={["#ff3653", "#8adb00", "#2c8fff"]} labelColor="white" />
                    </GizmoHelper>
                </Canvas>
            </ErrorBoundary>
            <ViewerControls
                handleSaveFile={handleSaveFile}
                handleSnapshot={handleSnapshot}
                saveFileTitle="Download STL file"
                snapshotTitle="Download snapshot PNG"
            />
        </div>
    );
}
