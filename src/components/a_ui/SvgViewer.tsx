import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { useRef, useState, useEffect } from 'react';

export default function SvgViewer({ svgPath }: { svgPath: string }) {
    const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSvg = async () => {
            try {
                setLoading(true);
                const response = await fetch(svgPath);
                const svgText = await response.text();
                setSvgContent(svgText);
            } catch (error) {
                console.error('Failed to load SVG:', error);
            } finally {
                setLoading(false);
            }
        };

        if (svgPath) {
            loadSvg();
        }
    }, [svgPath]);

    return (
        <div className="w-full h-full bg-gray-800 relative overflow-hidden">
            <style>{`
                .svg-viewer-container .react-transform-wrapper {
                    width: 100% !important;
                    height: 100% !important;
                }
                .svg-viewer-container .react-transform-component {
                    width: 100% !important;
                    height: 100% !important;
                    overflow: visible !important;
                }
            `}</style>
            <div className="svg-viewer-container w-full h-full">
            <TransformWrapper
                ref={transformRef}
                initialScale={0.9}
                centerOnInit={true}
                limitToBounds={false}
                minScale={0.1}
                maxScale={10}
                wheel={{ step: 0.1 }}
                panning={{ excluded: ['svg-controls'] }}
                doubleClick={{ disabled: true }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <TransformComponent>
                            {loading ? (
                                <div className="flex items-center justify-center w-full h-full text-gray-400">
                                    Loading SVG...
                                </div>
                            ) : (
                                <div 
                                    dangerouslySetInnerHTML={{ __html: svgContent }}
                                    style={{ 
                                        maxWidth: 'none',
                                        maxHeight: 'none',
                                        display: 'block'
                                    }}
                                />
                            )}
                        </TransformComponent>
                        <div className="absolute top-2 right-2 z-10 space-x-1 svg-controls">
                            <button 
                                onClick={() => zoomIn()} 
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded text-xs"
                            >
                                +
                            </button>
                            <button 
                                onClick={() => zoomOut()} 
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded text-xs"
                            >
                                -
                            </button>
                            <button 
                                onClick={() => resetTransform()} 
                                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-2 rounded text-xs"
                            >
                                Reset
                            </button>
                        </div>
                    </>
                )}
            </TransformWrapper>
            </div>
        </div>
    );
}