import { useGrip } from '@owebeeone/grip-react';
import { CURRENT_CODE_TEXT } from '../../grips';

export default function CodeViewer() {
    const code = useGrip(CURRENT_CODE_TEXT);

    return (
        <div className="h-full w-full overflow-auto">
            <pre className="m-0 p-2 text-gray-200 whitespace-pre-wrap">
                {code ?? '// Loading...'}
            </pre>
        </div>
    );
}
