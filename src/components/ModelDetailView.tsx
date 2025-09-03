import { useEffect } from 'react';
import { useGrip, useGripSetter } from '@owebeeone/grip-react';
import {
    CURRENT_MODEL_PARTS,
    SELECTED_PART_NAME,
    SELECTED_PART_NAME_TAP,
    SELECTED_MODULE_NAME,
    ACTIVE_TAB,
    ACTIVE_TAB_TAP,
    CURRENT_STL_PATH,
    CURRENT_PNG_PATH,
    CURRENT_SCAD_PATH,
    CURRENT_GRAPH_SVG_PATH,
    CURRENT_STDERR_PATH,
    DEFAULT_PART,
    CURRENT_SOURCE_GITHUB_URL,
    CURRENT_3MF_PATH,
    CURRENT_STDERR_LEN
} from '../grips';
import ThreeDViewer from './a_ui/ThreeDViewer';
import PngViewer from './a_ui/PngViewer';
import SvgViewer from './a_ui/SvgViewer';
import CodeViewer from './a_ui/CodeViewer';
import SourceCodeViewer from './a_ui/SourceCodeViewer';
import ErrorLogViewer from './a_ui/ErrorLogViewer';
import ThreeMFViewer from './a_ui/ThreeMFViewer';

const PartSelector = () => {
    const parts = useGrip(CURRENT_MODEL_PARTS);
    const selectedPart = useGrip(SELECTED_PART_NAME);
    console.log('PartSelector selectedPart:', selectedPart);
    const setPart = useGripSetter(SELECTED_PART_NAME_TAP);

    if (!parts || parts.length === 0) return null;

    // Debug log to see the structure
    console.log('PartSelector parts:', parts, 'selectedPart:', selectedPart);

    return (
        <div className="flex-shrink-0 p-2 flex items-center gap-2 overflow-x-auto bg-gray-800 border-b border-gray-700">
             <button
                onClick={() => {
                    console.log('Setting part to DEFAULT_PART:', DEFAULT_PART);
                    setPart(DEFAULT_PART);
                }}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${selectedPart === DEFAULT_PART ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
                Main
            </button>
            {parts.map((part: any) => (
                <button
                    key={part.partKey}
                    onClick={() => setPart(part.partKey)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors truncate ${selectedPart === part.partKey ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    {part.part_name}
                </button>
            ))}
        </div>
    );
};

// Local TabName type no longer needed

export default function ModelDetailView() {
    const stlPath = useGrip(CURRENT_STL_PATH);
    const threeMfPath = useGrip(CURRENT_3MF_PATH);
    const pngPath = useGrip(CURRENT_PNG_PATH);
    const scadPath = useGrip(CURRENT_SCAD_PATH);
    const svgPath = useGrip(CURRENT_GRAPH_SVG_PATH);
    const stderrPath = useGrip(CURRENT_STDERR_PATH);
    const stderrLen = useGrip(CURRENT_STDERR_LEN);
    const sourceLink = useGrip(CURRENT_SOURCE_GITHUB_URL);
    const selectedPart = useGrip(SELECTED_PART_NAME);
    const activeTab = useGrip(ACTIVE_TAB);
    const setActiveTab = useGripSetter(ACTIVE_TAB_TAP);

    // Debug logging
    console.log('ModelDetailView paths:', {
        selectedPart,
        selectedPartType: typeof selectedPart,
        isDefaultPart: selectedPart === DEFAULT_PART,
        DEFAULT_PART,
        stlPath,
        scadPath,
        svgPath,
        stderrPath
    });
    
    // Reset to PNG tab when module changes (when selectedModule changes)
    const selectedModule = useGrip(SELECTED_MODULE_NAME);
    useEffect(() => {
        setActiveTab('PNG');
    }, [selectedModule, setActiveTab]);
    
    if (!stlPath && !scadPath && !svgPath && !stderrPath) {
        return <div className="flex items-center justify-center h-full text-gray-500">Select a model to view details</div>;
    }

    const tabs = [
        { name: 'PNG' as const, tab_title: 'PNG', path: pngPath },
        { name: 'STL' as const, tab_title: '3D (stl)', path: stlPath },
        { name: '3MF' as const, tab_title: '3D (3mf)', path: threeMfPath },
        { name: 'Graph' as const, tab_title: 'Graph', path: svgPath },
        { name: 'Code' as const, tab_title: 'Code', path: sourceLink },
        { name: 'Scad' as const, tab_title: 'Scad Code', path: scadPath },
        { name: 'Error' as const, tab_title: 'Error', path: stderrLen ? stderrPath : undefined },
    ].filter(tab => tab.path);

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'PNG': return pngPath ? <PngViewer pngPath={pngPath} /> : <div className="flex items-center justify-center h-full text-gray-500">Loading image...</div>;
            case 'STL': return stlPath ? <ThreeDViewer stlPath={stlPath} pngPath={pngPath} /> : <div className="flex items-center justify-center h-full text-gray-500">Loading 3D model...</div>;
            case '3MF': return threeMfPath ? <ThreeMFViewer threeMfPath={threeMfPath} pngPath={pngPath} /> : <div className="flex items-center justify-center h-full text-gray-500">Loading 3D model...</div>;
            case 'Graph': return svgPath ? <SvgViewer svgPath={svgPath} /> : <div className="flex items-center justify-center h-full text-gray-500">Loading graph...</div>;
            case 'Code': return sourceLink ? <SourceCodeViewer /> : <div className="flex items-center justify-center h-full text-gray-500">Loading code...</div>;
            case 'Scad': return scadPath ? <CodeViewer /> : <div className="flex items-center justify-center h-full text-gray-500">Loading code...</div>;
            case 'Error': return stderrPath ? <ErrorLogViewer stderrPath={stderrPath} /> : <div className="flex items-center justify-center h-full text-gray-500">No error log available</div>;
            default: return null;
        }
    }

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <PartSelector />
            <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800">
                <nav className="flex space-x-2 px-2">
                    {tabs.map(tab => (
                        <button 
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab.name ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab.tab_title}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-grow min-h-0 relative">
                {renderActiveTab()}
            </div>
        </div>
    );
}
