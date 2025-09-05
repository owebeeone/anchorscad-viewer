interface ViewerControlsProps {
  handleSaveFile: () => void;
  handleSnapshot: () => void;
  saveFileTitle: string;
  snapshotTitle: string;
}

export default function ViewerControls({
  handleSaveFile,
  handleSnapshot,
  saveFileTitle,
  snapshotTitle,
}: ViewerControlsProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-center gap-2 sm:justify-start">
      <button
        onClick={handleSaveFile}
        className="bg-gray-800/80 text-white text-xs px-2 py-1 rounded shadow hover:bg-gray-700"
        title={saveFileTitle}
      >
        Save
      </button>
      <button
        onClick={handleSnapshot}
        className="bg-gray-800/80 text-white text-xs px-2 py-1 rounded shadow hover:bg-gray-700"
        title={snapshotTitle}
      >
        Snapshot
      </button>
    </div>
  );
}
