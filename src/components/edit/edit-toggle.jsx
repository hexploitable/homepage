import classNames from "classnames";
import { useContext } from "react";
import { FiCheck, FiEdit2, FiRotateCcw } from "react-icons/fi";
import { EditModeContext, saveGridLayouts } from "utils/contexts/edit-mode";
import { SettingsContext } from "utils/contexts/settings";

export default function EditToggle() {
  const { settings } = useContext(SettingsContext);
  const { editMode, setEditMode, setGridLayouts } = useContext(EditModeContext);

  if (!settings.enableEditMode) return null;

  const handleReset = () => {
    setGridLayouts(null);
    saveGridLayouts(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      {editMode && (
        <button
          type="button"
          onClick={handleReset}
          title="Reset layout"
          className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all bg-red-500 hover:bg-red-600 text-white"
        >
          <FiRotateCcw className="w-4 h-4" />
        </button>
      )}
      <button
        type="button"
        onClick={() => setEditMode((prev) => !prev)}
        title={editMode ? "Exit edit mode" : "Edit layout"}
        className={classNames(
          "flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all",
          editMode
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "bg-theme-700 hover:bg-theme-600 dark:bg-theme-300 dark:hover:bg-theme-400 text-white dark:text-theme-900",
        )}
      >
        {editMode ? <FiCheck className="w-5 h-5" /> : <FiEdit2 className="w-5 h-5" />}
      </button>
    </div>
  );
}
