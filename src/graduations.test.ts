import { describe, it, expect } from 'vitest';
import { computeGraduations, computeLabels } from './graduations';

describe('computeGraduations', () => {
  it('keeps major spacing within pixel bounds and clamps to bounds', () => {
    const res = computeGraduations({
      bounds: { minX: 0, minY: 0, maxX: 200, maxY: 200 },
      viewBox: { x: 0, y: 0, w: 200, h: 200 },
      svgWidth: 600,
      svgHeight: 600,
      matrix: [1, 0, 0, 1, 0, 0],
      minPx: 60,
      maxPx: 140,
    });
    expect(res.stepModel).toBeGreaterThan(0);
    // check grid values are within bounds
    expect(Math.min(...res.majorXs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...res.majorXs)).toBeLessThanOrEqual(200);
    expect(Math.min(...res.majorYs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...res.majorYs)).toBeLessThanOrEqual(200);
  });

  it('adapts with zoom (larger viewBox -> smaller px per model -> larger step)', () => {
    const a = computeGraduations({
      bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      viewBox: { x: 0, y: 0, w: 100, h: 100 },
      svgWidth: 600,
      svgHeight: 600,
      matrix: [1, 0, 0, 1, 0, 0],
    });
    const b = computeGraduations({
      bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      viewBox: { x: 0, y: 0, w: 300, h: 300 },
      svgWidth: 600,
      svgHeight: 600,
      matrix: [1, 0, 0, 1, 0, 0],
    });
    expect(b.stepModel).toBeGreaterThanOrEqual(a.stepModel);
  });

  it('includes zero tick when bounds include zero', () => {
    const res = computeGraduations({
      bounds: { minX: 0, minY: 0, maxX: 200, maxY: 200 },
      viewBox: { x: 50, y: 50, w: 100, h: 100 }, // panned/zoomed
      svgWidth: 600,
      svgHeight: 600,
      matrix: [1, 0, 0, 1, 0, 0],
    });
    expect(res.majorXs[0]).toBe(0);
    expect(res.majorYs[0]).toBe(0);
  });

  it('decimates labels to avoid collisions in pixel space', () => {
    const res = computeGraduations({
      bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
      viewBox: { x: 0, y: 0, w: 1000, h: 1000 },
      svgWidth: 600,
      svgHeight: 600,
      matrix: [1, 0, 0, 1, 0, 0],
      minPx: 40,
      maxPx: 60,
    });
    const labels = computeLabels({
      majors: { xs: res.majorXs, ys: res.majorYs },
      viewBox: { x: 0, y: 0, w: 1000, h: 1000 },
      svgWidth: 600,
      svgHeight: 600,
      matrix: [1, 0, 0, 1, 0, 0],
      minLabelPx: 80,
    });
    // Ensure labels are spaced at least 80px apart in x
    for (let i = 1; i < labels.x.length; i++) {
      expect(labels.x[i].px - labels.x[i - 1].px).toBeGreaterThanOrEqual(80 - 1e-6);
    }
  });
});


