import { useMemo, useCallback, useRef, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error external package types resolution via exports may fail in Vite; dts exists in dist
import { CubicSpline, QuadraticSpline } from 'bezier-spline-eval';
import { getArcExtentsFromStartPoint } from '../../arc';
import { useGrip, useGripSetter } from '@owebeeone/grip-react';
import {
  PATHS_VIEW_DATA,
  PATHS_SELECTED_PATH_ID,
  PATHS_SELECTED_PATH_ID_TAP,
  PATHS_SELECTED_SEGMENT_IDS,
  PATHS_SELECTED_SEGMENT_IDS_TAP,
  PATHS_SHOW_CONSTRUCTION,
  PATHS_SHOW_CONSTRUCTION_TAP,
  CURRENT_SOURCE_GITHUB_URL,
  PATHS_VIEWBOX,
  PATHS_VIEWBOX_TAP,
  PATHS_INSPECT,
  PATHS_INSPECT_TAP,
} from '../../grips';

export default function SvgPathsViewer() {
  const doc = useGrip(PATHS_VIEW_DATA) as any | undefined;
  const selectedPathId = useGrip(PATHS_SELECTED_PATH_ID);
  const selectedSegIds = useGrip(PATHS_SELECTED_SEGMENT_IDS) || [];
  const showConstruction = useGrip(PATHS_SHOW_CONSTRUCTION) ?? true;
  const shapeGithubUrl = useGrip(CURRENT_SOURCE_GITHUB_URL);
  const inspectGrip = useGrip(PATHS_INSPECT);

  const setSelectedPathId = useGripSetter(PATHS_SELECTED_PATH_ID_TAP);
  const setSelectedSegIds = useGripSetter(PATHS_SELECTED_SEGMENT_IDS_TAP);
  const setShowConstruction = useGripSetter(PATHS_SHOW_CONSTRUCTION_TAP);
  const setInspectGrip = useGripSetter(PATHS_INSPECT_TAP);

  const matrix = doc?.matrix as number[] | undefined; // [a,b,c,d,e,f]
  const width = doc?.width ?? 600;
  const height = doc?.height ?? 600;

  // Matrix helper available before any use
  const applyMatrix = useCallback((x: number, y: number) => {
    if (!matrix) return { x, y } as const;
    const [a, b, c, d, e, f] = matrix;
    return { x: a * x + c * y + e, y: b * x + d * y + f } as const;
  }, [matrix]);

  // Geometry helpers (defined early to avoid TDZ when used in hooks)
  // geometry helper decls moved earlier; remove duplicates

  const pathsList = useMemo(() => {
    // Fallback: derive from imageMeta keys; otherwise use json schema later
    if (!doc?.imageMeta) return [] as string[];
    return Object.keys(doc.imageMeta.path_items || {});
  }, [doc]);

  const activePathId = useMemo(() => {
    if (selectedPathId && pathsList.includes(selectedPathId)) return selectedPathId;
    return pathsList[0];
  }, [pathsList, selectedPathId]);

  const handleSegmentClick = useCallback((segId: string, ev: React.MouseEvent) => {
    const isShift = ev.shiftKey;
    const mp = toModelPoint(ev);
    if (isShift) {
      if (selectedSegIds.includes(segId)) {
        setSelectedSegIds(selectedSegIds.filter((s: string) => s !== segId));
      } else {
        setSelectedSegIds([...selectedSegIds, segId]);
      }
    } else {
      if (selectedSegIds.length === 1 && selectedSegIds[0] === segId) {
        setSelectedSegIds([]);
      } else {
        setSelectedSegIds([segId]);
      }
    }
    if (mp) {
      const seg = (segments as any[]).find(s => s.id === segId);
      if (seg) {
        const info = buildInspect(seg, mp);
        inspectRef.current = info;
        setInspectGrip(info);
      }
    }
  }, [selectedSegIds, setSelectedSegIds]);

  if (!doc) return <div className="h-full w-full flex items-center justify-center text-gray-500">No paths available</div>;

  // Minimal HTML-derived render: draw segments from segmentMeta for active path
  const segdict = doc.segmentMeta?.segdict || {};
  const segments = Object.values(segdict).filter((s: any) => s.path_id === activePathId);

  // Build splines for cubic/quadratic segments once per segment set
  const splineMap = useMemo(() => {
    const map = new Map<string, { kind: 'cubic' | 'quad'; spline: CubicSpline | QuadraticSpline }>();
    for (const s of segments as any[]) {
      if (!s?.points) continue;
      if (s.shape_type === 'splineto' && s.points.length >= 4) {
        try { map.set(s.id, { kind: 'cubic', spline: new CubicSpline([s.points[0], s.points[1], s.points[2], s.points[3]]) }); } catch {}
      } else if (s.shape_type === 'qsplineto' && s.points.length >= 3) {
        try { map.set(s.id, { kind: 'quad', spline: new QuadraticSpline([s.points[0], s.points[1], s.points[2]]) }); } catch {}
      }
    }
    return map;
  }, [segments]);

  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const consider = (x: number, y: number) => {
      if (x < minX) minX = x; if (y < minY) minY = y;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y;
    };
    for (const s of segments as any[]) {
      const type = s.shape_type;
      const pts = s.points as number[][] | undefined;
      if (!pts || pts.length === 0) continue;
      if (type === 'lineto') {
        for (const [x, y] of pts) consider(x, y);
      } else if (type === 'splineto') {
        const entry = splineMap.get(s.id);
        if (entry && entry.kind === 'cubic') {
          const ex = (entry.spline as CubicSpline).extents();
          if (ex) { consider(ex[0][0], ex[0][1]); consider(ex[1][0], ex[1][1]); }
        } else {
          for (const [x, y] of pts) consider(x, y);
        }
      } else if (type === 'qsplineto') {
        const entry = splineMap.get(s.id);
        if (entry && entry.kind === 'quad') {
          const ex = (entry.spline as QuadraticSpline).extents();
          if (ex) { consider(ex[0][0], ex[0][1]); consider(ex[1][0], ex[1][1]); }
        } else {
          for (const [x, y] of pts) consider(x, y);
        }
      } else if (type === 'arcto1') {
        // Use analytic extents for circular arcs
        try {
          const [startPoint, _endPoint, centerPoint] = pts as [number[], number[], number[]];
          const radius = Math.hypot(startPoint[0] - centerPoint[0], startPoint[1] - centerPoint[1]);
          const sweep = (s.sweep_angle || 0) * (s.sweep_flag ? 1 : -1);
          const ex = getArcExtentsFromStartPoint([startPoint[0], startPoint[1]], sweep, radius, [centerPoint[0], centerPoint[1]]);
          if (ex) { consider(ex[0][0], ex[0][1]); consider(ex[1][0], ex[1][1]); }
          else {
            // Fallback to endpoints if analytic fails
            consider(startPoint[0], startPoint[1]);
            consider(centerPoint[0] + radius, centerPoint[1]);
          }
        } catch {
          // Ultimate fallback: sample a few points
          const steps = 16;
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const [x, y] = evalArc(s, t);
            consider(x, y);
          }
        }
      } else {
        // Fallback: consider control points
        for (const [x, y] of pts) consider(x, y);
      }
    }
    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
      return { minX: -10, minY: -10, maxX: 10, maxY: 10 };
    }
    // Small pad
    const padX = (maxX - minX) * 0.05 || 1;
    const padY = (maxY - minY) * 0.05 || 1;
    return { minX: minX - padX, minY: minY - padY, maxX: maxX + padX, maxY: maxY + padY };
  }, [segments, splineMap]);

  // Refs (declared before any usage in hooks)
  const svgRef = useRef<SVGSVGElement | null>(null);
  const groupRef = useRef<SVGGElement | null>(null);

  // Grid helpers based on current viewBox to keep density reasonable
  const vbGrip = useGrip(PATHS_VIEWBOX);
  const grid = useMemo(() => {
    const vbLocal = (vbGrip || { x: 0, y: 0, w: width, h: height });
    const vminX = vbLocal.x, vmaxX = vbLocal.x + vbLocal.w;
    const vminY = vbLocal.y, vmaxY = vbLocal.y + vbLocal.h;
    const svgW = svgRef.current?.clientWidth || 600;
    const svgH = svgRef.current?.clientHeight || 600;
    const pxPerModel = ((svgW / (vbLocal.w || 1)) + (svgH / (vbLocal.h || 1))) / 2;
    const targetPx = 80; // desired spacing in pixels for major grid
    const raw = Math.max(1e-9, targetPx / (pxPerModel || 1));
    const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
    const candidates = [1, 2, 5].map(n => n * pow10);
    const step = candidates.find(n => n >= raw) || candidates[candidates.length - 1];
    const minor = step / 5;
    function range(from: number, to: number, by: number) {
      const start = Math.ceil(from / by) * by;
      const out: number[] = [];
      for (let v = start; v <= to; v += by) out.push(+v.toFixed(10));
      return out;
    }
    return {
      step, minor,
      minorXs: range(vminX, vmaxX, minor),
      minorYs: range(vminY, vmaxY, minor),
      majorXs: range(vminX, vmaxX, step),
      majorYs: range(vminY, vmaxY, step)
    };
  }, [vbGrip, width, height]);

  

  type Inspect = { segId: string; t: number; point: [number, number]; info: Record<string, any> } | undefined;
  const inspectRef = useRef<Inspect>(undefined);

  // Zoom/Pan via viewBox stored in grips
  const setVbGrip = useGripSetter(PATHS_VIEWBOX_TAP);
  const vb = vbGrip || { x: 0, y: 0, w: width, h: height };
  // Reset viewBox to fit transformed bounds when document changes
  const dimKey = `${width}x${height}`;
  useMemo(() => {
    // Transform corners to post-matrix space
    const p = [
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.minY },
      { x: bounds.minX, y: bounds.maxY },
      { x: bounds.maxX, y: bounds.maxY },
    ].map(({ x, y }) => applyMatrix(x, y));
    const xMin = Math.min(...p.map(q => q.x));
    const xMax = Math.max(...p.map(q => q.x));
    const yMin = Math.min(...p.map(q => q.y));
    const yMax = Math.max(...p.map(q => q.y));
    const pad = Math.max((xMax - xMin), (yMax - yMin)) * 0.05;
    setVbGrip({ x: xMin - pad, y: yMin - pad, w: (xMax - xMin) + 2 * pad, h: (yMax - yMin) + 2 * pad });
  }, [dimKey, bounds.minX, bounds.minY, bounds.maxX, bounds.maxY]);

  const onWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const vx = vb.x + (px / rect.width) * vb.w;
    const vy = vb.y + (py / rect.height) * vb.h;
    const f = Math.pow(1.0015, e.deltaY); // >1 zoom out, <1 zoom in
    const newW = Math.max(1e-3, vb.w * f);
    const newH = Math.max(1e-3, vb.h * f);
    const newX = vx - (px / rect.width) * newW;
    const newY = vy - (py / rect.height) * newH;
    setVbGrip({ x: newX, y: newY, w: newW, h: newH });
  }, [vb]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheelNative as EventListener);
    };
  }, [onWheelNative]);

  const isPanningRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    isPanningRef.current = true;
    lastPtRef.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanningRef.current || !lastPtRef.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dxPx = e.clientX - lastPtRef.current.x;
    const dyPx = e.clientY - lastPtRef.current.y;
    lastPtRef.current = { x: e.clientX, y: e.clientY };
    const dx = -dxPx * (vb.w / rect.width);
    const dy = -dyPx * (vb.h / rect.height);
    setVbGrip({ x: vb.x + dx, y: vb.y + dy, w: vb.w, h: vb.h });
  }, [vb.w, vb.h]);
  const endPan = useCallback(() => { isPanningRef.current = false; lastPtRef.current = null; }, []);

  const downloadSvg = useCallback(() => {
    const el = svgRef.current;
    if (!el) return;
    const cloned = el.cloneNode(true) as SVGSVGElement;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(cloned);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const htmlPath = (doc?.htmlPath as string | undefined) || 'paths.html';
    const base = htmlPath.replace(/.*\//, '').replace(/\.paths\.html$/i, '');
    const pid = (typeof activePathId === 'string' && activePathId.startsWith('path')) ? activePathId : (activePathId ?? 'path');
    a.download = `${base}_${pid}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadPng = useCallback(() => {
    const el = svgRef.current;
    if (!el) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(el);
    const img = new Image();
    const svgData = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = el.clientWidth || width;
      canvas.height = el.clientHeight || height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const pngData = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngData;
      const htmlPath = (doc?.htmlPath as string | undefined) || 'paths.html';
      const base = htmlPath.replace(/.*\//, '').replace(/\.paths\.html$/i, '');
      const pid = (typeof activePathId === 'string' && activePathId.startsWith('path')) ? activePathId : (activePathId ?? 'path');
      a.download = `${base}_${pid}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = svgData;
  }, [width, height]);

  const githubLink = useMemo(() => {
    if (!shapeGithubUrl) return undefined;
    const sid = inspectRef.current?.segId || (selectedSegIds.length === 1 ? selectedSegIds[0] : undefined);
    if (!sid) return undefined;
    const seg = (segments as any[]).find(s => s.id === sid);
    const segLine = seg?.trace?.[1] ?? seg?.trace?.line ?? seg?.line_number;
    if (!segLine) return shapeGithubUrl;
    // Replace any existing #L... with selected line, else append
    return shapeGithubUrl.replace(/#L\d+$/, '') + `#L${segLine}`;
  }, [shapeGithubUrl, selectedSegIds, segments]);

  // --- Math helpers ---

  const toModelPoint = useCallback((evt: React.MouseEvent) => {
    const svg = svgRef.current;
    const g = groupRef.current;
    if (!svg || !g || typeof (svg as any).createSVGPoint !== 'function') return undefined;
    const pt = (svg as any).createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const ctm = g.getScreenCTM();
    if (!ctm) return undefined;
    const inv = ctm.inverse();
    const p = pt.matrixTransform(inv);
    return [p.x, p.y] as [number, number];
  }, []);

  const dist2 = (p: [number, number], q: [number, number]) => {
    const dx = p[0] - q[0];
    const dy = p[1] - q[1];
    return dx * dx + dy * dy;
  };

  const evalLine = (pts: number[][], t: number) => {
    const [p0, p1] = pts as [number[], number[]];
    return [p0[0] + t * (p1[0] - p0[0]), p0[1] + t * (p1[1] - p0[1])] as [number, number];
  };
  const closestTOnLine = (pts: number[][], p: [number, number]) => {
    const [p0, p1] = pts as [number[], number[]];
    const vx = p1[0] - p0[0], vy = p1[1] - p0[1];
    const len2 = vx * vx + vy * vy || 1;
    const t = ((p[0] - p0[0]) * vx + (p[1] - p0[1]) * vy) / len2;
    return Math.max(0, Math.min(1, t));
  };

  // cubic/quadratic evaluation now provided by bezier-spline-eval
  const evalArc = (seg: any, t: number) => {
    const [startPoint, _endPoint, centerPoint] = seg.points as [number[], number[], number[]];
    const cx = centerPoint[0], cy = centerPoint[1];
    const startA = Math.atan2(startPoint[1] - cy, startPoint[0] - cx);
    const dir = seg.sweep_flag ? 1 : -1;
    const theta = startA + dir * (seg.sweep_angle || 0) * t;
    const r = Math.hypot(startPoint[0] - cx, startPoint[1] - cy);
    return [cx + r * Math.cos(theta), cy + r * Math.sin(theta)] as [number, number];
  };
  const closestTGeneral = (evaluator: (t: number) => [number, number], p: [number, number]) => {
    // Coarse scan then Newton refinement on distance^2
    let bestT = 0, bestD = Infinity;
    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      const q = evaluator(t);
      const d = dist2([q[0], q[1]], p);
      if (d < bestD) { bestD = d; bestT = t; }
    }
    const f = (t: number) => {
      const q = evaluator(t);
      return dist2([q[0], q[1]], p);
    };
    const deriv = (g: (t: number) => number, t: number, h = 1e-4) => (g(t + h) - g(t - h)) / (2 * h);
    for (let k = 0; k < 10; k++) {
      const df = deriv(f, bestT);
      const d2 = deriv((tt) => deriv(f, tt), bestT);
      if (Math.abs(d2) < 1e-8) break;
      bestT -= df / d2;
      if (!isFinite(bestT)) { bestT = 0; break; }
      if (bestT < 0) bestT = 0; if (bestT > 1) bestT = 1;
    }
    return bestT;
  };

  const buildInspect = (seg: any, clickModel: [number, number]) => {
    const type = seg.shape_type;
    const pts = seg.points as number[][];
    let t = 0, pt: [number, number] = [0, 0];
    if (type === 'lineto') {
      t = closestTOnLine(pts, clickModel);
      pt = evalLine(pts, t);
    } else if (type === 'splineto') {
      const entry = splineMap.get(seg.id);
      if (entry && entry.kind === 'cubic') {
        t = closestTGeneral((tt) => (entry.spline as CubicSpline).evaluate(tt) as [number, number], clickModel);
        const e = (entry.spline as CubicSpline).evaluate(t) as number[];
        pt = [e[0], e[1]];
      } else {
        t = 0; pt = pts[0] as any;
      }
    } else if (type === 'qsplineto') {
      const entry = splineMap.get(seg.id);
      if (entry && entry.kind === 'quad') {
        t = closestTGeneral((tt) => (entry.spline as QuadraticSpline).evaluate(tt) as [number, number], clickModel);
        const e = (entry.spline as QuadraticSpline).evaluate(t) as number[];
        pt = [e[0], e[1]];
      } else {
        t = 0; pt = pts[0] as any;
      }
    } else if (type === 'arcto1') {
      const [startPoint, _endPoint, centerPoint] = pts as [number[], number[], number[]];
      const cx = centerPoint[0], cy = centerPoint[1];
      const startA = Math.atan2(startPoint[1] - cy, startPoint[0] - cx);
      const ang = Math.atan2(clickModel[1] - cy, clickModel[0] - cx);
      const dir = seg.sweep_flag ? 1 : -1;
      const sweep = (seg.sweep_angle || 0) * dir;
      let delta = ang - startA;
      // normalize to direction
      while (delta * dir < 0) delta += 2 * Math.PI * dir;
      const unclamped = delta / sweep;
      t = Math.max(0, Math.min(1, unclamped));
      pt = evalArc(seg, t);
    } else {
      // default fallbacks
      t = 0; pt = (pts?.[0] as any) || [0, 0];
    }
    const info: Record<string, any> = {
      name: seg.name,
      type,
      trace: Array.isArray(seg.trace) ? `${seg.trace[0]}:${seg.trace[1]}` : (seg.trace?.file ? `${seg.trace.file}:${seg.trace.line}` : undefined)
    };
    if (type === 'arcto1') {
      const [startPoint, _endPoint, centerPoint] = pts as [number[], number[], number[]];
      const radius = Math.hypot(startPoint[0] - centerPoint[0], startPoint[1] - centerPoint[1]);
      info.radius = +radius.toFixed(3);
      info.center = centerPoint;
      info.sweep_angle = seg.sweep_angle;
      info.sweep_flag = seg.sweep_flag;
    }
    if (type === 'splineto') {
      info.control1 = pts[1];
      info.control2 = pts[2];
    }
    if (type === 'qsplineto') {
      info.control = pts[1];
    }
    return { segId: seg.id, t: +t.toFixed(3), point: [ +pt[0].toFixed(3), +pt[1].toFixed(3) ] as [number, number], info } as Inspect;
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-shrink-0 flex items-center gap-2 px-2 py-1 bg-gray-800 border-b border-gray-700 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-gray-300">Path:</span>
          <select
            className="bg-gray-700 text-gray-100 px-2 py-1 rounded"
            value={activePathId || ''}
            onChange={(e) => setSelectedPathId(e.target.value)}
          >
            {pathsList.map((pid: string) => (
              <option key={pid} value={pid}>{pid}</option>
            ))}
          </select>
        </label>
        <label className="ml-4 flex items-center gap-2">
          <input type="checkbox" className="accent-blue-500" checked={!!showConstruction} onChange={(e) => setShowConstruction(e.target.checked)} />
          <span className="text-gray-300">Construction</span>
        </label>
        {githubLink ? (
          <a href={githubLink} target="_blank" rel="noreferrer" className="ml-auto text-blue-400 hover:text-blue-300 underline">View on GitHub</a>
        ) : (
          <span className="ml-auto text-gray-400">Selected: {selectedSegIds.length}</span>
        )}
        <button onClick={downloadSvg} className="ml-2 bg-gray-700 hover:bg-gray-600 text-xs text-white px-2 py-1 rounded">Save SVG</button>
        <button onClick={downloadPng} className="ml-1 bg-gray-700 hover:bg-gray-600 text-xs text-white px-2 py-1 rounded">Save PNG</button>
        <button onClick={() => setInspectGrip(undefined)} className="ml-1 bg-gray-700 hover:bg-gray-600 text-xs text-white px-2 py-1 rounded">Clear</button>
      </div>
      <div className="flex-grow min-h-0 overflow-auto bg-gray-100">
        <div className="relative w-full h-full">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          className="mx-auto block touch-none"
          xmlns="http://www.w3.org/2000/svg"
          
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endPan}
          onMouseLeave={endPan}
        >
          <g ref={groupRef} transform={matrix ? `matrix(${matrix.join(',')})` : undefined}>
            {/* Background frame */}
            <rect x={bounds.minX} y={bounds.minY} width={bounds.maxX - bounds.minX} height={bounds.maxY - bounds.minY} fill="#f7f7f7" />
            {/* Grid: minor lines */}
            {grid.minorXs.map((x) => (
              <line key={`gx-m-${x}`} x1={x} y1={bounds.minY} x2={x} y2={bounds.maxY} stroke="#cfd8dc" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {grid.minorYs.map((y) => (
              <line key={`gy-m-${y}`} x1={bounds.minX} y1={y} x2={bounds.maxX} y2={y} stroke="#cfd8dc" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            ))}
            {/* Grid: major lines */}
            {grid.majorXs.map((x) => (
              <line key={`gx-${x}`} x1={x} y1={bounds.minY} x2={x} y2={bounds.maxY} stroke="#90a4ae" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            ))}
            {grid.majorYs.map((y) => (
              <line key={`gy-${y}`} x1={bounds.minX} y1={y} x2={bounds.maxX} y2={y} stroke="#90a4ae" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            ))}
            {/* Axes */}
            <line x1={bounds.minX} y1={0} x2={bounds.maxX} y2={0} stroke="#283593" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={bounds.minY} x2={0} y2={bounds.maxY} stroke="#283593" strokeWidth={2} vectorEffect="non-scaling-stroke" />

            {/* Debug: transformed bounds box */}
            <rect x={bounds.minX} y={bounds.minY} width={bounds.maxX - bounds.minX} height={bounds.maxY - bounds.minY} fill="none" stroke="#e53935" strokeWidth={1} vectorEffect="non-scaling-stroke" />

            {/* In-SVG axis labels near bounds with inverse scaling for constant screen size */}
            {(() => {
              const svgW = svgRef.current?.clientWidth || 600;
              const svgH = svgRef.current?.clientHeight || 600;
              const sxView = svgW / (vb.w || 1);
              const syView = svgH / (vb.h || 1);
              const [a, b, c, d] = matrix || [1, 0, 0, 1];
              const gScaleX = Math.hypot(a || 1, b || 0);
              const gScaleY = Math.hypot(c || 0, d || 1);
              const pxPerModel = ((sxView * gScaleX) + (syView * gScaleY)) / 2;
              const fontPx = 16;
              const offsetPx = 10;
              const invScaleX = 1 / (gScaleX || 1);
              const invScaleY = -1 / (gScaleY || 1); // flip Y upright
              const offsetModel = offsetPx / (pxPerModel || 1);
              return (
                <>
                  {grid.majorXs.map((x) => (
                    <g key={`lbl-x-b-${x}`} transform={`translate(${x}, ${bounds.maxY + offsetModel}) scale(${invScaleX}, ${invScaleY})`}>
                      <text fontSize={fontPx} textAnchor="middle" fill="#101010">{x}</text>
                    </g>
                  ))}
                  {grid.majorXs.map((x) => (
                    <g key={`lbl-x-t-${x}`} transform={`translate(${x}, ${bounds.minY - offsetModel}) scale(${invScaleX}, ${invScaleY})`}>
                      <text fontSize={fontPx} textAnchor="middle" fill="#101010">{x}</text>
                    </g>
                  ))}
                  {grid.majorYs.map((y) => (
                    <g key={`lbl-y-l-${y}`} transform={`translate(${bounds.minX - offsetModel}, ${y}) scale(${invScaleX}, ${invScaleY})`}>
                      <text fontSize={fontPx} textAnchor="end" alignmentBaseline="middle" fill="#101010">{y}</text>
                    </g>
                  ))}
                  {grid.majorYs.map((y) => (
                    <g key={`lbl-y-r-${y}`} transform={`translate(${bounds.maxX + offsetModel}, ${y}) scale(${invScaleX}, ${invScaleY})`}>
                      <text fontSize={fontPx} textAnchor="start" alignmentBaseline="middle" fill="#101010">{y}</text>
                    </g>
                  ))}
                </>
              );
            })()}

            {segments.map((seg: any) => {
              // Hide construction if requested
              const isConstruction = seg.css_clazz === 'construction' || seg.shape_css_clazz === 'construction';
              if (isConstruction && !showConstruction) return null;
              const isSelected = selectedSegIds.includes(seg.id);
              const stroke = isSelected ? 'green' : (isConstruction ? '#1e88e5' : '#37474f');
              const strokeWidth = isSelected ? 3 : (isConstruction ? 2 : 2);
              return (
                <path
                  key={seg.id}
                  id={seg.id}
                  d={seg.path}
                  className={`segment ${seg.css_clazz || 'path'}`}
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  fill={'none'}
                  vectorEffect="non-scaling-stroke"
                  onClick={(e) => handleSegmentClick(seg.id, e)}
                />
              );
            })}

            {/* Overlay controls and dots for inspected segment */}
            {inspectRef.current && (() => {
              const seg = (segments as any[]).find(s => s.id === inspectRef.current!.segId);
              if (!seg) return null;
              const type = seg.shape_type;
              const pts = seg.points as number[][];
              const elements: any[] = [];
              // Compute px-per-model for constant-size dashes/markers
              const svgW = svgRef.current?.clientWidth || 600;
              const svgH = svgRef.current?.clientHeight || 600;
              const sx = svgW / (vb.w || 1);
              const sy = svgH / (vb.h || 1);
              const [a, b, c, d] = matrix || [1, 0, 0, 1];
              const gScaleX = Math.hypot(a || 1, b || 0);
              const gScaleY = Math.hypot(c || 0, d || 1);
              const pxPerModel = ((sx * gScaleX) + (sy * gScaleY)) / 2;
              const dashModel = 6 / (pxPerModel || 1);
              const gapModel = 4 / (pxPerModel || 1);
              const markerR = 3 / (pxPerModel || 1);
              if (type === 'arcto1') {
                const [_startPoint, _endPoint, centerPoint] = pts as [number[], number[], number[]];
                elements.push(
                  <line key="arc-c1" x1={centerPoint[0]} y1={centerPoint[1]} x2={inspectRef.current!.point[0]} y2={inspectRef.current!.point[1]} stroke="blue" strokeDasharray={`${dashModel},${gapModel}`} strokeWidth={2} vectorEffect="non-scaling-stroke" />
                );
                elements.push(<circle key="arc-c" cx={centerPoint[0]} cy={centerPoint[1]} r={markerR} fill="blue" />);
                elements.push(<circle key="arc-p" cx={inspectRef.current!.point[0]} cy={inspectRef.current!.point[1]} r={markerR} fill="yellow" />);
              } else if (type === 'splineto') {
                const [p0, c1, c2, p3] = pts as [number[], number[], number[], number[]];
                elements.push(<line key="c1" x1={p0[0]} y1={p0[1]} x2={c1[0]} y2={c1[1]} stroke="blue" strokeDasharray={`${dashModel},${gapModel}`} strokeWidth={2} vectorEffect="non-scaling-stroke" />);
                elements.push(<line key="c2" x1={p3[0]} y1={p3[1]} x2={c2[0]} y2={c2[1]} stroke="blue" strokeDasharray={`${dashModel},${gapModel}`} strokeWidth={2} vectorEffect="non-scaling-stroke" />);
                elements.push(<circle key="p" cx={inspectRef.current!.point[0]} cy={inspectRef.current!.point[1]} r={markerR} fill="yellow" />);
                elements.push(<circle key="c1p" cx={c1[0]} cy={c1[1]} r={markerR} fill="blue" />);
                elements.push(<circle key="c2p" cx={c2[0]} cy={c2[1]} r={markerR} fill="blue" />);
              } else if (type === 'qsplineto') {
                const [p0, c, p2] = pts as [number[], number[], number[]];
                elements.push(<line key="c" x1={p0[0]} y1={p0[1]} x2={c[0]} y2={c[1]} stroke="blue" strokeDasharray={`${dashModel},${gapModel}`} strokeWidth={2} vectorEffect="non-scaling-stroke" />);
                elements.push(<line key="c2" x1={p2[0]} y1={p2[1]} x2={c[0]} y2={c[1]} stroke="blue" strokeDasharray={`${dashModel},${gapModel}`} strokeWidth={2} vectorEffect="non-scaling-stroke" />);
                elements.push(<circle key="p" cx={inspectRef.current!.point[0]} cy={inspectRef.current!.point[1]} r={markerR} fill="yellow" />);
                elements.push(<circle key="cp" cx={c[0]} cy={c[1]} r={markerR} fill="blue" />);
              } else if (type === 'lineto') {
                elements.push(<circle key="p" cx={inspectRef.current!.point[0]} cy={inspectRef.current!.point[1]} r={markerR} fill="yellow" />);
              }
              return elements;
            })()}
          </g>
          
        </svg>
        {/* Info panel */}
        <div className="absolute bottom-2 right-2 bg-white/90 text-gray-900 text-xs p-2 rounded shadow max-w-sm">
          {(inspectGrip || inspectRef.current) ? (
            <div>
              <div><b>name</b>: {(inspectGrip as any)?.info?.name ?? (inspectRef.current as any)?.info?.name ?? '—'}</div>
              <div><b>type</b>: {(inspectGrip as any)?.info?.type ?? (inspectRef.current as any)?.info?.type ?? '—'}</div>
              <div><b>Point</b>: {(() => { const p = (inspectGrip as any)?.point ?? (inspectRef.current as any)?.point; return p ? `(${p[0].toFixed(3)}, ${p[1].toFixed(3)})` : '—'; })()}</div>
              <div><b>Parameter t</b>: {((inspectGrip as any)?.t ?? (inspectRef.current as any)?.t ?? '—')}</div>
              {(((inspectGrip as any)?.info?.trace) ?? (inspectRef.current as any)?.info?.trace) && <div><b>call site</b>: {((inspectGrip as any)?.info?.trace) ?? (inspectRef.current as any)?.info?.trace}</div>}
              {(((inspectGrip as any)?.info?.radius) ?? (inspectRef.current as any)?.info?.radius) && <div><b>radius</b>: {((inspectGrip as any)?.info?.radius) ?? (inspectRef.current as any)?.info?.radius}</div>}
              {(((inspectGrip as any)?.info?.center) ?? (inspectRef.current as any)?.info?.center) && <div><b>center</b>: {(() => { const c = ((inspectGrip as any)?.info?.center) ?? (inspectRef.current as any)?.info?.center; return `(${(+c[0]).toFixed(3)}, ${(+c[1]).toFixed(3)})`; })()}</div>}
            </div>
          ) : (
            <div className="text-gray-600">Click a segment to inspect</div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}


