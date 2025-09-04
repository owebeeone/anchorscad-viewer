import { useGrip } from '@owebeeone/grip-react';
import { VIEW_MODE, SHOW_SPLASH, SHOW_SPLASH_TAP, SHOW_SPLASH_AUTO } from './grips';
import ModuleBrowser from './components/ModuleBrowser';
import ErrorBrowser from './components/ErrorBrowser';
import ModelDetailView from './components/ModelDetailView';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Splash from './components/Splash';
import { useGripSetter } from '@owebeeone/grip-react';

export default function App() {
  const viewMode = useGrip(VIEW_MODE);
  const showSplash = useGrip(SHOW_SPLASH);
  const showSplashAuto = useGrip(SHOW_SPLASH_AUTO);
  const setShowSplash = useGripSetter(SHOW_SPLASH_TAP);

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-300 font-sans flex flex-col">
      <header className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between relative">
        <h1 className="text-lg font-bold text-white">AnchorSCAD Runner Viewer</h1>
        <nav>
          <button
            className="text-sm px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-600"
            onClick={() => { setShowSplash(true); }}
          >
            About
          </button>
        </nav>
      </header>
      
      <main className="flex-grow min-h-0 relative">
        {(showSplash || showSplashAuto) && <Splash />}
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
