import { createElement, useCallback, useRef, useState } from "react";

export default function EditableText({ value, onSave, editMode, tag = "span", className = "" }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef(null);

  const handleSave = useCallback(() => {
    setEditing(false);
    const trimmed = text.trim();
    console.log("EditableText handleSave:", { trimmed, value, changed: trimmed !== value });
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setText(value);
    }
  }, [text, value, onSave]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.target.blur();
      }
      if (e.key === "Escape") {
        setText(value);
        setEditing(false);
      }
    },
    [value],
  );

  if (!editMode) {
    return createElement(tag, { className }, value);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          e.stopPropagation();
          handleKeyDown(e);
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className={`${className} bg-transparent border-b border-dashed border-theme-500/40 outline-none`}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
      />
    );
  }

  return createElement(
    tag,
    {
      className: `${className} cursor-pointer hover:underline hover:decoration-dashed hover:decoration-theme-500/40`,
      onClick: (e) => {
        e.stopPropagation();
        setEditing(true);
        setText(value);
      },
      title: "Click to edit",
    },
    value,
  );
}
