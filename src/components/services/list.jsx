import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import classNames from "classnames";
import { makeCompositeId } from "components/edit/service-dnd-context";
import SortableService from "components/edit/sortable-service";
import Item from "components/services/item";
import { useContext } from "react";
import { EditModeContext } from "utils/contexts/edit-mode";

import { columnMap } from "../../utils/layout/columns";

export default function List({ groupName, services, layout, useEqualHeights, header }) {
  const { editMode } = useContext(EditModeContext);

  const serviceIds = services.map((s) => makeCompositeId(groupName, s.name));
  const { setNodeRef, isOver } = useDroppable({ id: `droppable-${groupName}` });

  const listContent = services.map((service) => {
    const key = [service.container, service.app, service.name].filter((s) => s).join("-");
    const item = (
      <Item
        key={key}
        service={service}
        groupName={groupName}
        useEqualHeights={layout?.useEqualHeights ?? useEqualHeights}
        editMode={editMode}
      />
    );

    if (editMode) {
      return (
        <SortableService key={key} id={makeCompositeId(groupName, service.name)}>
          {item}
        </SortableService>
      );
    }

    return item;
  });

  if (editMode) {
    return (
      <SortableContext items={serviceIds} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={classNames(
            layout?.style === "row" ? `grid ${columnMap[layout?.columns]} gap-x-2` : "flex flex-col",
            header ? "mt-3" : "",
            "services-list min-h-[2rem]",
            isOver && "ring-2 ring-blue-400/30 rounded-md",
          )}
        >
          {listContent}
        </ul>
      </SortableContext>
    );
  }

  return (
    <ul
      className={classNames(
        layout?.style === "row" ? `grid ${columnMap[layout?.columns]} gap-x-2` : "flex flex-col",
        header ? "mt-3" : "",
        "services-list",
      )}
    >
      {listContent}
    </ul>
  );
}
