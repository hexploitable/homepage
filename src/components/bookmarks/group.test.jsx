// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { EditModeContext } from "utils/contexts/edit-mode";
import { describe, expect, it, vi } from "vitest";

vi.mock("@headlessui/react", async () => {
  const React = await import("react");
  const { Fragment } = React;

  function Transition({ as: As = Fragment, children }) {
    if (As === Fragment) return <>{children}</>;
    return <As>{children}</As>;
  }

  function Disclosure({ defaultOpen = true, children }) {
    const content = typeof children === "function" ? children({ open: defaultOpen }) : children;
    return <div>{content}</div>;
  }

  function DisclosureButton(props) {
    return <button type="button" {...props} />;
  }

  const DisclosurePanel = React.forwardRef(function DisclosurePanel(props, ref) {
    // HeadlessUI uses a boolean `static` prop; avoid forwarding it to the DOM.
    const { static: _static, ...rest } = props;
    return <div ref={ref} data-testid="disclosure-panel" {...rest} />;
  });

  Disclosure.Button = DisclosureButton;
  Disclosure.Panel = DisclosurePanel;

  return { Disclosure, Transition };
});

vi.mock("components/bookmarks/list", () => ({
  default: function BookmarksListMock({ bookmarks }) {
    return <div data-testid="bookmarks-list">count:{bookmarks?.length ?? 0}</div>;
  },
}));

vi.mock("components/errorboundry", () => ({
  default: function ErrorBoundaryMock({ children }) {
    return <>{children}</>;
  },
}));

vi.mock("components/resolvedicon", () => ({
  default: function ResolvedIconMock() {
    return <div data-testid="resolved-icon" />;
  },
}));

import BookmarksGroup from "./group";

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

describe("components/bookmarks/group", () => {
  it("renders the group header and list", () => {
    render(
      <EditModeContext.Provider value={editModeOff}>
        <BookmarksGroup
          bookmarks={{ name: "Bookmarks", bookmarks: [{ name: "A" }] }}
          layout={{ icon: "mdi:test" }}
          disableCollapse={false}
          groupsInitiallyCollapsed={false}
        />
      </EditModeContext.Provider>,
    );

    expect(screen.getByText("Bookmarks")).toBeInTheDocument();
    expect(screen.getByTestId("resolved-icon")).toBeInTheDocument();
    expect(screen.getByTestId("bookmarks-list")).toHaveTextContent("count:1");
  });

  it("sets the panel height to 0 when initially collapsed", async () => {
    render(
      <EditModeContext.Provider value={editModeOff}>
        <BookmarksGroup
          bookmarks={{ name: "Bookmarks", bookmarks: [] }}
          layout={{ initiallyCollapsed: true }}
          groupsInitiallyCollapsed={false}
        />
      </EditModeContext.Provider>,
    );

    const panel = screen.getByTestId("disclosure-panel");
    await waitFor(() => {
      expect(panel.style.height).toBe("0px");
    });
  });
});
