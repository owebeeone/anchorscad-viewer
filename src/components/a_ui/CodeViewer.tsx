import { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeViewer({ scadPath }: { scadPath: string }) {
    const [code, setCode] = useState<string>('// Loading...');

    useEffect(() => {
        fetch(`/${scadPath}`)
            .then(res => res.text())
            .then(text => setCode(text))
            .catch(() => setCode('// Failed to load file.'));
    }, [scadPath]);

    return (
        <div className="h-full w-full overflow-auto">
            <SyntaxHighlighter language="scss" style={dracula} customStyle={{ margin: 0, height: '100%' }}>
                {code}
            </SyntaxHighlighter>
        </div>
    );
}
