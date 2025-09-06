import {
    createAsyncHomeValueTap,
    createAsyncValueTap,
    createAsyncMultiTap,
    createFunctionTap,
    createAtomValueTap,
    type Tap,
    type Grip,
} from '@owebeeone/grip-react';

import {
    RAW_STATUS_JSON,
    ALL_MODULES_LIST,
    FILTERED_MODULES_LIST,
    MODULE_FILTER_STRING,
    MODULE_FILTER_ERRORS_ONLY,
    MODULE_FILTER_ERRORS_ONLY_TAP,
    MODULE_FILTER_STRING_TAP,
    MODELS_WITH_ERRORS_LIST,
    SELECTED_MODULE_NAME,
    MODELS_IN_SELECTED_MODULE_LIST,
    SELECTED_SHAPE_NAME,
    SELECTED_EXAMPLE_NAME,
    SELECTED_PART_NAME,
    CURRENT_MODEL_DATA,
    CURRENT_MODEL_PARTS,
    CURRENT_STL_PATH,
    CURRENT_PNG_PATH,
    CURRENT_SCAD_PATH,
    CURRENT_GRAPH_SVG_PATH,
    CURRENT_STDERR_PATH,
    VIEW_MODE,
    VIEW_MODE_TAP,
    SHOW_SPLASH,
    SHOW_SPLASH_TAP,
    SHOW_SPLASH_AUTO,
    SHOW_SPLASH_AUTO_TAP,
    SELECTED_MODULE_NAME_TAP,
    SELECTED_SHAPE_NAME_TAP,
    SELECTED_EXAMPLE_NAME_TAP,
    SELECTED_PART_NAME_TAP,
    ACTIVE_TAB,
    ACTIVE_TAB_TAP,
    DEFAULT_PART,
    CURRENT_CODE_TEXT,
    CURRENT_SOURCE_CODE_TEXT,
    CURRENT_SOURCE_GITHUB_URL,
    CURRENT_SOURCE_RAW_URL,
    CURRENT_SOURCE_LINE_NUMBER,
    CURRENT_3MF_PATH,
    CURRENT_STDERR_LEN,
    CURRENT_OPENSCAD_STDERR_PATH,
    CURRENT_OPENSCAD_STDERR_LEN,
    CURRENT_PATHS_HTML_PATH,
    CURRENT_PATHS_JSON_PATH,
    PATHS_VIEW_DATA,
    PATHS_SELECTED_PATH_ID,
    PATHS_SELECTED_PATH_ID_TAP,
    PATHS_SELECTED_SEGMENT_IDS,
    PATHS_SELECTED_SEGMENT_IDS_TAP,
    PATHS_HOVER_SEGMENT_ID,
    PATHS_HOVER_SEGMENT_ID_TAP,
    PATHS_SHOW_CONSTRUCTION,
    PATHS_SHOW_CONSTRUCTION_TAP,
    //PATHS_SELECTED_SOURCE_GITHUB_URL,
    //PATHS_SELECTED_SOURCE_LINE,
    PATHS_VIEWBOX,
    PATHS_VIEWBOX_TAP,
    PATHS_INSPECT,
    PATHS_INSPECT_TAP,
    MODULES_PANEL_COLLAPSED,
    MODULES_PANEL_COLLAPSED_TAP
} from './grips';

// Tap 1: Fetches the status.json file once and caches it.
export function createStatusJsonFetcherTap(): Tap {
    return createAsyncHomeValueTap({
        provides: RAW_STATUS_JSON,
        cacheTtlMs: 24 * 60 * 60 * 1000, // Cache for 24 hours
        requestKeyOf: () => 'status.json',
        fetcher: async (_, signal) => {
            const response = await fetch('status.json', { signal });
            if (!response.ok) throw new Error('Failed to fetch status.json');
            return await response.json();
        },
    });
}

