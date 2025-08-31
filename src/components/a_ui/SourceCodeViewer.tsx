import { useEffect, useMemo } from 'react';
import { useGrip } from '@owebeeone/grip-react';
import { 
  CURRENT_SOURCE_CODE_TEXT,
  CURRENT_SOURCE_GITHUB_URL,
  CURRENT_SOURCE_LINE_NUMBER
} from '../../grips';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function SourceCodeViewer() {
  const code = useGrip(CURRENT_SOURCE_CODE_TEXT);
  const githubUrl = useGrip(CURRENT_SOURCE_GITHUB_URL);
  const lineNumber = useGrip(CURRENT_SOURCE_LINE_NUMBER);
  const MAX_HILITE = 30_000; // ~300KB threshold for highlighting
  const canHighlight = typeof code === 'string' && code.length > 0 && code.length <= MAX_HILITE;

  const highlightLine = useMemo(() => {
    if (!lineNumber || !code) return undefined;
    const totalLines = code.split('\n').length;
    if (lineNumber < 1) return 1;
    if (lineNumber > totalLines) return totalLines;
    return lineNumber;
  }, [lineNumber, code]);

  useEffect(() => {
    if (!highlightLine) return;
    const el = document.getElementById(`source-line-${highlightLine}`);
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightLine, code]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-shrink-0 flex items-center gap-3 px-3 py-2 bg-gray-800 border-b border-gray-700 text-sm">
        {githubUrl ? (
          <a href={githubUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 underline">
            View on GitHub{lineNumber ? ` (line ${lineNumber})` : ''}
          </a>
        ) : (
          <span className="text-gray-400">Source link unavailable</span>
        )}
      </div>
      <div className="flex-grow min-h-0 overflow-auto">
        {canHighlight ? (
          <SyntaxHighlighter
            language="python"
            style={dracula}
            customStyle={{ margin: 0, height: '100%' }}
            showLineNumbers
            wrapLines
            lineNumberStyle={{ opacity: 0.8 }}
            lineProps={(line) => {
              const isTarget = highlightLine === line;
              return {
                id: `source-line-${line}`,
                style: isTarget
                  ? { backgroundColor: 'rgba(255, 255, 0, 0.16)' }
                  : undefined,
              } as any;
            }}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          <pre className="m-0 p-2 text-gray-200 whitespace-pre-wrap">
            {code ?? '// Loading...'}
          </pre>
        )}
      </div>
    </div>
  );
}


