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
    <div className="h-full w-full relative">
      <div className="h-full overflow-auto">
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
      <button
        onClick={() => {
          try {
            const blob = new Blob([code ?? ''], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'model.scad';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (e) {
            console.error('Failed to save code:', e);
          }
        }}
        className="absolute bottom-2 left-2 z-10 bg-gray-800/80 text-white text-xs px-2 py-1 rounded shadow hover:bg-gray-700"
        title="Save .scad"
      >
        Save
      </button>
    </div>
  );
}
