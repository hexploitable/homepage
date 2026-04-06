import classNames from "classnames";
import SectionDivider, { isDivider } from "components/edit/section-divider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveGridLayout } from "react-grid-layout";

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480 };
const COLS = { lg: 12, md: 8, sm: 4, xs: 2 };
const ROW_HEIGHT = 100;

export const WIDGET_PREFIX = "__widget_";

export function isWidget(id) {
  return id?.startsWith(WIDGET_PREFIX);
}

export function generateDefaultLayouts(groups, dividers = [], widgetItems = []) {
  const allItems = [
    ...widgetItems.map((w) => ({ id: w.id, type: "widget", defaultW: 3, defaultH: 1 })),
    ...groups.map((g) => ({ id: g.name, type: "group", defaultW: g.services ? 4 : 3, defaultH: 3 })),
    ...dividers.map((d) => ({ id: d.id, type: "divider" })),
  ];

  function layoutForBreakpoint(cols) {
    let curX = 0;
    let curY = 0;
    let rowMaxH = 0;

    return allItems.map((item) => {
      if (item.type === "divider") {
        if (curX > 0) {
          curY += rowMaxH;
          curX = 0;
          rowMaxH = 0;
        }
        const entry = { i: item.id, x: 0, y: curY, w: cols, h: 1, minW: cols, maxW: cols, minH: 1, maxH: 1 };
        curY += 1;
        return entry;
      }

      const w = Math.min(item.defaultW, cols);
      const h = item.defaultH;

      if (curX + w > cols) {
        curY += rowMaxH;
        curX = 0;
        rowMaxH = 0;
      }

      const entry = { i: item.id, x: curX, y: curY, w, h, minW: 1, minH: 1 };
      curX += w;
      rowMaxH = Math.max(rowMaxH, h);
      return entry;
    });
  }

  return {
    lg: layoutForBreakpoint(COLS.lg),
    md: layoutForBreakpoint(COLS.md),
    sm: layoutForBreakpoint(COLS.sm),
    xs: layoutForBreakpoint(COLS.xs),
  };
}

function useWidth(ref) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setWidth(el.offsetWidth);

    return () => observer.disconnect();
  }, [ref]);

  return width;
}

export default function GridLayoutWrapper({
  groups,
  layouts,
  onLayoutChange,
  editMode,
  renderGroup,
  dividers = [],
  onDividerLabelChange,
  onDividerRemove,
  widgetItems = [],
  renderWidget,
}) {
  const containerRef = useRef(null);
  const width = useWidth(containerRef);

  const groupMap = useMemo(() => {
    const map = {};
    groups.forEach((g) => {
      map[g.name] = g;
    });
    return map;
  }, [groups]);

  const dividerMap = useMemo(() => {
    const map = {};
    dividers.forEach((d) => {
      map[d.id] = d;
    });
    return map;
  }, [dividers]);

  const widgetMap = useMemo(() => {
    const map = {};
    widgetItems.forEach((w) => {
      map[w.id] = w;
    });
    return map;
  }, [widgetItems]);

  const layoutKeys = useMemo(() => {
    if (!layouts?.lg) {
      return [...widgetItems.map((w) => w.id), ...groups.map((g) => g.name), ...dividers.map((d) => d.id)];
    }
    return layouts.lg.map((item) => item.i);
  }, [layouts, groups, dividers, widgetItems]);

  const handleLayoutChange = useCallback((_currentLayout, allLayouts) => onLayoutChange(allLayouts), [onLayoutChange]);

  return (
    <div ref={containerRef} className={classNames("m-4 sm:m-8 sm:mt-4 mb-2", editMode && "edit-grid-active")}>
      {width > 0 && (
        <ResponsiveGridLayout
          width={width}
          className="layout"
          layouts={layouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".grid-drag-handle"
          compactType="vertical"
          useCSSTransforms
        >
          {layoutKeys.map((name) => {
            if (isDivider(name)) {
              const divider = dividerMap[name];
              return (
                <div key={name} className={classNames("relative", editMode && "grid-item-divider")}>
                  {editMode && (
                    <div className="grid-drag-handle absolute top-0 left-0 right-0 h-4 cursor-grab active:cursor-grabbing z-40" />
                  )}
                  <SectionDivider
                    id={name}
                    label={divider?.label}
                    editMode={editMode}
                    onLabelChange={onDividerLabelChange}
                    onRemove={onDividerRemove}
                  />
                </div>
              );
            }

            if (isWidget(name)) {
              const widgetItem = widgetMap[name];
              if (!widgetItem || !renderWidget) return null;
              return (
                <div key={name} className={classNames("relative", editMode && "grid-item-edit")}>
                  {editMode && (
                    <div className="grid-drag-handle absolute top-0 left-0 right-0 h-6 cursor-grab active:cursor-grabbing z-40 flex items-center justify-center">
                      <div className="w-8 h-1 rounded-full bg-theme-500/40" />
                    </div>
                  )}
                  <div className="h-full overflow-auto">{renderWidget(widgetItem.widget)}</div>
                </div>
              );
            }

            const group = groupMap[name];
            if (!group) return null;
            return (
              <div key={name} className={classNames("relative", editMode && "grid-item-edit")}>
                {editMode && (
                  <div className="grid-drag-handle absolute top-0 left-0 right-0 h-6 cursor-grab active:cursor-grabbing z-40 flex items-center justify-center">
                    <div className="w-8 h-1 rounded-full bg-theme-500/40" />
                  </div>
                )}
                <div className="h-full overflow-auto">{renderGroup(group)}</div>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
