
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Stage, ArcballControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { ThreeMFLoader } from 'three-stdlib';
import { Suspense, useEffect, useRef } from 'react';

function ThreeMFModel({ url }: { url: string }) {
    const scene = useLoader(ThreeMFLoader, url);
    // Normalize materials to reduce specular tinting and disable tone mapping
    // for closer color parity with the PNG preview
    useEffect(() => {
        scene.traverse((obj: any) => {
            const mat = obj?.material;
            const apply = (m: any) => {
                if (!m) return;
                if (typeof m.metalness === 'number') m.metalness = 0;
                if (typeof m.roughness === 'number') m.roughness = 1;
                if ('toneMapped' in m) m.toneMapped = false;
            };
            if (Array.isArray(mat)) mat.forEach(apply); else apply(mat);
        });
    }, [scene]);

    // Fit camera to object and set desired orientation similar to PNG
    const { camera } = useThree();
    const controls = useThree((s: any) => s.controls) as any;
    useEffect(() => {
        // Compute bounding sphere of the scene
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const radius = box.getSize(new THREE.Vector3()).length() * 0.5;
        const phi = THREE.MathUtils.degToRad(55);
        const theta = THREE.MathUtils.degToRad(45);
        const fov = (camera as THREE.PerspectiveCamera).fov ?? 50;
        const distance = radius / Math.sin(THREE.MathUtils.degToRad(fov) / 2) * 1.2;
        const offset = new THREE.Vector3().setFromSphericalCoords(distance, phi, theta);
        camera.up.set(0, 0, 1);
        camera.position.copy(center.clone().add(offset));
        camera.lookAt(center);
        if (controls?.target) {
            controls.target.copy(center);
            controls.update?.();
        }
    }, [scene, camera, controls]);
    return <primitive object={scene} />;
}

export default function ThreeMFViewer({ threeMfPath, pngPath }: { threeMfPath: string; pngPath?: string }) {
    const modelGroupRef = useRef<any>(null);
    const glRef = useRef<any>(null);
    const invalidateRef = useRef<(() => void) | null>(null);

    // Dispose previous model resources when switching files to avoid GPU leaks
    useEffect(() => {
        return () => {
            const group: any = (modelGroupRef as any).current;
            if (!group) return;
            group.traverse((obj: any) => {
                if (obj.geometry && typeof obj.geometry.dispose === 'function') {
                    obj.geometry.dispose();
                }
                const material = obj.material;
                if (material) {
                    if (Array.isArray(material)) {
                        material.forEach((m) => m && typeof m.dispose === 'function' && m.dispose());
                    } else if (typeof material.dispose === 'function') {
                        material.dispose();
                    }
                    // Best-effort dispose of material textures
                    for (const key in material) {
                        const value = (material as any)[key];
                        if (value && typeof value.dispose === 'function' && value.isTexture) {
                            value.dispose();
                        }
                    }
                }
            });
        };
    }, [threeMfPath]);

    const handleCreated = ({ gl, invalidate }: any) => {
        const canvas: HTMLCanvasElement = gl.domElement;
        glRef.current = gl;
        invalidateRef.current = invalidate;
        // Ensure color space and disable tone mapping to better match PNGs
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.NoToneMapping;
        const onLost = (e: WebGLContextEvent) => {
            // Allow the context to restore automatically
            e.preventDefault();
        };
        const onRestored = () => {
            // Trigger a render after restoration
            invalidate();
        };
        canvas.addEventListener('webglcontextlost', onLost as any, false);
        canvas.addEventListener('webglcontextrestored', onRestored as any, false);
    };

    const handleSnapshot = () => {
        try {
            const canvas = glRef.current?.domElement as HTMLCanvasElement | undefined;
            if (!canvas) return;
            // Force a fresh frame before reading pixels
            invalidateRef.current?.();
            requestAnimationFrame(() => {
                const url = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = url;
                const fileName = (() => {
                    if (!pngPath) return '3mf_snap.png';
                    const base = pngPath.split('/').pop() || 'image.png';
                    if (/\.png$/i.test(base)) return base.replace(/\.png$/i, '.3mf_snap.png');
                    return `${base}.3mf_snap.png`;
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
            a.href = threeMfPath;
            const name = (threeMfPath.split('/').pop() || 'model.3mf').replace(/\/+$/, '');
            a.download = /\.(3mf|f3mf)$/i.test(name) ? name : `${name}.3mf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error('Failed to download 3MF:', e);
        }
    };

    return (
        <div className="relative h-full w-full">
            {/* Add the flat prop here to disable tone mapping */}
            <Canvas
                flat
                dpr={[1, 1.5]}
                frameloop="demand"
                gl={{ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
                onCreated={handleCreated}
                camera={{ position: [2, 2, 2], fov: 50 }}
            >
                <ambientLight intensity={1.0} color={0xffffff} />
                <directionalLight position={[10, 10, 5]} intensity={1.4} color={0xffff00} />
                <directionalLight position={[10, -10, 5]} intensity={1.9} color={0xffffff} />

                <Stage environment={null as any} intensity={1.0} shadows={{ type: 'contact', opacity: 0.2, blur: 2 }}>
                    <group ref={modelGroupRef as any} key={threeMfPath}>
                        <Suspense fallback={null}>
                            {threeMfPath && <ThreeMFModel url={threeMfPath} />}
                        </Suspense>
                    </group>
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
                    title="Download 3MF file"
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