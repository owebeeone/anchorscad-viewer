import { useGrip, useGripSetter } from "@owebeeone/grip-react";
import {
  CURRENT_MODEL_PARTS,
  DEFAULT_PART,
  SELECTED_PART_NAME,
  SELECTED_PART_NAME_TAP,
} from "../grips";
import SlidingTabs from "./a_ui/SlidingTabs";

const PartSelector = () => {
  const parts = useGrip(CURRENT_MODEL_PARTS);
  const selectedPart = useGrip(SELECTED_PART_NAME);
  const setPart = useGripSetter(SELECTED_PART_NAME_TAP);

  if (!parts || parts.length === 0) return null;

  const partTabs = [
    { name: DEFAULT_PART, tab_title: "Main" },
    ...parts.map((part: any) => ({
      name: part.partKey,
      tab_title: part.part_name,
    })),
  ];

  return (
    <SlidingTabs
      tabs={partTabs}
      activeTab={selectedPart || DEFAULT_PART}
      setActiveTab={setPart}
    />
  );
};

export default PartSelector;
