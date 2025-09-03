export default function PngViewer({ pngPath }: { pngPath: string }) {
    const handleSave = () => {
        try {
            const a = document.createElement('a');
            a.href = pngPath;
            const name = pngPath.split('/').pop() || 'image.png';
            a.download = name.endsWith('.png') ? name : `${name}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (e) {
            console.error('Failed to save PNG:', e);
        }
    };

    return (
        <div className="h-full relative bg-gray-900">
            <div className="h-full flex items-center justify-center">
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
            <button
                onClick={handleSave}
                className="absolute bottom-2 left-2 bg-gray-800/80 text-white text-xs px-2 py-1 rounded shadow hover:bg-gray-700"
                title="Save image"
            >
                Save
            </button>
        </div>
    );
}
