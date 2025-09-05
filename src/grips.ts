import { defineGrip } from './runtime';
import type { AtomTapHandle } from '@owebeeone/grip-react';

// --- Constants ---
// Default value for part selection - using '<main>' instead of undefined to avoid 
// issues with change detection when switching between parts and main
export const DEFAULT_PART = "<main>";

// --- UI State & Selection Grips (Inputs) ---

export const VIEW_MODE = defineGrip<'modules' | 'errors'>('UI.ViewMode', 'modules');
export const SHOW_SPLASH = defineGrip<boolean>('UI.ShowSplash', false);
export const SHOW_SPLASH_TAP = defineGrip<AtomTapHandle<boolean>>('UI.ShowSplash.Tap');
export const SHOW_SPLASH_AUTO = defineGrip<boolean>('UI.ShowSplashAuto', true);
export const SHOW_SPLASH_AUTO_TAP = defineGrip<AtomTapHandle<boolean>>('UI.ShowSplashAuto.Tap');
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

// --- UI State Grips ---
export type ViewerTab = 'PNG' | 'STL' | '3MF' | 'Graph' | 'Paths' | 'Code' | 'Scad' | 'Error' | 'OpenSCAD Error';
export const ACTIVE_TAB = defineGrip<ViewerTab>('UI.ActiveTab', 'PNG');
export const ACTIVE_TAB_TAP = defineGrip<AtomTapHandle<ViewerTab>>('UI.ActiveTab.Tap');

export const MODEL_LOAD_ERROR = defineGrip<string | undefined>('UI.ModelLoadError');
export const MODEL_LOAD_ERROR_TAP = defineGrip<AtomTapHandle<string | undefined>>('UI.ModelLoadError.Tap');


// --- Raw Data Grip ---

export const RAW_STATUS_JSON = defineGrip<any | undefined>('Data.RawStatusJson');

// --- Derived Navigation Grips ---

export const ALL_MODULES_LIST = defineGrip<any[] | undefined>('Data.Navigation.AllModules');
export const MODELS_IN_SELECTED_MODULE_LIST = defineGrip<any[] | undefined>('Data.Navigation.ModelsInModule');
export const MODELS_WITH_ERRORS_LIST = defineGrip<any[] | undefined>('Data.Navigation.ModelsWithErrors');
export const FILTERED_MODULES_LIST = defineGrip<any[] | undefined>('Data.Navigation.FilteredModules');
export const MODULE_FILTER_STRING = defineGrip<string>('UI.ModuleFilterString', '');
export const MODULE_FILTER_STRING_TAP = defineGrip<AtomTapHandle<string>>('UI.ModuleFilterString.Tap');
export const MODULE_FILTER_ERRORS_ONLY = defineGrip<boolean>('UI.ModuleFilterErrorsOnly', false);
export const MODULE_FILTER_ERRORS_ONLY_TAP = defineGrip<AtomTapHandle<boolean>>('UI.ModuleFilterErrorsOnly.Tap');

// --- Derived Content Grips (Outputs) ---

export const CURRENT_MODEL_DATA = defineGrip<any | undefined>('Model.Data');
export const CURRENT_MODEL_PARTS = defineGrip<any[] | undefined>('Model.Parts');
export const CURRENT_STL_PATH = defineGrip<string | undefined>('Model.StlPath');
export const CURRENT_3MF_PATH = defineGrip<string | undefined>('Model.3mfPath');
export const CURRENT_PNG_PATH = defineGrip<string | undefined>('Model.PngPath');
export const CURRENT_SCAD_PATH = defineGrip<string | undefined>('Model.ScadPath');
export const CURRENT_GRAPH_SVG_PATH = defineGrip<string | undefined>('Model.GraphSvgPath');
export const CURRENT_STDERR_PATH = defineGrip<string | undefined>('Model.StderrPath');
export const CURRENT_STDERR_LEN = defineGrip<number | undefined>('Model.error_file_size');

// OpenSCAD error output (separate from runtime stderr)
export const CURRENT_OPENSCAD_STDERR_PATH = defineGrip<string | undefined>('Model.OpenSCADStderrPath');
export const CURRENT_OPENSCAD_STDERR_LEN = defineGrip<number | undefined>('Model.openscad_err_file_size');

export const CURRENT_CODE_TEXT = defineGrip<string | undefined>('Model.CodeText');
export const CURRENT_CODE_TEXT_TAP = defineGrip<AtomTapHandle<string | undefined>>('Model.CodeText.Tap');

// --- Source Code (Python) Grips ---
export const CURRENT_SOURCE_CODE_TEXT = defineGrip<string | undefined>('Model.SourceCodeText');
export const CURRENT_SOURCE_GITHUB_URL = defineGrip<string | undefined>('Model.SourceGithubUrl');
export const CURRENT_SOURCE_RAW_URL = defineGrip<string | undefined>('Model.SourceRawUrl');
export const CURRENT_SOURCE_LINE_NUMBER = defineGrip<number | undefined>('Model.SourceLineNumber');

// --- Paths (interactive SVG) Grips ---
export const CURRENT_PATHS_HTML_PATH = defineGrip<string | undefined>('Model.PathsHtmlPath');
export const CURRENT_PATHS_JSON_PATH = defineGrip<string | undefined>('Model.PathsJsonPath');
export const PATHS_VIEW_DATA = defineGrip<any | undefined>('Model.PathsViewData');

export const PATHS_SELECTED_PATH_ID = defineGrip<string | undefined>('UI.Paths.SelectedPathId');
export const PATHS_SELECTED_PATH_ID_TAP = defineGrip<AtomTapHandle<string | undefined>>('UI.Paths.SelectedPathId.Tap');
export const PATHS_SELECTED_SEGMENT_IDS = defineGrip<string[]>('UI.Paths.SelectedSegmentIds', []);
export const PATHS_SELECTED_SEGMENT_IDS_TAP = defineGrip<AtomTapHandle<string[]>>('UI.Paths.SelectedSegmentIds.Tap');
export const PATHS_HOVER_SEGMENT_ID = defineGrip<string | undefined>('UI.Paths.HoverSegmentId');
export const PATHS_HOVER_SEGMENT_ID_TAP = defineGrip<AtomTapHandle<string | undefined>>('UI.Paths.HoverSegmentId.Tap');
export const PATHS_SHOW_CONSTRUCTION = defineGrip<boolean>('UI.Paths.ShowConstruction', true);
export const PATHS_SHOW_CONSTRUCTION_TAP = defineGrip<AtomTapHandle<boolean>>('UI.Paths.ShowConstruction.Tap');

export const PATHS_SELECTED_SOURCE_GITHUB_URL = defineGrip<string | undefined>('UI.Paths.SelectedSourceGithubUrl');
export const PATHS_SELECTED_SOURCE_LINE = defineGrip<number | undefined>('UI.Paths.SelectedSourceLine');

// Viewport (zoom/pan) state for Paths viewer
export type PathsViewBox = { x: number; y: number; w: number; h: number } | undefined;
export const PATHS_VIEWBOX = defineGrip<PathsViewBox>('UI.Paths.ViewBox');
export const PATHS_VIEWBOX_TAP = defineGrip<AtomTapHandle<PathsViewBox>>('UI.Paths.ViewBox.Tap');

// Selection inspect info (for UI panel and overlay)
export const PATHS_INSPECT = defineGrip<any | undefined>('UI.Paths.Inspect');
export const PATHS_INSPECT_TAP = defineGrip<AtomTapHandle<any | undefined>>('UI.Paths.Inspect.Tap');
