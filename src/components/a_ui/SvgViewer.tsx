import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

export default function SvgViewer({ svgPath }: { svgPath: string }) {
    return (
        <div className="w-full h-full bg-gray-800">
            <TransformWrapper>
                <TransformComponent wrapperStyle={{width: '100%', height: '100%'}} contentStyle={{width: '100%', height: '100%'}}>
                    <img src={svgPath} alt="Dependency Graph" className="max-w-none max-h-none" />
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}
