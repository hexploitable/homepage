import { createContext, useMemo, useState } from "react";

export const EditModeContext = createContext();

const GRID_LAYOUTS_KEY = "homepage-grid-layouts";
const DIVIDERS_KEY = "homepage-grid-dividers";

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

function loadDividers() {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(DIVIDERS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveDividers(dividers) {
  try {
    localStorage.setItem(DIVIDERS_KEY, JSON.stringify(dividers));
  } catch {
    // ignore storage errors
  }
}

export function EditModeProvider({ children }) {
  const [editMode, setEditMode] = useState(false);
  const [groupOrder, setGroupOrder] = useState(null);
  const [gridLayouts, setGridLayouts] = useState(() => loadGridLayouts());
  const [dividers, setDividers] = useState(() => loadDividers());

  const value = useMemo(
    () => ({ editMode, setEditMode, groupOrder, setGroupOrder, gridLayouts, setGridLayouts, dividers, setDividers }),
    [editMode, groupOrder, gridLayouts, dividers],
  );

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
}
