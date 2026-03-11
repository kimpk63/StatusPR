// helpers for rendering and serializing drawings

export function drawCircle(ctx, x, y, radius, color) {
  ctx.strokeStyle = color || 'red';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.stroke();
}

export function drawRect(ctx, x, y, width, height, color) {
  ctx.strokeStyle = color || 'red';
  ctx.strokeRect(x, y, width, height);
}

export function drawArrow(ctx, x1, y1, x2, y2, color) {
  const headlen = 10;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  ctx.strokeStyle = color || 'red';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headlen * Math.cos(angle - Math.PI / 6),
    y2 - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headlen * Math.cos(angle + Math.PI / 6),
    y2 - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.lineTo(x2, y2);
  ctx.fillStyle = color || 'red';
  ctx.fill();
}

export function drawFreehand(ctx, points, color, width) {
  if (!points || points.length === 0) return;
  ctx.strokeStyle = color || 'red';
  ctx.lineWidth = width || 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

export function drawText(ctx, x, y, text, color, fontSize = 16) {
  ctx.fillStyle = color || 'red';
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillText(text, x, y);
}

// utility to serialize a drawing object to a JSON string (for storage)
export function serializeDrawing(d) {
  return JSON.stringify(d);
}

export function deserializeDrawing(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
