import { useGrip } from '@owebeeone/grip-react';
import { VIEW_MODE } from './grips';
import ModuleBrowser from './components/ModuleBrowser';
import ErrorBrowser from './components/ErrorBrowser';
import ModelDetailView from './components/ModelDetailView';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function App() {
  const viewMode = useGrip(VIEW_MODE);

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-300 font-sans flex flex-col">
      <header className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">AnchorSCAD Runner Viewer</h1>
        {/* View mode toggle can go here if needed */}
      </header>
      
      <main className="flex-grow min-h-0">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={15}>
            {viewMode === 'modules' ? <ModuleBrowser /> : <ErrorBrowser />}
          </Panel>
          <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-blue-600 transition-colors" />
          <Panel defaultSize={80} minSize={30}>
            <ModelDetailView />
          </Panel>
        </PanelGroup>
      </main>
    </div>
  );
}
