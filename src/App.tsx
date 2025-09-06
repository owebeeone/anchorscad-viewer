import { useGrip } from '@owebeeone/grip-react';
import { VIEW_MODE, SHOW_SPLASH, SHOW_SPLASH_TAP, SHOW_SPLASH_AUTO, MODULES_PANEL_COLLAPSED, MODULES_PANEL_COLLAPSED_TAP, ALL_MODULES_LIST, FILTERED_MODULES_LIST, FULL_SCREEN, FULL_SCREEN_TAP } from './grips';
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
  const isFullScreen = useGrip(FULL_SCREEN) || false;
  const setFullScreen = useGripSetter(FULL_SCREEN_TAP);

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
      <header className={`flex-shrink-0 bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between relative ${isFullScreen ? 'hidden' : ''}`}>
        <div className="flex items-center gap-3">
          <FullScreenButtons />
          <h1 className="text-lg font-bold text-white">AnchorSCAD Runner Viewer</h1>
        </div>
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
        {/* KeepAlive keeps module-related grips subscribed so they don't churn when collapsing */}
        <KeepAliveModules />
        <div className={`absolute inset-0 ${isFullScreen ? 'bg-black' : ''}`}>
          <div
            className={`absolute inset-0 z-10 transition-all duration-[600ms] ${modulesCollapsed ? 'opacity-0 pointer-events-none -translate-x-4 invisible cursor-auto' : 'opacity-100 translate-x-0'}`}
            aria-hidden={modulesCollapsed}
          >
            {!modulesCollapsed && (
              <PanelGroup direction="horizontal">
                <Panel defaultSize={20} minSize={8} className={`${isFullScreen ? 'hidden' : ''}`}>
                  {viewMode === 'modules' ? <ModuleBrowser /> : <ErrorBrowser />}
                </Panel>
                {!isFullScreen && (
                  <PanelResizeHandle className="w-1 bg-gray-800 hover:bg-blue-600 transition-colors" />
                )}
                <Panel defaultSize={80} minSize={30}>
                  <div className="relative h-full">
                    <ModelDetailView />
                    {!isFullScreen && <CollapseOverlayButton />}
                    <FullScreenRestoreOverlay />
                  </div>
                </Panel>
              </PanelGroup>
            )}
          </div>

          <div
            className={`absolute inset-0 z-0 transition-all duration-[600ms] ${modulesCollapsed ? 'opacity-100 translate-x-0' : 'opacity-0 pointer-events-none translate-x-4'}`}
            aria-hidden={!modulesCollapsed}
          >
            <div className="h-full w-full relative">
              {modulesCollapsed && <ModelDetailView />}
              {!isFullScreen && <HoverExpandControl />}
              <FullScreenRestoreOverlay />
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
          <polygon points="0,0 12,48 0,96" fill="currentColor" stroke="#000" strokeOpacity="0.6" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
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
        <polygon points="12,0 0,48 12,96" fill="currentColor" stroke="#000" strokeOpacity="0.6" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function CollapseOverlayButton() {
  const setCollapsed = useGripSetter(MODULES_PANEL_COLLAPSED_TAP);
  return (
    <button
      type="button"
      onClick={() => setCollapsed(true)}
      className="absolute top-1/2 -translate-y-1/2 left-0 h-24 w-3 flex items-center justify-center text-white/80 hover:text-white bg-gray-800/10 hover:bg-blue-600/20 z-30"
      title="Collapse modules panel"
    >
      <svg className="h-24 w-3" viewBox="0 0 12 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <polygon points="12,0 0,48 12,96" fill="currentColor" stroke="#000" strokeOpacity="0.6" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function FullScreenButtons() {
  const isFull = useGrip(FULL_SCREEN) || false;
  const setFull = useGripSetter(FULL_SCREEN_TAP);
  useEffect(() => {
    const onChange = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [setFull]);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          const target = document.documentElement;
          if (target.requestFullscreen) {
            target.requestFullscreen().then(() => setFull(true)).catch(() => setFull(false));
          } else {
            setFull(true);
          }
        }}
        title="Full screen"
        className="h-7 w-7 grid place-items-center rounded hover:bg-gray-700"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4">
          <rect x="2" y="2" width="16" height="16" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  );
}

function FullScreenRestoreOverlay() {
  const isFull = useGrip(FULL_SCREEN) || false;
  const setFull = useGripSetter(FULL_SCREEN_TAP);
  if (!isFull) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (document.exitFullscreen) {
          document.exitFullscreen().finally(() => setFull(false));
        } else {
          setFull(false);
        }
      }}
      title="Restore"
      className="absolute top-2 left-2 z-40 h-8 w-8 grid place-items-center rounded bg-gray-800/60 hover:bg-gray-700 text-white"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4">
        <rect x="2" y="2" width="16" height="16" fill="#9ca3af" stroke="#e5e7eb" strokeWidth="1.5" />
        <rect x="6.5" y="6.5" width="7" height="7" fill="#e5e7eb" stroke="#e5e7eb" strokeWidth="1.2" />
      </svg>
    </button>
  );
}

function KeepAliveModules() {
  // Always subscribe to module lists to avoid add/remove churn during panel collapse
  useGrip(ALL_MODULES_LIST);
  useGrip(FILTERED_MODULES_LIST);
  return null;
}
