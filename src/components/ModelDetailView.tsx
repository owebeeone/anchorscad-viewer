// no-op
import { useGrip, useGripSetter } from "@owebeeone/grip-react";
import {
  ACTIVE_TAB,
  ACTIVE_TAB_TAP,
  CURRENT_STL_PATH,
  CURRENT_PNG_PATH,
  CURRENT_SCAD_PATH,
  CURRENT_GRAPH_SVG_PATH,
  CURRENT_STDERR_PATH,
  CURRENT_SOURCE_GITHUB_URL,
  CURRENT_3MF_PATH,
  CURRENT_STDERR_LEN,
  CURRENT_OPENSCAD_STDERR_PATH,
  CURRENT_OPENSCAD_STDERR_LEN,
  PATHS_VIEW_DATA,
} from "../grips";
import ThreeDViewer from "./a_ui/ThreeDViewer";
import PngViewer from "./a_ui/PngViewer";
import SvgViewer from "./a_ui/SvgViewer";
import CodeViewer from "./a_ui/CodeViewer";
import SourceCodeViewer from "./a_ui/SourceCodeViewer";
import ErrorLogViewer from "./a_ui/ErrorLogViewer";
import ThreeMFViewer from "./a_ui/ThreeMFViewer";
import SvgPathsViewer from "./a_ui/SvgPathsViewer";
import SlidingTabs from "./a_ui/SlidingTabs";
import PartSelector from "./PartSelector";

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
  //const selectedPart = useGrip(SELECTED_PART_NAME);
  const activeTab = useGrip(ACTIVE_TAB);
  const setActiveTab = useGripSetter(ACTIVE_TAB_TAP);
  const openscadErrPath = useGrip(CURRENT_OPENSCAD_STDERR_PATH);
  const openscadErrLen = useGrip(CURRENT_OPENSCAD_STDERR_LEN);
  const pathsDoc = useGrip(PATHS_VIEW_DATA);

  // Debug logging
//   console.log("ModelDetailView paths:", {
//     selectedPart,
//     selectedPartType: typeof selectedPart,
//     isDefaultPart: selectedPart === DEFAULT_PART,
//     DEFAULT_PART,
//     stlPath,
//     scadPath,
//     svgPath,
//     stderrPath,
//   });

  if (!stlPath && !scadPath && !svgPath && !stderrPath) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a model to view details
      </div>
    );
  }

  const tabs = [
    { name: "PNG" as const, tab_title: "PNG", path: pngPath },
    { name: "STL" as const, tab_title: "3D (stl)", path: stlPath },
    { name: "3MF" as const, tab_title: "3D (3mf)", path: threeMfPath },
    { name: "Graph" as const, tab_title: "Graph", path: svgPath },
    { name: "Paths" as const, tab_title: "Paths", path: pathsDoc ? "available" : undefined },
    { name: "Code" as const, tab_title: "Code", path: sourceLink },
    { name: "Scad" as const, tab_title: "Scad Code", path: scadPath },
    { name: "Error" as const, tab_title: "Error", path: stderrLen ? stderrPath : undefined },
    {
      name: "OpenSCAD Error" as const,
      tab_title: "OpenSCAD Error",
      path: openscadErrLen ? openscadErrPath : undefined,
    },
  ].filter((tab) => tab.path);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "PNG":
        return pngPath ? (
          <PngViewer pngPath={pngPath} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading image...
          </div>
        );
      case "STL":
        return stlPath ? (
          <ThreeDViewer stlPath={stlPath} pngPath={pngPath} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading 3D model...
          </div>
        );
      case "3MF":
        return threeMfPath ? (
          <ThreeMFViewer threeMfPath={threeMfPath} pngPath={pngPath} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading 3D model...
          </div>
        );
      case "Graph":
        return svgPath ? (
          <SvgViewer svgPath={svgPath} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading graph...
          </div>
        );
      case "Paths":
        return <SvgPathsViewer />;
      case "Code":
        return sourceLink ? (
          <SourceCodeViewer />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading code...
          </div>
        );
      case "Scad":
        return scadPath ? (
          <CodeViewer />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading code...
          </div>
        );
      case "Error":
        return stderrPath ? (
          <ErrorLogViewer stderrPath={stderrPath} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No error log available
          </div>
        );
      case "OpenSCAD Error":
        return openscadErrPath ? (
          <ErrorLogViewer stderrPath={openscadErrPath} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No OpenSCAD error log
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <PartSelector />
      <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800">
        <SlidingTabs
          tabs={tabs}
          activeTab={activeTab || "PNG"}
          setActiveTab={setActiveTab}
        />
      </div>
      <div className="flex-grow min-h-0 relative">{renderActiveTab()}</div>
    </div>
  );
}
