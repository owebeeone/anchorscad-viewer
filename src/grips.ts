import { defineGrip } from './runtime';
import type { AtomTapHandle } from '@owebeeone/grip-react';

// --- Constants ---
// Default value for part selection - using '<main>' instead of undefined to avoid 
// issues with change detection when switching between parts and main
export const DEFAULT_PART = "<main>";

// --- UI State & Selection Grips (Inputs) ---

export const VIEW_MODE = defineGrip<'modules' | 'errors'>('UI.ViewMode', 'modules');
export const SELECTED_MODULE_NAME = defineGrip<string | undefined>('Selection.ModuleName');
export const SELECTED_SHAPE_NAME = defineGrip<string | undefined>('Selection.ShapeName');
export const SELECTED_EXAMPLE_NAME = defineGrip<string | undefined>('Selection.ExampleName');
export const SELECTED_PART_NAME = defineGrip<string | undefined>('Selection.PartName', DEFAULT_PART);

// --- Atom Handles for controlling selection ---
export const VIEW_MODE_TAP = defineGrip<AtomTapHandle<'modules' | 'errors'>>('UI.ViewMode.Tap');
export const SELECTED_MODULE_NAME_TAP = defineGrip<AtomTapHandle<string | undefined>>('Selection.ModuleName.Tap');
export const SELECTED_SHAPE_NAME_TAP = defineGrip<AtomTapHandle<string | undefined>>('Selection.ShapeName.Tap');
export const SELECTED_EXAMPLE_NAME_TAP = defineGrip<AtomTapHandle<string | undefined>>('Selection.ExampleName.Tap');
export const SELECTED_PART_NAME_TAP = defineGrip<AtomTapHandle<string | undefined>>('Selection.PartName.Tap');


// --- Raw Data Grip ---

export const RAW_STATUS_JSON = defineGrip<any | undefined>('Data.RawStatusJson');

// --- Derived Navigation Grips ---

export const ALL_MODULES_LIST = defineGrip<any[] | undefined>('Data.Navigation.AllModules');
export const MODELS_IN_SELECTED_MODULE_LIST = defineGrip<any[] | undefined>('Data.Navigation.ModelsInModule');
export const MODELS_WITH_ERRORS_LIST = defineGrip<any[] | undefined>('Data.Navigation.ModelsWithErrors');

// --- Derived Content Grips (Outputs) ---

export const CURRENT_MODEL_DATA = defineGrip<any | undefined>('Model.Data');
export const CURRENT_MODEL_PARTS = defineGrip<any[] | undefined>('Model.Parts');
export const CURRENT_STL_PATH = defineGrip<string | undefined>('Model.StlPath');
export const CURRENT_PNG_PATH = defineGrip<string | undefined>('Model.PngPath');
export const CURRENT_SCAD_PATH = defineGrip<string | undefined>('Model.ScadPath');
export const CURRENT_GRAPH_SVG_PATH = defineGrip<string | undefined>('Model.GraphSvgPath');
export const CURRENT_STDERR_PATH = defineGrip<string | undefined>('Model.StderrPath');
