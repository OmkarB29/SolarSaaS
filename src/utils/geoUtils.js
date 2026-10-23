/**
 * Geospatial utilities for rooftop polygons and solar panels
 */

/**
 * Fast Ray-casting algorithm to test if a [lat, lng] point is inside a polygon
 * @param {[number, number]} point [latitude, longitude]
 * @param {Array<[number, number]>} vs Array of [lat, lng] polygon vertices
 * @returns {boolean}
 */
export const isPointInPolygon = (point, vs) => {
  if (!vs || vs.length < 3) return false;
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export default {
  isPointInPolygon,
};
