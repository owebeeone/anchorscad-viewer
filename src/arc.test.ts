import { describe, it, expect } from 'vitest';
import { getArcExtents, getArcExtentsFromStartPoint } from './arc';

const PI = Math.PI;

describe('getArcExtents', () => {
    it('should calculate extents for an arc within one quadrant', () => {
        const extents = getArcExtents(PI / 6, PI / 3, 5, [10, 10]); // 30 to 90 degrees
        expect(extents).not.toBeNull();
        const [min, max] = extents!;

        expect(min[0]).toBeCloseTo(10); // Min x is at 90 deg
        expect(min[1]).toBeCloseTo(10 + 5 * Math.sin(PI / 6)); // Min y is at 30 deg
        expect(max[0]).toBeCloseTo(10 + 5 * Math.cos(PI / 6)); // Max x is at 30 deg
        expect(max[1]).toBeCloseTo(15); // Max y is at 90 deg
    });

    it('should calculate extents for a quarter arc (90°) CCW from 0 degrees', () => {
        const extents = getArcExtents(0, PI / 2, 10, [0, 0]); // 0 to 90 degrees
        expect(extents).not.toBeNull();
        const [min, max] = extents!;

        expect(min[0]).toBeCloseTo(0);
        expect(min[1]).toBeCloseTo(0);
        expect(max[0]).toBeCloseTo(10);
        expect(max[1]).toBeCloseTo(10);
    });

    it('should calculate extents for a quarter arc (90°) CW from 90 degrees', () => {
        const extents = getArcExtents(PI / 2, -PI / 2, 10, [0, 0]); // 90 to 0 degrees
        expect(extents).not.toBeNull();
        const [min, max] = extents!;

        expect(min[0]).toBeCloseTo(0);
        expect(min[1]).toBeCloseTo(0);
        expect(max[0]).toBeCloseTo(10);
        expect(max[1]).toBeCloseTo(10);
    });

    it('should calculate extents for an arc crossing one axis', () => {
        const extents = getArcExtents(PI / 4, PI, 5, [10, 10]); // 45 to 225 degrees
        expect(extents).not.toBeNull();
        const [min, max] = extents!;

        // Crosses 90 (max Y) and 180 (min X) degrees
        const minX = 5;
        const maxY = 15;
        const startX = 10 + 5 * Math.cos(PI / 4);
        const endY = 10 + 5 * Math.sin(5 * PI / 4);

        expect(min[0]).toBeCloseTo(minX);
        expect(min[1]).toBeCloseTo(endY);
        expect(max[0]).toBeCloseTo(startX);
        expect(max[1]).toBeCloseTo(maxY);
    });

    it('should include only cardinal points crossed by the sweep', () => {
        const r = 3;
        const extents = getArcExtents(PI * 0.75, PI, r, [5, 5]); // 135° to 315°
        expect(extents).not.toBeNull();
        const [min, max] = extents!;

        // Sweep 135°->315° crosses 180° (min X) and 270° (min Y), but not 0° or 90°.
        expect(min[0]).toBeCloseTo(2); // 5 - 3 at 180 deg
        expect(min[1]).toBeCloseTo(2); // 5 - 3 at 270 deg
        expect(max[0]).toBeCloseTo(5 + r * Math.SQRT1_2); // at 135 deg or 315 deg
        expect(max[1]).toBeCloseTo(5 + r * Math.SQRT1_2); // at 135 deg
    });
    
    it('should calculate extents for a full circle', () => {
        const extents = getArcExtents(0, 2 * PI, 5, [10, 10]);
        expect(extents).not.toBeNull();
        const [min, max] = extents!;
        
        expect(min[0]).toBeCloseTo(5);
        expect(min[1]).toBeCloseTo(5);
        expect(max[0]).toBeCloseTo(15);
        expect(max[1]).toBeCloseTo(15);
    });
    
    it('should calculate extents for an arc with a negative sweep angle', () => {
        const extents = getArcExtents(PI / 2, -PI, 5, [10, 10]); // from 90 to -90 degrees
        expect(extents).not.toBeNull();
        const [min, max] = extents!;

        // Crosses 0 (max X) and ends at -90 (min Y). Does not cross 180.
        const minX = 10;
        const minY = 5;
        const maxX = 15;
        const maxY = 15;
        
        expect(min[0]).toBeCloseTo(minX);
        expect(min[1]).toBeCloseTo(minY);
        expect(max[0]).toBeCloseTo(maxX);
        expect(max[1]).toBeCloseTo(maxY);
    });
});

describe('getArcExtentsFromStartPoint', () => {
    it('should compute the correct start angle and extents', () => {
        const extents = getArcExtentsFromStartPoint([10, 0], PI, 10, [0, 0]);
        expect(extents).not.toBeNull();
        const [min, max] = extents!;

        // Crosses 90 degrees
        expect(min[0]).toBeCloseTo(-10); // min x at 180 deg
        expect(min[1]).toBeCloseTo(0);   // min y at 0/180 deg
        expect(max[0]).toBeCloseTo(10);  // max x at 0 deg
        expect(max[1]).toBeCloseTo(10);  // max y at 90 deg
    });

    it('should match the startAngle variant', () => {
        const center: [number, number] = [2, -1];
        const r = 4;
        const startAngle = PI / 3;
        const startPoint: [number, number] = [center[0] + r * Math.cos(startAngle), center[1] + r * Math.sin(startAngle)];
        const sweep = PI / 2;
        
        const extentsFromAngle = getArcExtents(startAngle, sweep, r, center)!;
        const extentsFromPoint = getArcExtentsFromStartPoint(startPoint, sweep, r, center)!;
        
        expect(extentsFromAngle).not.toBeNull();
        expect(extentsFromPoint).not.toBeNull();
        
        expect(extentsFromPoint[0][0]).toBeCloseTo(extentsFromAngle[0][0]);
        expect(extentsFromPoint[0][1]).toBeCloseTo(extentsFromAngle[0][1]);
        expect(extentsFromPoint[1][0]).toBeCloseTo(extentsFromAngle[1][0]);
        expect(extentsFromPoint[1][1]).toBeCloseTo(extentsFromAngle[1][1]);
    });
});

