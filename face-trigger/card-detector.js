export function isCardShape({ width, height, contourArea, frameArea }) {
  if (![width, height, contourArea, frameArea].every((value) => Number.isFinite(value) && value > 0)) {
    return false;
  }
  const ratio = Math.max(width, height) / Math.min(width, height);
  const areaRatio = contourArea / frameArea;
  const fillRatio = contourArea / (width * height);
  return ratio >= 1.15 && ratio <= 2.2 && areaRatio >= 0.008 && areaRatio <= 0.92 && fillRatio >= 0.65;
}

export function findCardInCanvas(canvas, cv) {
  const src = cv.imread(canvas);
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  let best;

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, 50, 150);
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    for (let index = 0; index < contours.size(); index += 1) {
      const contour = contours.get(index);
      const polygon = new cv.Mat();
      try {
        cv.approxPolyDP(contour, polygon, cv.arcLength(contour, true) * 0.03, true);
        if (polygon.rows !== 4 || !cv.isContourConvex(polygon)) continue;
        const rect = cv.minAreaRect(polygon);
        const contourArea = Math.abs(cv.contourArea(polygon));
        if (!isCardShape({
          width: rect.size.width,
          height: rect.size.height,
          contourArea,
          frameArea: canvas.width * canvas.height,
        })) continue;
        if (!best || contourArea > best.area) {
          const values = polygon.data32S;
          best = {
            area: contourArea,
            points: Array.from({ length: 4 }, (_, point) => ({
              x: values[point * 2],
              y: values[point * 2 + 1],
            })),
          };
        }
      } finally {
        polygon.delete();
        contour.delete();
      }
    }
    return best;
  } finally {
    src.delete();
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }
}
