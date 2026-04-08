import classNames from "classnames";
import { DIVIDER_PREFIX } from "components/edit/section-divider";
import { useContext, useMemo } from "react";
import { FiCheck, FiEdit2, FiMinus, FiRotateCcw } from "react-icons/fi";
import { EditModeContext } from "utils/contexts/edit-mode";
import { SettingsContext } from "utils/contexts/settings";
import { TabContext } from "utils/contexts/tab";

const DEFAULT_TAB_KEY = "_default";
const COLS = { lg: 12, md: 8, sm: 4, xs: 2 };

function addDividerToLayouts(tabLayout, id) {
  if (!tabLayout) return null;
  const updated = {};
  Object.keys(tabLayout).forEach((bp) => {
    const items = tabLayout[bp] || [];
    const maxY = items.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    const cols = COLS[bp] || 12;
    updated[bp] = [...items, { i: id, x: 0, y: maxY, w: cols, h: 1, minW: cols, maxW: cols, minH: 1, maxH: 1 }];
  });
  return updated;
}

export default function EditToggle() {
  const { settings } = useContext(SettingsContext);
  const { editMode, setEditMode, gridLayouts, setGridLayouts, dividers, setDividers } = useContext(EditModeContext);
  const { activeTab } = useContext(TabContext);

  const tabs = useMemo(
    () =>
      Object.keys(settings.layout ?? {})
        .map((groupName) => settings.layout[groupName]?.tab?.toString())
        .filter(Boolean),
    [settings.layout],
  );

  const activeTabKey = tabs.length > 0 && activeTab ? activeTab : DEFAULT_TAB_KEY;

  if (!settings.enableEditMode) return null;

  const handleReset = () => {
    setGridLayouts(null);
    setDividers({});
  };

  const handleAddDivider = () => {
    const id = `${DIVIDER_PREFIX}${Date.now()}`;
    const tabDividers = Array.isArray(dividers) ? [] : dividers?.[activeTabKey] || [];
    const newTabDividers = [...tabDividers, { id, label: "" }];
    setDividers((prev) => {
      const base = Array.isArray(prev) ? {} : prev || {};
      return { ...base, [activeTabKey]: newTabDividers };
    });

    if (gridLayouts?.[activeTabKey]) {
      const newTabLayout = addDividerToLayouts(gridLayouts[activeTabKey], id);
      setGridLayouts((prev) => ({ ...prev, [activeTabKey]: newTabLayout }));
    }
  };

  const handleToggleEditMode = async () => {
    if (editMode && gridLayouts) {
      // Exiting edit mode — save grid layouts to yaml
      try {
        await fetch("/api/settings/layout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grid: gridLayouts }),
        });
      } catch {
        // ignore save errors
      }
    }
    setEditMode((prev) => !prev);
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
        onClick={handleToggleEditMode}
        title={editMode ? "Save & exit edit mode" : "Edit layout"}
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
