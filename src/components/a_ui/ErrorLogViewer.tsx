import { useEffect, useState } from 'react';

export default function ErrorLogViewer({ stderrPath }: { stderrPath: string }) {
    const [log, setLog] = useState<string>('Loading error log...');

    useEffect(() => {
        fetch(`/${stderrPath}`)
            .then(res => res.text())
            .then(text => setLog(text))
            .catch(() => setLog('Failed to load error log.'));
    }, [stderrPath]);

    return (
        <div className="h-full w-full overflow-auto p-4 bg-gray-800">
            <pre className="text-sm text-red-400 whitespace-pre-wrap font-mono">
                {log}
            </pre>
        </div>
    );
}
