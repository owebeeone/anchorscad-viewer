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
    ActiveTabTap as _ActiveTabTap
} from './taps.ts'

// Register all data provider taps with the GROK engine
grok.registerTap(createStatusJsonFetcherTap());
grok.registerTap(createGlobalNavigationDataProviderTap());
grok.registerTap(createModuleFilterTap());
grok.registerTap(createModuleSpecificNavigationTap());
grok.registerTap(createModelResourceProviderTap());
grok.registerTap(createCodeTextLoaderTap());
grok.registerTap(createSourceCodeLoaderTap());

// Register all state management taps
grok.registerTap(_ViewModeTap);
grok.registerTap(_ModuleFilterStringTap);
grok.registerTap(_ModuleFilterErrorsOnlyTap);
grok.registerTap(_SelectedModuleNameTap);
grok.registerTap(_SelectedShapeNameTap);
grok.registerTap(_SelectedExampleNameTap);
grok.registerTap(_SelectedPartNameTap);
grok.registerTap(_ActiveTabTap);
grok.registerTap(_ShowSplashTap);
grok.registerTap(_ShowSplashAutoTap);


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GripProvider grok={grok} context={mainContext}>
      <App />
    </GripProvider>
  </React.StrictMode>,
)
