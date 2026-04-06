import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveGridLayout } from "react-grid-layout";

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480 };
const COLS = { lg: 12, md: 8, sm: 4, xs: 2 };
const ROW_HEIGHT = 100;

export function generateDefaultLayouts(groups) {
  const defaultW = 4;
  const defaultH = 3;
  const itemsPerRow = Math.floor(COLS.lg / defaultW);

  const lg = groups.map((group, i) => ({
    i: group.name,
    x: (i % itemsPerRow) * defaultW,
    y: Math.floor(i / itemsPerRow) * defaultH,
    w: group.services ? defaultW : 3,
    h: defaultH,
    minW: 2,
    minH: 2,
  }));

  const md = groups.map((group, i) => {
    const mdW = 4;
    const mdPerRow = Math.floor(COLS.md / mdW);
    return {
      i: group.name,
      x: (i % mdPerRow) * mdW,
      y: Math.floor(i / mdPerRow) * 3,
      w: mdW,
      h: 3,
      minW: 2,
      minH: 2,
    };
  });

  const sm = groups.map((group, i) => ({
    i: group.name,
    x: 0,
    y: i * 3,
    w: COLS.sm,
    h: 3,
    minW: 2,
    minH: 2,
  }));

  const xs = groups.map((group, i) => ({
    i: group.name,
    x: 0,
    y: i * 3,
    w: COLS.xs,
    h: 3,
    minW: 1,
    minH: 2,
  }));

  return { lg, md, sm, xs };
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

export default function GridLayoutWrapper({ groups, layouts, onLayoutChange, editMode, renderGroup }) {
  const containerRef = useRef(null);
  const width = useWidth(containerRef);

  const groupMap = useMemo(() => {
    const map = {};
    groups.forEach((g) => {
      map[g.name] = g;
    });
    return map;
  }, [groups]);

  const layoutKeys = useMemo(() => {
    if (!layouts?.lg) return groups.map((g) => g.name);
    return layouts.lg.map((item) => item.i);
  }, [layouts, groups]);

  const handleLayoutChange = useCallback(
    (_currentLayout, allLayouts) => onLayoutChange(allLayouts),
    [onLayoutChange],
  );

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
