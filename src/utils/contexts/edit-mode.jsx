import { createContext, useMemo, useState } from "react";

export const EditModeContext = createContext();

export function EditModeProvider({ children }) {
  const [editMode, setEditMode] = useState(false);
  const [gridLayouts, setGridLayouts] = useState(null);
  const [dividers, setDividers] = useState([]);

  const value = useMemo(
    () => ({ editMode, setEditMode, gridLayouts, setGridLayouts, dividers, setDividers }),
    [editMode, gridLayouts, dividers],
  );

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
}
