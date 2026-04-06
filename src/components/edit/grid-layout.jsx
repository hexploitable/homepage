import classNames from "classnames";
import SectionDivider, { isDivider } from "components/edit/section-divider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveGridLayout } from "react-grid-layout";

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480 };
const COLS = { lg: 12, md: 8, sm: 4, xs: 2 };
const ROW_HEIGHT = 100;

export function generateDefaultLayouts(groups, dividers = []) {
  const allItems = [...groups.map((g) => ({ id: g.name, isGroup: true, group: g })), ...dividers.map((d) => ({ id: d.id, isGroup: false }))];

  const defaultW = 4;
  const defaultH = 3;
  const itemsPerRow = Math.floor(COLS.lg / defaultW);

  let groupIdx = 0;
  const lg = allItems.map((item) => {
    if (!item.isGroup) {
      const y = groupIdx > 0 ? Math.floor(groupIdx / itemsPerRow) * defaultH + defaultH : 0;
      return { i: item.id, x: 0, y, w: COLS.lg, h: 1, minW: COLS.lg, maxW: COLS.lg, minH: 1, maxH: 1 };
    }
    const pos = {
      i: item.id,
      x: (groupIdx % itemsPerRow) * defaultW,
      y: Math.floor(groupIdx / itemsPerRow) * defaultH,
      w: item.group?.services ? defaultW : 3,
      h: defaultH,
      minW: 2,
      minH: 2,
    };
    groupIdx += 1;
    return pos;
  });

  const makeSimple = (cols, items) =>
    items.map((item, i) => {
      if (!item.isGroup) {
        return { i: item.id, x: 0, y: i * 3, w: cols, h: 1, minW: cols, maxW: cols, minH: 1, maxH: 1 };
      }
      const perRow = Math.floor(cols / 4) || 1;
      const gi = items.slice(0, i).filter((it) => it.isGroup).length;
      return { i: item.id, x: (gi % perRow) * 4, y: Math.floor(gi / perRow) * 3, w: Math.min(4, cols), h: 3, minW: 2, minH: 2 };
    });

  return {
    lg,
    md: makeSimple(COLS.md, allItems),
    sm: makeSimple(COLS.sm, allItems),
    xs: makeSimple(COLS.xs, allItems),
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

  const layoutKeys = useMemo(() => {
    if (!layouts?.lg) return [...groups.map((g) => g.name), ...dividers.map((d) => d.id)];
    return layouts.lg.map((item) => item.i);
  }, [layouts, groups, dividers]);

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
