import { useGrip, useGripSetter } from '@owebeeone/grip-react';
import {
    ALL_MODULES_LIST,
    MODELS_IN_SELECTED_MODULE_LIST,
    SELECTED_MODULE_NAME,
    SELECTED_MODULE_NAME_TAP,
    SELECTED_SHAPE_NAME_TAP,
    SELECTED_EXAMPLE_NAME_TAP,
    SELECTED_PART_NAME_TAP,
    DEFAULT_PART,
} from '../grips';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import 'swiper/css';

const ModuleList = () => {
    const modules = useGrip(ALL_MODULES_LIST);
    const selectedModule = useGrip(SELECTED_MODULE_NAME);
    const setModule = useGripSetter(SELECTED_MODULE_NAME_TAP);
    const setShape = useGripSetter(SELECTED_SHAPE_NAME_TAP);
    const setExample = useGripSetter(SELECTED_EXAMPLE_NAME_TAP);
    const setPart = useGripSetter(SELECTED_PART_NAME_TAP);


    if (!modules) return <div className="p-2 text-gray-500">Loading modules...</div>;

    const handleSelect = (moduleName: string) => {
        setModule(moduleName);
        // Reset downstream selections
        setShape(undefined);
        setExample(undefined);
        setPart(DEFAULT_PART);
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-800/50">
            <h2 className="text-md font-semibold p-2 sticky top-0 bg-gray-800/80 backdrop-blur-sm">Modules</h2>
            <ul>
                {modules.map((module: any) => (
                    <li key={module.module_name}>
                        <button
                            onClick={() => handleSelect(module.module_name)}
                            className={`w-full text-left p-2 text-sm truncate ${selectedModule === module.module_name ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}
                        >
                            {module.module_name}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ModelCarousel = () => {
    const models = useGrip(MODELS_IN_SELECTED_MODULE_LIST);
    const setShape = useGripSetter(SELECTED_SHAPE_NAME_TAP);
    const setExample = useGripSetter(SELECTED_EXAMPLE_NAME_TAP);
    const setPart = useGripSetter(SELECTED_PART_NAME_TAP);

    if (!models) return null;

    const handleSelect = (model: any) => {
        setShape(model.class_name);
        setExample(model.example_name);
        setPart(DEFAULT_PART); // Reset part selection
    }

    return (
        <div className="h-full flex flex-col bg-gray-800/50">
            <h2 className="text-md font-semibold p-2 sticky top-0 bg-gray-800/80 backdrop-blur-sm">Models</h2>
            <div className="flex-grow p-2 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                    {models.map((model: any, index: number) => (
                        <div key={`${model.class_name}-${model.example_name}-${index}`}
                             onClick={() => handleSelect(model)}
                             className="border border-gray-700 rounded-lg p-1 cursor-pointer hover:border-blue-500 hover:bg-gray-700/50 transition-colors flex flex-col items-center text-center">
                            <img src={model.png_file || `https://placehold.co/100x100/1f2937/d1d5db?text=No+Preview`} 
                                 alt={`${model.class_name} - ${model.example_name}`} 
                                 className="w-full h-24 object-contain mb-1"/>
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
