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
    ViewModeTap,
    SelectedModuleNameTap,
    SelectedShapeNameTap,
    SelectedExampleNameTap,
    SelectedPartNameTap,
    ActiveTabTap
} from './taps.ts'

// Register all data provider taps with the GROK engine
grok.registerTap(createStatusJsonFetcherTap());
grok.registerTap(createGlobalNavigationDataProviderTap());
grok.registerTap(createModuleSpecificNavigationTap());
grok.registerTap(createModelResourceProviderTap());

// Register all state management taps
grok.registerTap(ViewModeTap);
grok.registerTap(SelectedModuleNameTap);
grok.registerTap(SelectedShapeNameTap);
grok.registerTap(SelectedExampleNameTap);
grok.registerTap(SelectedPartNameTap);
grok.registerTap(ActiveTabTap);


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GripProvider grok={grok} context={mainContext}>
      <App />
    </GripProvider>
  </React.StrictMode>,
)
