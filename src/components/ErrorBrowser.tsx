import { useGrip, useGripSetter } from '@owebeeone/grip-react';
import {
    MODELS_WITH_ERRORS_LIST,
    SELECTED_MODULE_NAME_TAP,
    SELECTED_SHAPE_NAME_TAP,
    SELECTED_EXAMPLE_NAME_TAP,
    SELECTED_PART_NAME_TAP,
    DEFAULT_PART,
} from '../grips';

export default function ErrorBrowser() {
    const modelsWithErrors = useGrip(MODELS_WITH_ERRORS_LIST);
    const setModule = useGripSetter(SELECTED_MODULE_NAME_TAP);
    const setShape = useGripSetter(SELECTED_SHAPE_NAME_TAP);
    const setExample = useGripSetter(SELECTED_EXAMPLE_NAME_TAP);
    const setPart = useGripSetter(SELECTED_PART_NAME_TAP);

    if (!modelsWithErrors) return <div className="p-2 text-gray-500">Loading errors...</div>;
    
    const handleSelect = (model: any) => {
        setModule(model.module_name);
        setShape(model.class_name);
        setExample(model.example_name);
        setPart(DEFAULT_PART);
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-800/50">
            <h2 className="text-md font-semibold p-2 sticky top-0 bg-gray-800/80 backdrop-blur-sm">Models with Errors</h2>
            <ul>
                {modelsWithErrors.map((model: any, i: number) => (
                    <li key={`${model.module_name}-${model.class_name}-${model.example_name}-${i}`}>
                        <button
                            onClick={() => handleSelect(model)}
                            className="w-full text-left p-2 text-sm hover:bg-gray-700"
                        >
                           <div className="font-bold truncate">{model.module_name}</div>
                           <div className="text-xs text-gray-400 truncate">{model.class_name}::{model.example_name}</div>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
