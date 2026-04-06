import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import { FiMenu } from "react-icons/fi";

export default function SortableGroup({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames("relative group/sortable w-full", isDragging && "opacity-50 z-50")}
    >
      <button
        type="button"
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-6 h-10 rounded bg-theme-700/80 dark:bg-theme-300/80 text-white dark:text-theme-900 opacity-0 group-hover/sortable:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <FiMenu className="w-4 h-4" />
      </button>
      <div className="ring-2 ring-transparent group-hover/sortable:ring-theme-500/30 rounded-md transition-all">
        {children}
      </div>
    </div>
  );
}
