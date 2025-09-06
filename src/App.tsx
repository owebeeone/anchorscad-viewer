import { useGrip } from '@owebeeone/grip-react';
import { VIEW_MODE, SHOW_SPLASH, SHOW_SPLASH_TAP, SHOW_SPLASH_AUTO, MODULES_PANEL_COLLAPSED, MODULES_PANEL_COLLAPSED_TAP } from './grips';
import ModuleBrowser from './components/ModuleBrowser';
import ErrorBrowser from './components/ErrorBrowser';
import ModelDetailView from './components/ModelDetailView';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Splash from './components/Splash';
import { useGripSetter } from '@owebeeone/grip-react';
import { useRef, useEffect } from 'react';

export default function App() {
  const viewMode = useGrip(VIEW_MODE);
  const showSplash = useGrip(SHOW_SPLASH);
  const showSplashAuto = useGrip(SHOW_SPLASH_AUTO);
  const setShowSplash = useGripSetter(SHOW_SPLASH_TAP);
  const modulesCollapsed = useGrip(MODULES_PANEL_COLLAPSED);
  const setModulesCollapsed = useGripSetter(MODULES_PANEL_COLLAPSED_TAP);

  // Nudge 3D canvases to re-compute size and render when layout changes
  useEffect(() => {
    // Immediate resize event to update layout synchronously
    window.dispatchEvent(new Event('resize'));
    // And once more after the transition finishes
    const timeoutId: number = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 650);
    return () => window.clearTimeout(timeoutId);
  }, [modulesCollapsed]);

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
        <div className="absolute inset-0">
          <div
            className={`absolute inset-0 transition-all duration-[600ms] ${modulesCollapsed ? 'opacity-0 pointer-events-none -translate-x-4' : 'opacity-100 translate-x-0'}`}
            aria-hidden={modulesCollapsed}
          >
            <PanelGroup direction="horizontal">
              <Panel defaultSize={20} minSize={15}>
                {viewMode === 'modules' ? <ModuleBrowser /> : <ErrorBrowser />}
              </Panel>
              <PanelResizeHandle className="relative w-1 bg-transparent transition-colors overflow-visible z-30">
                <CollapseInHandle />
              </PanelResizeHandle>
              <Panel defaultSize={80} minSize={30}>
                <ModelDetailView />
              </Panel>
            </PanelGroup>
          </div>

          <div
            className={`absolute inset-0 transition-all duration-[600ms] ${modulesCollapsed ? 'opacity-100 translate-x-0' : 'opacity-0 pointer-events-none translate-x-4'}`}
            aria-hidden={!modulesCollapsed}
          >
            <div className="h-full w-full relative">
              <ModelDetailView />
              <HoverExpandControl />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function HoverExpandControl() {
  const setCollapsed = useGripSetter(MODULES_PANEL_COLLAPSED_TAP);
  const timerRef = useRef<number | null>(null);
  return (
    <div
      className="absolute inset-y-0 left-0 w-4 bg-gray-800/10 hover:bg-blue-600/20 cursor-pointer"
      title="Hover to expand modules panel"
      onMouseEnter={() => {
        if (timerRef.current !== null) return;
        timerRef.current = window.setTimeout(() => {
          setCollapsed(false);
          timerRef.current = null;
        }, 2000);
      }}
      onMouseLeave={() => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }}
      onClick={() => {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setCollapsed(false);
      }}
    >
      <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1 select-none">
        <svg className="h-24 w-3 text-white opacity-80" viewBox="0 0 12 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
          <polygon points="0,0 12,48 0,96" fill="currentColor" stroke="#000" stroke-opacity="0.6" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function CollapseInHandle() {
  const setCollapsed = useGripSetter(MODULES_PANEL_COLLAPSED_TAP);
  return (
    <button
      type="button"
      onClick={() => setCollapsed(true)}
      className="absolute inset-y-0 left-full ml-1 my-auto h-24 w-3 flex items-center justify-center text-white/80 hover:text-white bg-gray-800/10 hover:bg-blue-600/20 z-20"
      title="Collapse modules panel"
    >
      <svg className="h-24 w-3" viewBox="0 0 12 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <polygon points="12,0 0,48 12,96" fill="currentColor" stroke="#000" stroke-opacity="0.6" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
      </svg>
    </button>
  );
}
