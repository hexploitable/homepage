import classNames from "classnames";
import { useContext } from "react";
import { FiCheck, FiEdit2, FiMinus, FiRotateCcw } from "react-icons/fi";
import { DIVIDER_PREFIX } from "components/edit/section-divider";
import { EditModeContext, saveDividers, saveGridLayouts } from "utils/contexts/edit-mode";
import { SettingsContext } from "utils/contexts/settings";

const COLS = { lg: 12, md: 8, sm: 4, xs: 2 };

function addDividerToLayouts(layouts, id) {
  if (!layouts) return null;
  const updated = {};
  Object.keys(layouts).forEach((bp) => {
    const items = layouts[bp] || [];
    const maxY = items.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    const cols = COLS[bp] || 12;
    updated[bp] = [...items, { i: id, x: 0, y: maxY, w: cols, h: 1, minW: cols, maxW: cols, minH: 1, maxH: 1 }];
  });
  return updated;
}

export default function EditToggle() {
  const { settings } = useContext(SettingsContext);
  const { editMode, setEditMode, gridLayouts, setGridLayouts, dividers, setDividers } = useContext(EditModeContext);

  if (!settings.enableEditMode) return null;

  const handleReset = () => {
    setGridLayouts(null);
    saveGridLayouts(null);
    setDividers([]);
    saveDividers([]);
  };

  const handleAddDivider = () => {
    const id = `${DIVIDER_PREFIX}${Date.now()}`;
    const newDividers = [...dividers, { id, label: "" }];
    setDividers(newDividers);
    saveDividers(newDividers);

    if (gridLayouts) {
      const newLayouts = addDividerToLayouts(gridLayouts, id);
      setGridLayouts(newLayouts);
      saveGridLayouts(newLayouts);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      {editMode && (
        <>
          <button
            type="button"
            onClick={handleAddDivider}
            title="Add section break"
            className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all bg-theme-700 hover:bg-theme-600 dark:bg-theme-300 dark:hover:bg-theme-400 text-white dark:text-theme-900"
          >
            <FiMinus className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Reset layout"
            className="flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all bg-red-500 hover:bg-red-600 text-white"
          >
            <FiRotateCcw className="w-4 h-4" />
          </button>
        </>
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
