import { vec2 } from 'gl-matrix';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error external package types resolution via exports may fail in Vite; dts exists in dist
import { getExtents, type Point } from 'bezier-spline-eval';

const TWO_PI = Math.PI * 2;

/**
 * Calculates the bounding box (extents) of a 2D circular arc.
 *
 * @param startAngle The starting angle of the arc in radians.
 * @param sweepAngle The angle of the arc in radians (can be positive or negative).
 * @param radius The radius of the arc.
 * @param center The [x, y] center point of the arc.
 * @returns A tuple containing the min and max points `[minPoint, maxPoint]`, or null.
 */
export function getArcExtents(
    startAngle: number,
    sweepAngle: number,
    radius: number,
    center: Point
): [Point, Point] | null {
    if (center.length !== 2) {
        throw new Error('Arc center must be a 2D point.');
    }
    if (radius < 0) {
        throw new Error('Radius cannot be negative.');
    }

    const points: Point[] = [];

    // Helper to evaluate a point on the arc
    const evaluate = (t: number): Point => {
        const angle = startAngle + t * sweepAngle;
        const x = center[0] + radius * Math.cos(angle);
        const y = center[1] + radius * Math.sin(angle);
        return [x, y];
    };

    points.push(evaluate(0)); // Start point
    points.push(evaluate(1)); // End point

    const endAngle = startAngle + sweepAngle;

    // The four cardinal angles (0, 90, 180, 270 degrees) that represent the axes
    for (let i = 0; i < 4; i++) {
        const cardinalAngle = (i * Math.PI) / 2;

        // Logic to determine if the cardinal angle falls within the arc's sweep
        let angle = cardinalAngle;
        if (sweepAngle > 0) {
            // For positive sweep, if the angle is less than the start,
            // add 2*PI until it's greater to correctly check the range.
            while (angle < startAngle) {
                angle += TWO_PI;
            }
        } else { // Negative sweep
            // For negative sweep, if the angle is greater than the start,
            // subtract 2*PI until it's smaller.
             while (angle > startAngle) {
                angle -= TWO_PI;
            }
        }

        const isBetween = sweepAngle > 0
            ? angle < endAngle
            : angle > endAngle;

        if (isBetween) {
            const x = center[0] + radius * Math.cos(cardinalAngle);
            const y = center[1] + radius * Math.sin(cardinalAngle);
            points.push([x, y]);
        }
    }

    return getExtents(points);
}


/**
 * Calculates the bounding box (extents) of a 2D circular arc from a start point.
 *
 * @param startPoint The [x, y] starting point of the arc.
 * @param sweepAngle The angle of the arc in radians (can be positive or negative).
 * @param radius The radius of the arc.
 * @param center The [x, y] center point of the arc.
 * @returns A tuple containing the min and max points `[minPoint, maxPoint]`, or null.
 */
export function getArcExtentsFromStartPoint(
    startPoint: Point,
    sweepAngle: number,
    radius: number,
    center: Point
): [Point, Point] | null {
    if (startPoint.length !== 2 || center.length !== 2) {
        throw new Error('Points must be 2D for angle calculation.');
    }
    const relativePoint = vec2.subtract(vec2.create(), startPoint, center);
    const startAngle = Math.atan2(relativePoint[1], relativePoint[0]);

    return getArcExtents(startAngle, sweepAngle, radius, center);
}

