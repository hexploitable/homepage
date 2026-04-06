import { useState } from "react";
import { FiX } from "react-icons/fi";

export const DIVIDER_PREFIX = "__divider_";

export function isDivider(id) {
  return id?.startsWith(DIVIDER_PREFIX);
}

export default function SectionDivider({ id, label, editMode, onLabelChange, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(label || "");

  const handleBlur = () => {
    setEditing(false);
    if (onLabelChange) onLabelChange(id, text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  return (
    <div className="flex items-center w-full h-full px-2">
      <div className="flex-1 flex items-center gap-3">
        <div className="flex-1 h-px bg-theme-500/30" />
        {editMode && editing ? (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Section title..."
            className="bg-transparent text-center text-xs font-semibold uppercase tracking-widest text-theme-500 dark:text-theme-400 border-b border-theme-500/30 outline-none px-2 py-0.5"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => editMode && setEditing(true)}
            className="text-xs font-semibold uppercase tracking-widest text-theme-500 dark:text-theme-400 hover:text-theme-700 dark:hover:text-theme-200 transition-colors cursor-pointer min-w-[60px] text-center"
          >
            {label || (editMode ? "Click to name" : "")}
          </button>
        )}
        <div className="flex-1 h-px bg-theme-500/30" />
      </div>
      {editMode && onRemove && (
        <button
          type="button"
          onClick={() => onRemove(id)}
          title="Remove section break"
          className="ml-2 text-red-400 hover:text-red-600 transition-colors"
        >
          <FiX className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
