import { Box, Typography } from '@mui/material';
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';

import { useActivitiesTimeline } from '../hooks/useActivities';
import { STATUS_COLORS, alphaColor } from '../utils/colors';

const MONTH_NAMES = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Pa\u017a', 'Lis', 'Gru'];
const ITEM_H = 38;
const CONTAINER_H = 440;

type DialItem =
  | { type: 'year'; year: number; total: number; key: string }
  | { type: 'month'; year: number; month: number; count: number; key: string };

interface Props {
  externalYM?: { year: number; month?: number };
  onNavigate: (s: { year: number; month?: number }) => void;
}

export default function YearMonthSidebar({ externalYM, onNavigate }: Props) {
  const { data: timeline } = useActivitiesTimeline();

  const yearData = useMemo(() => {
    if (!timeline) return [];
    const map = new Map<number, { year: number; months: { month: number; count: number }[]; total: number }>();
    for (const e of timeline) {
      if (!map.has(e.year)) map.set(e.year, { year: e.year, months: [], total: 0 });
      const y = map.get(e.year)!;
      y.months.push({ month: e.month, count: e.count });
      y.total += e.count;
    }
    return [...map.values()]
      .map(y => ({ ...y, months: y.months.sort((a, b) => a.month - b.month) }))
      .sort((a, b) => b.year - a.year);
  }, [timeline]);

  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const expandedYearRef = useRef<number | null>(null);
  const pendingKeyRef = useRef<string | null>(null);

  const items = useMemo((): DialItem[] => {
    const r: DialItem[] = [];
    for (const yd of yearData) {
      r.push({ type: 'year', year: yd.year, total: yd.total, key: `y-${yd.year}` });
      if (yd.year === expandedYear) {
        for (const m of yd.months) {
          r.push({ type: 'month', year: yd.year, month: m.month, count: m.count, key: `m-${yd.year}-${m.month}` });
        }
      }
    }
    return r;
  }, [yearData, expandedYear]);

  const [centeredKey, setCenteredKey] = useState<string>('');
  const [dragOffset, setDragOffset] = useState(0);
  const dragOffsetRef = useRef(0);
  const centeredKeyRef = useRef('');
  const itemsRef = useRef(items);
  const afRef = useRef<number | undefined>(undefined);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { dragOffsetRef.current = dragOffset; }, [dragOffset]);
  useEffect(() => { centeredKeyRef.current = centeredKey; }, [centeredKey]);

  const visualIndex = useMemo(() => {
    const base = items.findIndex(i => i.key === centeredKey);
    return (base >= 0 ? base : 0) + dragOffset;
  }, [items, centeredKey, dragOffset]);

  const springToZero = useCallback(() => {
    if (afRef.current) cancelAnimationFrame(afRef.current);
    const step = () => {
      const v = dragOffsetRef.current;
      if (Math.abs(v) < 0.003) {
        dragOffsetRef.current = 0;
        setDragOffset(0);
        return;
      }
      const n = v * 0.78;
      dragOffsetRef.current = n;
      setDragOffset(n);
      afRef.current = requestAnimationFrame(step);
    };
    afRef.current = requestAnimationFrame(step);
  }, []);

  const animateToIdx = useCallback((targetIdx: number) => {
    const its = itemsRef.current;
    const item = its[targetIdx];
    if (!item) return;
    const currBase = its.findIndex(i => i.key === centeredKeyRef.current);
    const currAbs = (currBase >= 0 ? currBase : 0) + dragOffsetRef.current;
    setCenteredKey(item.key);
    centeredKeyRef.current = item.key;
    const newOff = currAbs - targetIdx;
    dragOffsetRef.current = newOff;
    setDragOffset(newOff);
    springToZero();
  }, [springToZero]);

  // When items change: resolve pending navigation or recover lost centeredKey
  useEffect(() => {
    if (pendingKeyRef.current) {
      const k = pendingKeyRef.current;
      const idx = itemsRef.current.findIndex(i => i.key === k);
      if (idx >= 0) {
        pendingKeyRef.current = null;
        animateToIdx(idx);
        return;
      }
    }
    if (!centeredKey || items.length === 0) return;
    const idx = items.findIndex(i => i.key === centeredKey);
    if (idx < 0) {
      const m = centeredKey.match(/^m-(\d+)-/);
      const yearKey = m ? `y-${m[1]}` : items[0]!.key;
      const fb = items.findIndex(i => i.key === yearKey) >= 0 ? yearKey : items[0]!.key;
      setCenteredKey(fb);
      centeredKeyRef.current = fb;
      dragOffsetRef.current = 0;
      setDragOffset(0);
    }
  }, [items]);

  const commitSnap = useCallback((velocity = 0) => {
    const its = itemsRef.current;
    const base = its.findIndex(i => i.key === centeredKeyRef.current);
    const absVisual = (base >= 0 ? base : 0) + dragOffsetRef.current + velocity * 0.08;
    const targetIdx = Math.max(0, Math.min(its.length - 1, Math.round(absVisual)));
    const item = its[targetIdx];
    if (!item) return;
    setCenteredKey(item.key);
    centeredKeyRef.current = item.key;
    dragOffsetRef.current = absVisual - targetIdx;
    setDragOffset(absVisual - targetIdx);
    springToZero();
    if (item.type === 'year') {
      const prev = expandedYearRef.current;
      const next = prev === item.year ? null : item.year;
      expandedYearRef.current = next;
      setExpandedYear(next);
      onNavigate({ year: item.year });
    } else {
      onNavigate({ year: item.year, month: (item as { month: number }).month });
    }
  }, [springToZero, onNavigate]);

  // Sync to external scroll position (no onNavigate callback — avoids feedback loop)
  useEffect(() => {
    if (!externalYM) return;
    const { year, month } = externalYM;
    const monthKey = month ? `m-${year}-${month}` : null;
    const yearKey = `y-${year}`;

    if (expandedYearRef.current !== year) {
      expandedYearRef.current = year;
      setExpandedYear(year);
      if (monthKey) {
        pendingKeyRef.current = monthKey;
        return;
      }
    }

    const its = itemsRef.current;
    const targetKey = (monthKey && its.find(i => i.key === monthKey)) ? monthKey : yearKey;
    const idx = its.findIndex(i => i.key === targetKey);
    if (idx >= 0) animateToIdx(idx);
  }, [externalYM, animateToIdx]);

  const drag = useRef({ active: false, startY: 0, startOff: 0, lastY: 0, lastT: 0, vel: 0 });

  const onDragMove = useCallback((y: number) => {
    const d = drag.current;
    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) d.vel = ((d.lastY - y) / dt) * 14;
    d.lastY = y; d.lastT = now;
    const delta = (d.startY - y) / ITEM_H;
    const its = itemsRef.current;
    const base = its.findIndex(i => i.key === centeredKeyRef.current);
    const absPos = (base >= 0 ? base : 0) + d.startOff + delta;
    const clamped = Math.max(0, Math.min(its.length - 1, absPos));
    dragOffsetRef.current = clamped - (base >= 0 ? base : 0);
    setDragOffset(clamped - (base >= 0 ? base : 0));
  }, []);

  const onDragEnd = useCallback(() => {
    drag.current.active = false;
    commitSnap(drag.current.vel);
  }, [commitSnap]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (afRef.current) cancelAnimationFrame(afRef.current);
    drag.current = { active: true, startY: e.clientY, startOff: dragOffsetRef.current, lastY: e.clientY, lastT: performance.now(), vel: 0 };
    const mm = (ev: MouseEvent) => { if (drag.current.active) onDragMove(ev.clientY); };
    const mu = () => { onDragEnd(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
  }, [onDragMove, onDragEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (afRef.current) cancelAnimationFrame(afRef.current);
    const t0 = e.touches[0]!;
    drag.current = { active: true, startY: t0.clientY, startOff: dragOffsetRef.current, lastY: t0.clientY, lastT: performance.now(), vel: 0 };
    const tm = (ev: TouchEvent) => { ev.preventDefault(); if (drag.current.active) onDragMove(ev.touches[0]!.clientY); };
    const te = () => { onDragEnd(); window.removeEventListener('touchmove', tm); window.removeEventListener('touchend', te); };
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', te);
  }, [onDragMove, onDragEnd]);

  // Init: show latest year
  useEffect(() => {
    if (yearData.length > 0 && !centeredKeyRef.current) {
      const fy = yearData[0]!.year;
      expandedYearRef.current = fy;
      setExpandedYear(fy);
      setCenteredKey(`y-${fy}`);
      centeredKeyRef.current = `y-${fy}`;
    }
  }, [yearData]);

  if (!timeline || items.length === 0) return null;

  const HALF = CONTAINER_H / 2;

  return (
    <Box
      sx={{
        width: 84,
        flexShrink: 0,
        position: 'sticky',
        top: 16,
        height: CONTAINER_H,
        overflow: 'hidden',
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <Box sx={{
        position: 'absolute',
        left: 6, right: 6,
        top: '50%',
        transform: 'translateY(-50%)',
        height: ITEM_H + 10,
        bgcolor: alphaColor(STATUS_COLORS.accent, 0.07),
        border: `1px solid ${alphaColor(STATUS_COLORS.accent, 0.22)}`,
        borderRadius: 2,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {items.map((item, idx) => {
        const dist = idx - visualIndex;
        const absDist = Math.abs(dist);
        const mag = Math.exp(-(absDist * absDist) * 0.52);
        const scale = 0.52 + mag * 0.48;
        const opacity = Math.max(0.06, Math.exp(-absDist * 0.36));
        const y = HALF + dist * ITEM_H - ITEM_H / 2;
        const isActive = absDist < 0.5;
        const isYear = item.type === 'year';

        return (
          <Box
            key={item.key}
            sx={{
              position: 'absolute',
              left: 0, right: 0,
              height: ITEM_H,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `translateY(${y}px) scale(${scale})`,
              opacity,
              zIndex: isActive ? 2 : 1,
            }}
          >
            <Typography
              sx={{
                fontSize: isYear ? '1.05rem' : '0.88rem',
                fontWeight: isActive ? 700 : isYear ? 500 : 400,
                color: isActive ? STATUS_COLORS.accent : isYear ? 'text.primary' : 'text.secondary',
                lineHeight: 1,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {isYear ? String(item.year) : MONTH_NAMES[(item as { month: number }).month - 1]}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
