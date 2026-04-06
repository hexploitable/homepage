import { createContext, useMemo, useState } from "react";

export const EditModeContext = createContext();

const GRID_LAYOUTS_KEY = "homepage-grid-layouts";

function loadGridLayouts() {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(GRID_LAYOUTS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function saveGridLayouts(layouts) {
  try {
    localStorage.setItem(GRID_LAYOUTS_KEY, JSON.stringify(layouts));
  } catch {
    // ignore storage errors
  }
}

export function EditModeProvider({ children }) {
  const [editMode, setEditMode] = useState(false);
  const [groupOrder, setGroupOrder] = useState(null);
  const [gridLayouts, setGridLayouts] = useState(() => loadGridLayouts());

  const value = useMemo(
    () => ({ editMode, setEditMode, groupOrder, setGroupOrder, gridLayouts, setGridLayouts }),
    [editMode, groupOrder, gridLayouts],
  );

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
}
