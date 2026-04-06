import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import { FiMenu } from "react-icons/fi";

export default function SortableService({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames("relative flex items-center group/sortable-svc", isDragging && "opacity-50 z-50")}
    >
      <button
        type="button"
        className="flex-shrink-0 flex items-center justify-center w-5 h-full cursor-grab active:cursor-grabbing opacity-0 group-hover/sortable-svc:opacity-60 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <FiMenu className="w-3 h-3 text-theme-500" />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