// Tap 2: Provides global navigation lists that don't depend on selection.
export function createGlobalNavigationDataProviderTap(): Tap {
    // Define the grip types for this tap
    type Outs = {
        allModules: typeof ALL_MODULES_LIST;
        modelsWithErrors: typeof MODELS_WITH_ERRORS_LIST;
    };
    type Home = {
        rawStatus: typeof RAW_STATUS_JSON;
    };
    
    return createFunctionTap<Outs, Home>({
        provides: [ALL_MODULES_LIST, MODELS_WITH_ERRORS_LIST],
        homeParamGrips: [RAW_STATUS_JSON],
        compute: ({ getHomeParam }) => {
            const status = getHomeParam(RAW_STATUS_JSON);
            const updates = new Map<Grip<any>, any>();
            if (!status) return updates;

            const modulesWithContent = (status.module_status || []).filter((m: any) => m.shape_results?.length > 0);
            modulesWithContent.sort((a: any, b: any) => a.module_name.localeCompare(b.module_name));
            updates.set(ALL_MODULES_LIST, modulesWithContent);

            const modelsWithErrors = (status.module_status || []).flatMap((m: any) =>
                m.shape_results.flatMap((s: any) =>
                    s.example_results
                        .filter((e: any) => e.error_file_size > 0 || e.error_str)
                        .map((e: any) => ({ ...e, module_name: m.module_name, class_name: s.class_name }))
                )
            );
            updates.set(MODELS_WITH_ERRORS_LIST, modelsWithErrors);

            return updates;
        },
    });
}

// Tap 2a: Filter modules by space-separated substrings and add a preview image
export function createModuleFilterTap(): Tap {
    type Outs = { filteredModules: typeof FILTERED_MODULES_LIST };
    type Dest = { allModules: typeof ALL_MODULES_LIST; filter: typeof MODULE_FILTER_STRING; errorsOnly: typeof MODULE_FILTER_ERRORS_ONLY };
    return createFunctionTap<Outs, any, Dest>({
        provides: [FILTERED_MODULES_LIST],
        destinationParamGrips: [ALL_MODULES_LIST, MODULE_FILTER_STRING, MODULE_FILTER_ERRORS_ONLY],
        compute: ({ getDestParam }) => {
            const modules = getDestParam(ALL_MODULES_LIST) as any[] | undefined;
            const rawFilter = getDestParam(MODULE_FILTER_STRING) as unknown as string | undefined;
            const errorsOnly = getDestParam(MODULE_FILTER_ERRORS_ONLY) as unknown as boolean | undefined;
            const filterStr = (rawFilter || '').toString().trim();
            const updates = new Map<Grip<any>, any>();
            if (!modules) return updates;

            const tokens = filterStr.length > 0
                ? filterStr.split(/\s+/).filter(Boolean).map((t: string) => t.toLowerCase())
                : [];

            let filtered = modules;
            if (errorsOnly) {
                filtered = filtered.filter((m: any) => {
                    const hasErrors = (m.shape_results || []).some((s: any) =>
                        (s.example_results || []).some((e: any) => {
                            const aError = e.error_file_size && e.error_file_size > 0;
                            const parts = e.parts_model_files || {};
                            const bError = Object.values(parts).some((p: any) => (p.openscad_exit_status ?? 0) !== 0);
                            return aError || bError;
                        })
                    );
                    return hasErrors;
                });
            }
            if (tokens.length > 0) {
                filtered = modules.filter((m: any) => {
                    const hay = (m.module_name || '').toLowerCase();
                    return tokens.every((tok: string) => hay.includes(tok));
                });
            }

            // Augment with a preview image from any example within shape_results
            const augmented = filtered.map((m: any) => {
                let preview: string | undefined;
                for (const s of (m.shape_results || [])) {
                    for (const e of (s.example_results || [])) {
                        if (e.png_file) { preview = e.png_file; break; }
                    }
                    if (preview) break;
                }
                return { ...m, preview_png: preview };
            });

            updates.set(FILTERED_MODULES_LIST, augmented);
            return updates;
        }
    });
}

