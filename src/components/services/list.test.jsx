// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { EditModeContext } from "utils/contexts/edit-mode";
import { describe, expect, it, vi } from "vitest";

vi.mock("components/services/item", () => ({
  default: function ServiceItemMock({ service, groupName, useEqualHeights }) {
    return (
      <li data-testid="service-item">
        {groupName}:{service.name}:{String(useEqualHeights)}
      </li>
    );
  },
}));

import List from "./list";

const editModeOff = {
  editMode: false,
  setEditMode: vi.fn(),
  groupOrder: null,
  setGroupOrder: vi.fn(),
  gridLayouts: null,
  setGridLayouts: vi.fn(),
  dividers: [],
  setDividers: vi.fn(),
};

describe("components/services/list", () => {
  it("renders items and passes the computed useEqualHeights value", () => {
    render(
      <EditModeContext.Provider value={editModeOff}>
        <List
          groupName="G"
          services={[{ name: "A" }, { name: "B" }]}
          layout={{ useEqualHeights: true }}
          useEqualHeights={false}
          header
        />
      </EditModeContext.Provider>,
    );

    const items = screen.getAllByTestId("service-item");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("G:A:true");
    expect(items[1]).toHaveTextContent("G:B:true");
  });
});
