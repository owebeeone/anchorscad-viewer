import { useGrip, useGripSetter } from '@owebeeone/grip-react';
import { useEffect, useRef, useState } from 'react';
import {
    ALL_MODULES_LIST,
    FILTERED_MODULES_LIST,
    MODULE_FILTER_STRING_TAP,
    MODULE_FILTER_STRING,
    MODELS_IN_SELECTED_MODULE_LIST,
    SELECTED_MODULE_NAME,
    SELECTED_MODULE_NAME_TAP,
    SELECTED_SHAPE_NAME_TAP,
    SELECTED_EXAMPLE_NAME_TAP,
    SELECTED_PART_NAME_TAP,
    MODULE_FILTER_ERRORS_ONLY,
    MODULE_FILTER_ERRORS_ONLY_TAP,
    DEFAULT_PART,
    MODULES_PANEL_COLLAPSED_TAP,
} from '../grips';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import 'swiper/css';

const ModuleList = () => {
    const filteredModules = useGrip(FILTERED_MODULES_LIST);
    const allModules = useGrip(ALL_MODULES_LIST);
    const modules = filteredModules ?? allModules;
    const models = useGrip(MODELS_IN_SELECTED_MODULE_LIST);
    const selectedModule = useGrip(SELECTED_MODULE_NAME);
    const setModule = useGripSetter(SELECTED_MODULE_NAME_TAP);
    const setShape = useGripSetter(SELECTED_SHAPE_NAME_TAP);
    const setExample = useGripSetter(SELECTED_EXAMPLE_NAME_TAP);
    const setPart = useGripSetter(SELECTED_PART_NAME_TAP);
    const setFilter = useGripSetter(MODULE_FILTER_STRING_TAP);
    const errorsOnly = useGrip(MODULE_FILTER_ERRORS_ONLY);
    const setErrorsOnly = useGripSetter(MODULE_FILTER_ERRORS_ONLY_TAP);
    const filterValue = useGrip(MODULE_FILTER_STRING);
    const listScrollRef = useRef<HTMLDivElement | null>(null);
    
    // Persist and restore scroll position of modules list (must run every render path)
    useEffect(() => {
        const key = 'modules:list:scrollTop';
        const el = listScrollRef.current;
        if (!el) return;
        const saved = sessionStorage.getItem(key);
        if (saved) {
            requestAnimationFrame(() => {
                el.scrollTop = parseInt(saved, 10) || 0;
            });
        }
        const onScroll = () => {
            sessionStorage.setItem(key, String(el.scrollTop));
        };
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => el.removeEventListener('scroll', onScroll as any);
    }, [modules]);

    const prevModuleRef = useRef<string | undefined>();
    
    // Auto-select the last model when module changes and models are available
    useEffect(() => {
        if (selectedModule && selectedModule !== prevModuleRef.current && models && models.length > 0) {
            const lastModel = models[models.length - 1];
            setShape(lastModel.class_name);
            setExample(lastModel.example_name);
            setPart(DEFAULT_PART);
        }
        prevModuleRef.current = selectedModule;
    }, [selectedModule, models, setShape, setExample, setPart]);

    // Always run hooks above; render a loading state conditionally below

    const handleSelect = (moduleName: string) => {
        setModule(moduleName);
        // Reset downstream selections
        setShape(undefined);
        setExample(undefined);
        setPart(DEFAULT_PART);
    }

    const formatName = (name: string) => {
        const parts = name.split('.');
        const tail = parts.slice(-2).join('.');
        if (tail.length <= 30) return tail;
        return '…' + tail.slice(-29);
    };

    return (
        <div ref={listScrollRef} className="h-full overflow-y-auto bg-gray-800/50">
            <div className="sticky top-0 bg-gray-800/80 backdrop-blur-sm p-2 space-y-2 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <h2 className="text-md font-semibold">Modules</h2>
                    <CollapseButton />
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Filter modules (space-separated keywords)"
                        className="w-full pr-7 px-2 py-1 text-sm rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterValue}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                    {filterValue && filterValue.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setFilter("")}
                            className="absolute inset-y-0 right-1 my-auto h-6 w-6 flex items-center justify-center rounded hover:bg-gray-600 text-gray-300 hover:text-white"
                            aria-label="Clear filter"
                            title="Clear filter"
                        >
                            ×
                        </button>
                    )}
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-blue-500" checked={!!errorsOnly} onChange={(e) => setErrorsOnly(e.target.checked)} />
                    Show modules with errors only
                </label>
            </div>
            {modules ? (
                <ul className="divide-y divide-gray-800">
                    {modules.map((module: any) => (
                        <li key={module.module_name}>
                            <button
                                onClick={() => handleSelect(module.module_name)}
                                className={`w-full text-left p-2 flex items-center gap-2 hover:bg-gray-700 ${selectedModule === module.module_name ? 'bg-blue-600/30' : ''}`}
                                title={module.module_name}
                            >
                                <img
                                    src={module.preview_png || `https://placehold.co/40x40/1f2937/d1d5db?text=\u25A1`}
                                    alt="preview"
                                    className="w-10 h-10 object-contain rounded border border-gray-700 bg-gray-900"
                                />
                                <span className="text-sm text-gray-200 truncate">{formatName(module.module_name)}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-2 text-gray-500">Loading modules...</div>
            )}
        </div>
    );
};

const ModelCarousel = () => {
    const models = useGrip(MODELS_IN_SELECTED_MODULE_LIST);
    const setShape = useGripSetter(SELECTED_SHAPE_NAME_TAP);
    const setExample = useGripSetter(SELECTED_EXAMPLE_NAME_TAP);
    const setPart = useGripSetter(SELECTED_PART_NAME_TAP);
    const gridRef = useRef<HTMLDivElement | null>(null);
    const [gridCols, setGridCols] = useState<number>(2);

    if (!models) return null;

    const handleSelect = (model: any) => {
        setShape(model.class_name);
        setExample(model.example_name);
        setPart(DEFAULT_PART); // Reset part selection
    }

    // Compute responsive columns: shrink cards until ~110px min, cap at ≈ (models/2)+2
    useEffect(() => {
        const el = gridRef.current;
        if (!el) return;
        const minCard = 110; // px
        const compute = () => {
            const half = Math.ceil(models.length / 2);
            const maxCols = Math.max(1, Math.min(models.length, half + 2));
            const width = el.clientWidth || 0;
            const candidate = Math.max(1, Math.floor(width / (minCard + 8))); // account for gap
            setGridCols(Math.min(maxCols, candidate));
        };
        compute();
        const ro = new ResizeObserver(compute);
        ro.observe(el);
        return () => ro.disconnect();
    }, [models.length]);

    return (
        <div className="h-full flex flex-col bg-gray-800/50">
            <h2 className="text-md font-semibold p-2 sticky top-0 bg-gray-800/80 backdrop-blur-sm">Models</h2>
            <div className="flex-grow p-2 overflow-y-auto">
                <div ref={gridRef} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(110px, 1fr))` }}>
                    {models.map((model: any, index: number) => (
                        <div key={`${model.class_name}-${model.example_name}-${index}`}
                             onClick={() => handleSelect(model)}
                             className="border border-gray-700 rounded-lg p-1 cursor-pointer hover:border-blue-500 hover:bg-gray-700/50 transition-colors flex flex-col items-center text-center">
                            <img src={model.png_file || `https://placehold.co/100x100/1f2937/d1d5db?text=No+Preview`} 
                                 alt={`${model.class_name} - ${model.example_name}`} 
                                 className="w-full aspect-[4/3] object-contain mb-1"/>
                            <span className="text-xs text-gray-400">{model.class_name}</span>
                            <span className="text-xs font-bold">{model.example_name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default function ModuleBrowser() {
    return (
        <PanelGroup direction="vertical">
            <Panel defaultSize={50} minSize={20}>
                <ModuleList />
            </Panel>
            <PanelResizeHandle className="h-1 bg-gray-800 hover:bg-blue-600 transition-colors" />
            <Panel defaultSize={50} minSize={20}>
                <ModelCarousel />
            </Panel>
        </PanelGroup>
    );
}

function CollapseButton() {
    const setCollapsed = useGripSetter(MODULES_PANEL_COLLAPSED_TAP);
    return (
        <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="Collapse modules panel"
            className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-200"
        >
            Collapse
        </button>
    );
}
