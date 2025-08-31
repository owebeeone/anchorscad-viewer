import { Canvas, useLoader } from '@react-three/fiber';
import { Stage, OrbitControls } from '@react-three/drei';
import { STLLoader } from 'three-stdlib';
import { Suspense } from 'react';

function StlModel({ url }: { url: string }) {
    console.log('StlModel: Loading STL from URL:', url);
    const geometry = useLoader(STLLoader, url);
    console.log('StlModel: Successfully loaded geometry:', geometry);
    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color="#60a5fa" />
        </mesh>
    );
}

export default function ThreeDViewer({ stlPath }: { stlPath: string }) {
    return (
        <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
            <Stage environment="studio" intensity={0.6} shadows={{ type: 'contact', opacity: 0.2, blur: 2 }}>
                <Suspense fallback={null}>
                    {stlPath && <StlModel url={stlPath} />}
                </Suspense>
            </Stage>
            <OrbitControls makeDefault autoRotate={false} />
        </Canvas>
    );
}
