import { useGrip } from '@owebeeone/grip-react';
import { CURRENT_CODE_TEXT } from '../../grips';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Displays OpenSCAD code
export default function CodeViewer() {
  const code = useGrip(CURRENT_CODE_TEXT);
  const MAX_HILITE = 30_000; // ~300KB threshold for highlighting
  const canHighlight = typeof code === 'string' && code.length > 0 && code.length <= MAX_HILITE;

  return (
    <div className="h-full w-full overflow-auto">
      {canHighlight ? (
        <SyntaxHighlighter language="scss" style={dracula} customStyle={{ margin: 0, height: '100%' }}>
          {code}
        </SyntaxHighlighter>
      ) : (
        <pre className="m-0 p-2 text-gray-200 whitespace-pre-wrap">
          {code ?? '// Loading...'}
        </pre>
      )}
    </div>
  );
}
