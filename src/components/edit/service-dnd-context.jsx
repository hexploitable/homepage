import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useState } from "react";

export function parseCompositeId(compositeId) {
  const sep = compositeId.indexOf("::");
  if (sep === -1) return { groupName: null, serviceName: compositeId };
  return { groupName: compositeId.substring(0, sep), serviceName: compositeId.substring(sep + 2) };
}

export function makeCompositeId(groupName, serviceName) {
  return `${groupName}::${serviceName}`;
}

function findContainerForItem(services, compositeId) {
  const { groupName } = parseCompositeId(compositeId);
  if (groupName) return groupName;

  // Fallback: search all groups
  for (const group of services || []) {
    const found = group.services?.some((s) => makeCompositeId(group.name, s.name) === compositeId);
    if (found) return group.name;
  }
  return null;
}

export default function ServiceDndContext({ services, mutateServices, children }) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const { groupName: sourceGroup, serviceName } = parseCompositeId(active.id);
      const overGroup = findContainerForItem(services, over.id);

      // If over.id is a group container ID (not a composite service ID), use it directly
      const destinationGroup = over.id.includes("::") ? parseCompositeId(over.id).groupName : overGroup || over.id;

      if (!sourceGroup || !destinationGroup || !serviceName) return;

      // Calculate destination index
      const destGroup = services?.find((g) => g.name === destinationGroup);
      let destinationIndex = destGroup?.services?.length || 0;

      if (over.id.includes("::")) {
        const { serviceName: overServiceName } = parseCompositeId(over.id);
        const overIdx = destGroup?.services?.findIndex((s) => s.name === overServiceName);
        if (overIdx !== undefined && overIdx >= 0) {
          destinationIndex = overIdx;
        }
      }

      // Same group reorder
      if (sourceGroup === destinationGroup) {
        const sourceIdx = destGroup?.services?.findIndex((s) => s.name === serviceName);
        if (sourceIdx !== undefined && sourceIdx >= 0 && sourceIdx < destinationIndex) {
          destinationIndex -= 1;
        }
      }

      try {
        const res = await fetch("/api/services/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceGroup, serviceName, destinationGroup, destinationIndex }),
        });

        if (res.ok) {
          mutateServices();
        }
      } catch {
        // Revalidate to restore state on failure
        mutateServices();
      }
    },
    [services, mutateServices],
  );

  const activeService = activeId ? parseCompositeId(activeId) : null;
  const activeServiceData = activeService
    ? services
        ?.find((g) => g.name === activeService.groupName)
        ?.services?.find((s) => s.name === activeService.serviceName)
    : null;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {children}
      <DragOverlay>
        {activeServiceData && (
          <div className="bg-theme-200/70 dark:bg-theme-900/70 rounded-md p-2 shadow-lg text-sm text-theme-700 dark:text-theme-200 backdrop-blur">
            {activeServiceData.name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
