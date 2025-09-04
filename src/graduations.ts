export type Matrix = [number, number, number, number, number, number];

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };
export type ViewBox = { x: number; y: number; w: number; h: number };

export type GridParams = {
  bounds: Bounds;
  viewBox: ViewBox;
  svgWidth: number;
  svgHeight: number;
  matrix?: Matrix; // model -> post-transform
  minPx?: number; // default 60
  maxPx?: number; // default 140
};

export type GridResult = {
  stepModel: number;
  minorStepModel: number;
  majorXs: number[];
  majorYs: number[];
  minorXs: number[];
  minorYs: number[];
};

function applyInverseMatrix(matrix: Matrix | undefined, x: number, y: number) {
  if (!matrix) return { x, y } as const;
  const [a, b, c, d, e, f] = matrix;
  const det = a * d - b * c || 1;
  const ia = d / det;
  const ib = -b / det;
  const ic = -c / det;
  const id = a / det;
  const ie = (c * f - d * e) / det;
  const ifv = (b * e - a * f) / det;
  return { x: ia * x + ic * y + ie, y: ib * x + id * y + ifv } as const;
}

function chooseStep(pxPerModel: number, minPx: number, maxPx: number) {
  const desired = Math.max(1e-9, minPx / Math.max(1e-9, pxPerModel));
  const pow10 = (k: number) => Math.pow(10, k);
  let e = Math.floor(Math.log10(desired));
  const level = (k: number) => [1 * pow10(k), 5 * pow10(k), 1 * pow10(k + 1)];
  let candidates = level(e);
  let step = candidates.find((s) => s >= desired) ?? candidates[candidates.length - 1];
  let px = step * pxPerModel;
  // If spacing too wide, step down
  while (px > maxPx) {
    e -= 1;
    step = 5 * pow10(e);
    px = step * pxPerModel;
    if (px > maxPx) {
      step = 1 * pow10(e);
      px = step * pxPerModel;
    }
    if (e < -24) break;
  }
  return step;
}

function rangeClamped(from: number, to: number, by: number): number[] {
  const start = Math.ceil(from / by) * by;
  const out: number[] = [];
  for (let v = start; v <= to + 1e-9; v += by) out.push(+v.toFixed(10));
  return out;
}

export function computeGraduations(params: GridParams): GridResult {
  const {
    bounds,
    viewBox,
    svgWidth,
    svgHeight,
    matrix,
    minPx = 60,
    maxPx = 140,
  } = params;

  // Model->post scales
  const [a, b, c, d] = matrix || [1, 0, 0, 1, 0, 0];
  const gScaleX = Math.hypot(a || 1, b || 0);
  const gScaleY = Math.hypot(c || 0, d || 1);

  const pxPerPostX = (svgWidth || 1) / Math.max(1e-9, viewBox.w || 1);
  const pxPerPostY = (svgHeight || 1) / Math.max(1e-9, viewBox.h || 1);
  const pxPerModelX = pxPerPostX * (gScaleX || 1);
  const pxPerModelY = pxPerPostY * (gScaleY || 1);
  const pxPerModel = (pxPerModelX + pxPerModelY) / 2;

  const stepModel = chooseStep(pxPerModel, minPx, maxPx);
  const minorStepModel = stepModel / 5;
  const minorPx = minorStepModel * pxPerModel;
  const includeMinor = minorPx >= 8; // avoid overly dense minor grid

  // IMPORTANT: Tick positions are defined purely in model space by bounds,
  // viewBox is only used to select scale (pxPerModel). This ensures stable
  // tick alignment (e.g., 0 included) regardless of panning rounding.
  const fromX = bounds.minX;
  const toX = bounds.maxX;
  const fromY = bounds.minY;
  const toY = bounds.maxY;

  const majorXs = rangeClamped(fromX, toX, stepModel);
  const majorYs = rangeClamped(fromY, toY, stepModel);
  const minorXs = includeMinor ? rangeClamped(fromX, toX, minorStepModel) : [];
  const minorYs = includeMinor ? rangeClamped(fromY, toY, minorStepModel) : [];

  return { stepModel, minorStepModel, majorXs, majorYs, minorXs, minorYs };
}

// --- Labels (decimated to avoid collisions) ---

export type Label = { value: number; model: number; px: number; text: string; halfWidthPx: number };

export type LabelParams = {
  majors: { xs: number[]; ys: number[] };
  viewBox: ViewBox;
  svgWidth: number;
  svgHeight: number;
  matrix?: Matrix;
  minLabelPx?: number; // minimal padding between labels (default 80)
  stepHint?: number; // step in model units (for decimals)
  fontPx?: number; // font pixel size (default 16)
};

function applyMatrix(matrix: Matrix | undefined, x: number, y: number) {
  if (!matrix) return { x, y } as const;
  const [a, b, c, d, e, f] = matrix;
  return { x: a * x + c * y + e, y: b * x + d * y + f } as const;
}

export function computeLabels(params: LabelParams): { x: Label[]; y: Label[] } {
  const { majors, viewBox, svgWidth, svgHeight, matrix, minLabelPx = 80, stepHint = 1, fontPx = 16 } = params;
  const toPxX = (x: number) => {
    const post = applyMatrix(matrix, x, 0);
    return (post.x - viewBox.x) * (svgWidth / Math.max(1e-9, viewBox.w || 1));
  };
  const toPxY = (y: number) => {
    const post = applyMatrix(matrix, 0, y);
    return (post.y - viewBox.y) * (svgHeight / Math.max(1e-9, viewBox.h || 1));
  };
  const requiredDecimals = (step: number) => {
    let dec = 0;
    let s = step;
    while (dec < 6 && Math.abs(Math.round(s) - s) > 1e-8) {
      dec += 1;
      s = step * Math.pow(10, dec);
    }
    return dec;
  };
  const decimals = requiredDecimals(Math.max(1e-9, Math.abs(stepHint)));
  const format = (v: number) => {
    const s = v.toFixed(decimals);
    return s.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  };
  const estimateWidthPx = (text: string) => text.length * fontPx * 0.6;

  const decimateX = (vals: number[]): Label[] => {
    const out: Label[] = [];
    let lastRight = -Infinity;
    for (const v of vals) {
      const px = toPxX(v);
      if (!isFinite(px)) continue;
      const text = format(v);
      const w = estimateWidthPx(text);
      const left = px - w / 2;
      const right = px + w / 2;
      if (left - lastRight >= minLabelPx) {
        out.push({ value: v, model: v, px, text, halfWidthPx: w / 2 });
        lastRight = right;
      }
    }
    return out;
  };
  const decimateY = (vals: number[]): Label[] => {
    const vStep = Math.max(fontPx, minLabelPx); // baseline gap in pixels
    const pairs = vals
      .map((v) => ({ v, px: toPxY(v) }))
      .filter((p) => isFinite(p.px))
      .sort((a, b) => a.px - b.px); // ensure ascending pixel order regardless of axis direction
    const out: Label[] = [];
    let last = -Infinity;
    for (const { v, px } of pairs) {
      if (px - last >= vStep) {
        const text = format(v);
        out.push({ value: v, model: v, px, text, halfWidthPx: estimateWidthPx(text) / 2 });
        last = px;
      }
    }
    return out;
  };
  return {
    x: decimateX(majors.xs),
    y: decimateY(majors.ys),
  };
}


