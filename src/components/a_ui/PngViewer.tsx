export default function PngViewer({ pngPath }: { pngPath: string }) {
    return (
        <div className="h-full flex items-center justify-center bg-gray-900">
            <img 
                src={pngPath} 
                alt="Model preview" 
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                    console.error('Failed to load PNG:', pngPath);
                    e.currentTarget.style.display = 'none';
                }}
            />
        </div>
    );
}
