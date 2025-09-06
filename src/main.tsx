import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GripProvider } from '@owebeeone/grip-react'
import { grok, mainContext } from './runtime.ts'
import {
    createStatusJsonFetcherTap,
    createGlobalNavigationDataProviderTap,
    createModuleSpecificNavigationTap,
    createModelResourceProviderTap,
    createCodeTextLoaderTap,
    createSourceCodeLoaderTap,
    createPathsPathResolverTap,
    createPathsDocumentLoaderTap,
    createModuleFilterTap,
    ViewModeTap as _ViewModeTap,
    ShowSplashTap as _ShowSplashTap,
    ShowSplashAutoTap as _ShowSplashAutoTap,
    ModuleFilterStringTap as _ModuleFilterStringTap,
    ModuleFilterErrorsOnlyTap as _ModuleFilterErrorsOnlyTap,
    SelectedModuleNameTap as _SelectedModuleNameTap,
    SelectedShapeNameTap as _SelectedShapeNameTap,
    SelectedExampleNameTap as _SelectedExampleNameTap,
    SelectedPartNameTap as _SelectedPartNameTap,
    ActiveTabTap as _ActiveTabTap,
    PathsSelectedPathIdTap as _PathsSelectedPathIdTap,
    PathsSelectedSegmentIdsTap as _PathsSelectedSegmentIdsTap,
    PathsHoverSegmentIdTap as _PathsHoverSegmentIdTap,
    PathsShowConstructionTap as _PathsShowConstructionTap,
    PathsViewBoxTap as _PathsViewBoxTap,
    PathsInspectTap as _PathsInspectTap,
    ModulesPanelCollapsedTap as _ModulesPanelCollapsedTap,
    ModelLoadErrorTap as _ModelLoadErrorTap,
    FullScreenTap as _FullScreenTap
} from './taps.ts'

// Register all data provider taps with the GROK engine
grok.registerTap(createStatusJsonFetcherTap());
grok.registerTap(createGlobalNavigationDataProviderTap());
grok.registerTap(createModuleFilterTap());
grok.registerTap(createModuleSpecificNavigationTap());
grok.registerTap(createModelResourceProviderTap());
grok.registerTap(createCodeTextLoaderTap());
grok.registerTap(createSourceCodeLoaderTap());
grok.registerTap(createPathsPathResolverTap());
grok.registerTap(createPathsDocumentLoaderTap());

// Register all state management taps
grok.registerTap(_ViewModeTap);
grok.registerTap(_ModuleFilterStringTap);
grok.registerTap(_ModuleFilterErrorsOnlyTap);
grok.registerTap(_SelectedModuleNameTap);
grok.registerTap(_SelectedShapeNameTap);
grok.registerTap(_SelectedExampleNameTap);
grok.registerTap(_SelectedPartNameTap);
grok.registerTap(_ActiveTabTap);
grok.registerTap(_PathsSelectedPathIdTap);
grok.registerTap(_PathsSelectedSegmentIdsTap);
grok.registerTap(_PathsHoverSegmentIdTap);
grok.registerTap(_PathsShowConstructionTap);
grok.registerTap(_PathsViewBoxTap);
grok.registerTap(_PathsInspectTap);
grok.registerTap(_ShowSplashTap);
grok.registerTap(_ShowSplashAutoTap);
grok.registerTap(_ModulesPanelCollapsedTap);
grok.registerTap(_ModelLoadErrorTap);
grok.registerTap(_FullScreenTap);


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GripProvider grok={grok} context={mainContext}>
      <App />
    </GripProvider>
  </React.StrictMode>,
)