// Tap 3: Provides the list of models for the currently selected module.
export function createModuleSpecificNavigationTap(): Tap {
    // Define the grip types for this tap
    type Outs = {
        modelsInModule: typeof MODELS_IN_SELECTED_MODULE_LIST;
        sourceRawUrl: typeof CURRENT_SOURCE_RAW_URL;
    };
    type Home = {
        rawStatus: typeof RAW_STATUS_JSON;
    };
    type Dest = {
        selectedModule: typeof SELECTED_MODULE_NAME;
    };
    
    return createFunctionTap<Outs, Home, Dest>({
        provides: [MODELS_IN_SELECTED_MODULE_LIST, CURRENT_SOURCE_RAW_URL],
        homeParamGrips: [RAW_STATUS_JSON],
        destinationParamGrips: [SELECTED_MODULE_NAME],
        compute: ({ getHomeParam, getDestParam }) => {
            const status = getHomeParam(RAW_STATUS_JSON);
            const moduleName = getDestParam(SELECTED_MODULE_NAME);
            const updates = new Map<Grip<any>, any>();

            if (!status || !moduleName) return updates;

            const module = status.module_status?.find((m: any) => m.module_name === moduleName);
            const models = module?.shape_results.flatMap((s: any) =>
                s.example_results.map((e: any) => ({
                    ...e,
                    module_name: module.module_name,
                    class_name: s.class_name
                }))
            ) || [];
            updates.set(MODELS_IN_SELECTED_MODULE_LIST, models);

            // Compute a resolvable raw URL or local path for the module's python source
            const repo = module?.source_repo;
            if (repo && repo.repo_name && repo.commit_id && repo.file_path_in_repo) {
                const repoName = repo.repo_name;
                const commitId = repo.commit_id;
                const filePathInRepo = repo.file_path_in_repo;
                let rawSourceSpecifier: string | undefined = undefined;
                if (repo.is_on_origin === true) {
                    rawSourceSpecifier = `https://raw.githubusercontent.com/${repoName}/${commitId}${filePathInRepo}`;
                } else {
                    const localSource: string | undefined = module?.source_file;
                    if (localSource) {
                        rawSourceSpecifier = localSource;
                    } else {
                        // Guess: copy placed under public/output with 'src/' stripped
                        const withoutSrc = (filePathInRepo as string).replace(/^\/?src\//, '');
                        rawSourceSpecifier = `output/${withoutSrc}`;
                    }
                }
                console.log('ModuleSpecificNavigationTap: computed raw source specifier', {
                    moduleName,
                    repoService: repo.service,
                    isOnOrigin: repo.is_on_origin,
                    filePathInRepo,
                    rawSourceSpecifier
                });
                updates.set(CURRENT_SOURCE_RAW_URL, rawSourceSpecifier);
            } else {
                console.warn('ModuleSpecificNavigationTap: missing repo info for module', { moduleName, hasRepo: !!repo });
                updates.set(CURRENT_SOURCE_RAW_URL, undefined);
            }

            return updates;
        },
    });
}

// Tap 4: Provides all resources for the currently selected model/part.
export function createModelResourceProviderTap(): Tap {
    // Define the grip types for this tap
    type Outs = {
        modelData: typeof CURRENT_MODEL_DATA;
        modelParts: typeof CURRENT_MODEL_PARTS;
        stlPath: typeof CURRENT_STL_PATH;
        pngPath: typeof CURRENT_PNG_PATH;
        scadPath: typeof CURRENT_SCAD_PATH;
        threeMfPath: typeof CURRENT_3MF_PATH;
        graphPath: typeof CURRENT_GRAPH_SVG_PATH;
        stderrPath: typeof CURRENT_STDERR_PATH;
        sourceGithubUrl: typeof CURRENT_SOURCE_GITHUB_URL;
        sourceLineNumber: typeof CURRENT_SOURCE_LINE_NUMBER;
        pathsHtmlPath: typeof CURRENT_PATHS_HTML_PATH;
    };
    
    return createAsyncMultiTap<Outs, any>({
        provides: [
            CURRENT_MODEL_DATA, CURRENT_MODEL_PARTS, CURRENT_STL_PATH,
            CURRENT_PNG_PATH, CURRENT_SCAD_PATH, CURRENT_GRAPH_SVG_PATH, CURRENT_STDERR_PATH,
            CURRENT_SOURCE_GITHUB_URL, CURRENT_SOURCE_LINE_NUMBER, CURRENT_3MF_PATH,
            CURRENT_OPENSCAD_STDERR_PATH, CURRENT_OPENSCAD_STDERR_LEN, CURRENT_PATHS_HTML_PATH
        ],
        homeParamGrips: [RAW_STATUS_JSON],
        destinationParamGrips: [SELECTED_MODULE_NAME, SELECTED_SHAPE_NAME, SELECTED_EXAMPLE_NAME, SELECTED_PART_NAME],
        cacheTtlMs: 5 * 60 * 1000, // Cache for 5 minutes
        requestKeyOf: (params) => {
            // Create a unique key for caching based on the selection
            const moduleName = params.getDestParam(SELECTED_MODULE_NAME);
            const shapeName = params.getDestParam(SELECTED_SHAPE_NAME);
            const exampleName = params.getDestParam(SELECTED_EXAMPLE_NAME);
            const partName = params.getDestParam(SELECTED_PART_NAME);
            
            if (!moduleName || !shapeName || !exampleName) return undefined;
            
            // Create cache key that properly distinguishes between main and part selections
            const partKey = (!partName || partName === DEFAULT_PART) ? '__MAIN__' : partName;
            const cacheKey = `${moduleName}:${shapeName}:${exampleName}:${partKey}`;
            console.log('ModelResourceProviderTap requestKeyOf:', { partName, partKey, cacheKey });
            return cacheKey;
        },
        fetcher: async (params) => {
            const status = params.getHomeParam(RAW_STATUS_JSON);
            const moduleName = params.getDestParam(SELECTED_MODULE_NAME);
            const shapeName = params.getDestParam(SELECTED_SHAPE_NAME);
            const exampleName = params.getDestParam(SELECTED_EXAMPLE_NAME);
            const partName = params.getDestParam(SELECTED_PART_NAME);
            
            const partKey = (!partName || partName === DEFAULT_PART) ? '__MAIN__' : partName;
            const expectedCacheKey = `${moduleName}:${shapeName}:${exampleName}:${partKey}`;

            console.log('ModelResourceProviderTap fetcher called (SHOULD BE CACHED?):', {
                moduleName,
                shapeName,
                exampleName,
                partName,
                hasStatus: !!status,
                expectedCacheKey
            });

            if (!status || !moduleName || !shapeName || !exampleName) return null;
            
            const module = status.module_status?.find((m: any) => m.module_name === moduleName);
            const shape = module?.shape_results?.find((s: any) => s.class_name === shapeName);
            const example = shape?.example_results?.find((e: any) => e.example_name === exampleName);

            if (!example) {
                console.log('ModelResourceProviderTap: No example found');
                return null;
            }

            // Compute model-specific source link data
            const lineNumber: number | undefined = shape?.line_number;
            let githubUrl: string | undefined = undefined;
            const repo = module?.source_repo;
            if (repo && repo.repo_name && repo.commit_id && repo.file_path_in_repo && repo.service === 'github') {
                const repoName = repo.repo_name;
                const commitId = repo.commit_id;
                const filePathInRepo = repo.file_path_in_repo;
                githubUrl = `https://github.com/${repoName}/blob/${commitId}${filePathInRepo}${lineNumber ? `#L${lineNumber}` : ''}`;
            }
            console.log('ModelResourceProviderTap: source link computation', {
                moduleName,
                shapeName,
                lineNumber,
                hasRepo: !!repo,
                repoService: repo?.service,
                githubUrl
            });

            // Return an object containing both main example and part data (if selected)
            let currentData;
            if (partName && partName !== DEFAULT_PART) {
                console.log('ModelResourceProviderTap: Looking for part', partName);
                if (example.parts_model_files && example.parts_model_files[partName]) {
                    // Parts are keyed by strings like "default_physical"
                    const partData = example.parts_model_files[partName];
                    currentData = partData;
                    console.log('ModelResourceProviderTap: Found part data for', partName, partData);
                } else {
                    console.log('ModelResourceProviderTap: No part data found for', partName, 'Available parts:', example.parts_model_files ? Object.keys(example.parts_model_files) : 'none');
                    // Fallback to main if part not found
                    currentData = example;
                }
            } else {
                console.log('ModelResourceProviderTap: Main selected (partName:', partName, '), using main example');
                currentData = example;
            }
            
            const result = {
                mainExample: example,
                currentData,
                sourceGithubUrl: githubUrl,
                sourceLineNumber: lineNumber
            };
            
            console.log('ModelResourceProviderTap: Returning result:', {
                hasMainExample: !!result.mainExample,
                hasCurrentData: !!result.currentData,
                currentDataIsMain: result.currentData === result.mainExample,
                currentDataStl: result.currentData?.stl_file,
                mainStl: result.mainExample?.stl_file,
                sourceGithubUrl: result.sourceGithubUrl,
                sourceLineNumber: result.sourceLineNumber
            });
            return result;
        },
        mapResult: (params, result: any) => {
            const updates = new Map<Grip<any>, any>();
            
            if (!result) return updates;
            
            const { mainExample, currentData } = result;
            const partName = params.getDestParam(SELECTED_PART_NAME);

            // Debug logging
            console.log('ModelResourceProviderTap mapResult called with:', {
                partName,
                partNameType: typeof partName,
                resultCurrentDataIsMain: currentData === mainExample,
                currentDataStl: currentData?.stl_file,
                mainStl: mainExample?.stl_file,
                scad_file: currentData?.scad_file,
                graph_svg_file: mainExample?.graph_svg_file,
                error_file_name: mainExample?.error_file_name
            });

            // Current data is either the selected part or the main example
            updates.set(CURRENT_MODEL_DATA, currentData);
            
            // Convert parts_model_files to array with keys preserved
            const partsArray = mainExample?.parts_model_files 
                ? Object.entries(mainExample.parts_model_files).map(([key, value]: [string, any]) => ({
                    ...value,
                    partKey: key  // Add the key to the part object
                }))
                : [];
            updates.set(CURRENT_MODEL_PARTS, partsArray);
            updates.set(CURRENT_STL_PATH, currentData?.stl_file);
            updates.set(CURRENT_3MF_PATH, currentData?.f3mf_file);
            updates.set(CURRENT_PNG_PATH, currentData?.png_file);
            updates.set(CURRENT_PATHS_HTML_PATH, currentData?.path_html_file);
            updates.set(CURRENT_SCAD_PATH, currentData?.scad_file);
            
            // Graph and error files are always from the main example
            updates.set(CURRENT_GRAPH_SVG_PATH, mainExample?.graph_svg_file);
            updates.set(CURRENT_STDERR_PATH, mainExample?.error_file_name);
            updates.set(CURRENT_STDERR_LEN, mainExample?.error_file_size);
            const isPartSelected = !!partName && partName !== DEFAULT_PART;
            const openscadErrPath = (isPartSelected ? currentData?.openscad_err_file : mainExample?.openscad_err_file)
                ?? currentData?.openscad_err_file
                ?? mainExample?.openscad_err_file;
            const openscadErrLen = (isPartSelected ? currentData?.openscad_err_file_size : mainExample?.openscad_err_file_size)
                ?? currentData?.openscad_err_file_size
                ?? mainExample?.openscad_err_file_size;
            updates.set(CURRENT_OPENSCAD_STDERR_PATH, openscadErrPath);
            updates.set(CURRENT_OPENSCAD_STDERR_LEN, openscadErrLen);
            updates.set(CURRENT_SOURCE_GITHUB_URL, result.sourceGithubUrl);
            updates.set(CURRENT_SOURCE_LINE_NUMBER, result.sourceLineNumber);
            
            return updates;
        }
    });
}

// Tap 5: Load code text for CURRENT_SCAD_PATH as destination param (optimized decode)
export function createCodeTextLoaderTap(): Tap {
    return createAsyncValueTap<string | undefined>({
        provides: CURRENT_CODE_TEXT,
        destinationParamGrips: [CURRENT_SCAD_PATH],
        cacheTtlMs: 5 * 60 * 1000,
        requestKeyOf: (params) => {
            const path = params.getDestParam(CURRENT_SCAD_PATH);
            return path || undefined;
        },
        fetcher: async (params, signal) => {
            const path = params.getDestParam(CURRENT_SCAD_PATH);
            if (!path) return undefined;
            const res = await fetch(`${path}`, { signal });
            if (!res.ok) throw new Error(`Failed to fetch ${path}`);
            // Faster and explicit decode for large files
            const buf = await res.arrayBuffer();
            return new TextDecoder('utf-8').decode(buf, { stream: true });
        },
    });
}

// Tap 6: Load Python source code based on status.json source_repo + shape line_number
export function createSourceCodeLoaderTap(): Tap {
    return createAsyncValueTap<string | undefined>({
        provides: CURRENT_SOURCE_CODE_TEXT,
        destinationParamGrips: [CURRENT_SOURCE_RAW_URL],
        cacheTtlMs: 5 * 60 * 1000,
        requestKeyOf: (params) => {
            const spec = params.getDestParam(CURRENT_SOURCE_RAW_URL);
            console.log('SourceCodeLoaderTap requestKeyOf', { spec });
            return spec || undefined;
        },
        fetcher: async (params, signal) => {
            const spec = params.getDestParam(CURRENT_SOURCE_RAW_URL);
            if (!spec) return undefined;
            const isAbsolute = /^https?:\/\//i.test(spec);
            const url = isAbsolute ? spec : `${spec}`;
            console.log('SourceCodeLoaderTap fetcher: fetching', { spec, isAbsolute, url });
            try {
                const res = await fetch(url, { signal });
                console.log('SourceCodeLoaderTap fetcher: response', { ok: res.ok, status: res.status });
                if (!res.ok) return undefined;
                const buf = await res.arrayBuffer();
                const text = new TextDecoder('utf-8').decode(buf, { stream: true });
                console.log('SourceCodeLoaderTap fetcher: loaded bytes', { length: text?.length });
                return text;
            } catch (e) {
                console.warn('SourceCodeLoaderTap fetcher: error during fetch', e);
                return undefined;
            }
        }
    });
}

// --- Paths (interactive SVG) ---

// Resolve .paths.html (Phase 1) and optional .paths.json (Phase 2)
export function createPathsPathResolverTap(): Tap {
    type Outs = { pathsJson: typeof CURRENT_PATHS_JSON_PATH };
    type Dest = { png: typeof CURRENT_PNG_PATH; scad: typeof CURRENT_SCAD_PATH };
    return createFunctionTap<Outs, any, Dest>({
        provides: [CURRENT_PATHS_JSON_PATH],
        destinationParamGrips: [CURRENT_PNG_PATH, CURRENT_SCAD_PATH],
        compute: ({ getDestParam }) => {
            const updates = new Map<Grip<any>, any>();
            const pngPath = getDestParam(CURRENT_PNG_PATH) as string | undefined;

            // Heuristics: assume .paths.html is alongside PNG with suffix replacement
            // example: foo_default_example.png -> foo_default_example.paths.html
            // const derive = (p?: string) => p?.replace(/\.png$/i, '.paths.html');
            // const htmlFromPng = derive(pngPath);
            // if (htmlFromPng) updates.set(CURRENT_PATHS_HTML_PATH, htmlFromPng);

            // Placeholder for phase 2 JSON path (same base with .paths.json)
            const jsonFromPng = pngPath?.replace(/\.png$/i, '.paths.json');
            if (jsonFromPng) updates.set(CURRENT_PATHS_JSON_PATH, jsonFromPng);

            return updates;
        }
    });
}

// Load and normalize paths document; prefer JSON, fallback to HTML parsing
export function createPathsDocumentLoaderTap(): Tap {
    return createAsyncMultiTap<{ view: typeof PATHS_VIEW_DATA }, any>({
        provides: [PATHS_VIEW_DATA],
        homeParamGrips: [RAW_STATUS_JSON],
        destinationParamGrips: [
            CURRENT_PATHS_JSON_PATH,
            CURRENT_PATHS_HTML_PATH
        ],
        cacheTtlMs: 5 * 60 * 1000,
        requestKeyOf: (params) => {
            const html = params.getDestParam(CURRENT_PATHS_HTML_PATH) as string | undefined;
            const key = html;
            
            return key || undefined;
        },
        fetcher: async (params, signal) => {
            const jsonPath = params.getDestParam(CURRENT_PATHS_JSON_PATH) as string | undefined;
            const htmlPath = params.getDestParam(CURRENT_PATHS_HTML_PATH) as string | undefined;
            // Try JSON first
            if (jsonPath) {
                try {
                    const url = `${jsonPath}`;
                    const res = await fetch(url, { signal });
                    if (res.ok) {
                        const doc = await res.json();
                        return { kind: 'json', doc };
                    }
                } catch {}
            }

            if (htmlPath) {
                try {
                    const url = `/${htmlPath}`;
                    const res = await fetch(url, { signal });
                    if (!res.ok) return null;
                    const html = await res.text();
                    // Extract inline objects image_metadata and segment_metadata via simple regex
                    const imgMatch = html.match(/let\s+image_metadata\s*=\s*(\{[\s\S]*?\});/);
                    const segMatch = html.match(/let\s+segment_metadata\s*=\s*(\{[\s\S]*?\});/);
                    const transformMatch = html.match(/<g\s+transform=\"matrix\(([^\)]*)\)\"/);
                    const viewBoxMatch = html.match(/<svg\s+[^>]*width=\"([0-9\.]+)\"\s+height=\"([0-9\.]+)\"/);

                    const imageMeta = imgMatch ? JSON.parse(imgMatch[1]) : undefined;
                    const segmentMeta = segMatch ? JSON.parse(segMatch[1]) : undefined;
                    const width = viewBoxMatch ? parseFloat(viewBoxMatch[1]) : undefined;
                    const height = viewBoxMatch ? parseFloat(viewBoxMatch[2]) : undefined;
                    const matrix = transformMatch ? transformMatch[1].split(',').map((n: string) => parseFloat(n.trim())) : undefined;

                    if (!imageMeta || !segmentMeta) return null;

                    // Normalize into a minimal structure the viewer can use immediately
                    const view = { width, height, matrix, imageMeta, segmentMeta, htmlPath };
                    return { kind: 'html', doc: view } as any;
                } catch {}
            }
            return null;
        },
        mapResult: (_params, result: any) => {
            const updates = new Map<Grip<any>, any>();
            if (!result) return updates;
            // For now, pass-through the normalized minimal doc
            updates.set(PATHS_VIEW_DATA, result.doc);
            return updates;
        }
    });
}

// Atom taps for paths UI state
export const PathsSelectedPathIdTap = createAtomValueTap(PATHS_SELECTED_PATH_ID, { handleGrip: PATHS_SELECTED_PATH_ID_TAP });
export const PathsSelectedSegmentIdsTap = createAtomValueTap(PATHS_SELECTED_SEGMENT_IDS, { handleGrip: PATHS_SELECTED_SEGMENT_IDS_TAP });
export const PathsHoverSegmentIdTap = createAtomValueTap(PATHS_HOVER_SEGMENT_ID, { handleGrip: PATHS_HOVER_SEGMENT_ID_TAP });
export const PathsShowConstructionTap = createAtomValueTap(PATHS_SHOW_CONSTRUCTION, { initial: true, handleGrip: PATHS_SHOW_CONSTRUCTION_TAP });
export const PathsViewBoxTap = createAtomValueTap(PATHS_VIEWBOX, { handleGrip: PATHS_VIEWBOX_TAP });
export const PathsInspectTap = createAtomValueTap(PATHS_INSPECT, { handleGrip: PATHS_INSPECT_TAP });

// --- Atom Taps for UI State ---

export const ViewModeTap = createAtomValueTap(VIEW_MODE, { handleGrip: VIEW_MODE_TAP });
export const SelectedModuleNameTap = createAtomValueTap(SELECTED_MODULE_NAME, { handleGrip: SELECTED_MODULE_NAME_TAP });
export const SelectedShapeNameTap = createAtomValueTap(SELECTED_SHAPE_NAME, { handleGrip: SELECTED_SHAPE_NAME_TAP });
export const SelectedExampleNameTap = createAtomValueTap(SELECTED_EXAMPLE_NAME, { handleGrip: SELECTED_EXAMPLE_NAME_TAP });
export const SelectedPartNameTap = createAtomValueTap(SELECTED_PART_NAME, { initial: DEFAULT_PART, handleGrip: SELECTED_PART_NAME_TAP });
export const ActiveTabTap = createAtomValueTap(ACTIVE_TAB, { handleGrip: ACTIVE_TAB_TAP });
export const ModuleFilterStringTap = createAtomValueTap(MODULE_FILTER_STRING, { handleGrip: MODULE_FILTER_STRING_TAP });
export const ModuleFilterErrorsOnlyTap = createAtomValueTap(MODULE_FILTER_ERRORS_ONLY, { handleGrip: MODULE_FILTER_ERRORS_ONLY_TAP });
export const ShowSplashTap = createAtomValueTap(SHOW_SPLASH, { initial: false, handleGrip: SHOW_SPLASH_TAP });
export const ShowSplashAutoTap = createAtomValueTap(SHOW_SPLASH_AUTO, { initial: true, handleGrip: SHOW_SPLASH_AUTO_TAP });
export const ModulesPanelCollapsedTap = createAtomValueTap(MODULES_PANEL_COLLAPSED, { initial: false, handleGrip: MODULES_PANEL_COLLAPSED_TAP });
