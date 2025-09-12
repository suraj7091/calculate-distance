
// content.js - runs on all pages (as configured)
console.log('Distance measure content script loaded');

let measuringActive = false;
let firstElement = null;
let hoverOverlay = null;
let selectionOverlays = [];
let lineOverlay = null;
let labelOverlay = null;
let crosshairV = null;
let crosshairH = null;
let hLine = null;
let vLine = null;
let hLabel = null;
let vLabel = null;

function createOverlayElement(tagName, styles) {
  const element = document.createElement(tagName);
  Object.assign(element.style, styles);
  return element;
}

function ensureHoverOverlay() {
  if (hoverOverlay) return hoverOverlay;
  hoverOverlay = createOverlayElement('div', {
    position: 'fixed',
    pointerEvents: 'none',
    background: 'rgba(66, 133, 244, 0.15)',
    outline: '2px solid rgba(66, 133, 244, 0.9)',
    zIndex: '2147483647'
  });
  document.documentElement.appendChild(hoverOverlay);
  return hoverOverlay;
}

function addSelectionOverlay(rect, color) {
  const overlay = createOverlayElement('div', {
    position: 'fixed',
    left: rect.left + 'px',
    top: rect.top + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
    pointerEvents: 'none',
    outline: `2px solid ${color}`,
    background: 'transparent',
    zIndex: '2147483647'
  });
  document.documentElement.appendChild(overlay);
  selectionOverlays.push(overlay);
}

function ensureLineOverlay() {
  if (lineOverlay) return lineOverlay;
  lineOverlay = createOverlayElement('div', {
    position: 'fixed',
    height: '2px',
    background: 'rgba(234,67,53,0.95)',
    transformOrigin: '0 0',
    zIndex: '2147483647',
    pointerEvents: 'none'
  });
  document.documentElement.appendChild(lineOverlay);
  return lineOverlay;
}

function ensureLabelOverlay() {
  if (labelOverlay) return labelOverlay;
  labelOverlay = createOverlayElement('div', {
    position: 'fixed',
    padding: '4px 6px',
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    fontSize: '12px',
    borderRadius: '4px',
    transform: 'translate(-50%, -120%)',
    zIndex: '2147483647',
    pointerEvents: 'none',
    whiteSpace: 'nowrap'
  });
  document.documentElement.appendChild(labelOverlay);
  return labelOverlay;
}

function ensureCrosshairs() {
  if (!crosshairV) {
    crosshairV = createOverlayElement('div', {
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: '1px',
      height: '14px',
      background: 'rgba(0,0,0,0.55)',
      zIndex: '2147483647',
      pointerEvents: 'none'
    });
    document.documentElement.appendChild(crosshairV);
  }
  if (!crosshairH) {
    crosshairH = createOverlayElement('div', {
      position: 'fixed',
      top: '0px',
      left: '0px',
      width: '14px',
      height: '1px',
      background: 'rgba(0,0,0,0.55)',
      zIndex: '2147483647',
      pointerEvents: 'none'
    });
    document.documentElement.appendChild(crosshairH);
  }
}

function ensureOrthogonalOverlays() {
  if (!hLine) {
    hLine = createOverlayElement('div', {
      position: 'fixed',
      height: '2px',
      background: 'rgba(234,67,53,0.95)',
      zIndex: '2147483647',
      pointerEvents: 'none'
    });
    document.documentElement.appendChild(hLine);
  }
  if (!vLine) {
    vLine = createOverlayElement('div', {
      position: 'fixed',
      width: '2px',
      background: 'rgba(52,168,83,0.95)',
      zIndex: '2147483647',
      pointerEvents: 'none'
    });
    document.documentElement.appendChild(vLine);
  }
  if (!hLabel) {
    hLabel = createOverlayElement('div', {
      position: 'fixed',
      padding: '2px 5px',
      background: 'rgba(0,0,0,0.8)',
      color: '#fff',
      fontSize: '12px',
      borderRadius: '3px',
      zIndex: '2147483647',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      transform: 'translate(6px, -50%)'
    });
    document.documentElement.appendChild(hLabel);
  }
  if (!vLabel) {
    vLabel = createOverlayElement('div', {
      position: 'fixed',
      padding: '2px 5px',
      background: 'rgba(0,0,0,0.8)',
      color: '#fff',
      fontSize: '12px',
      borderRadius: '3px',
      zIndex: '2147483647',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      transform: 'translate(-50%, 6px)'
    });
    document.documentElement.appendChild(vLabel);
  }
}

function getElementRect(element) {
  const r = element.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
}

function centerOf(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function overlapInterval(aStart, aEnd, bStart, bEnd) {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return { start, end, overlaps: start <= end };
}

function getClosestPointsBetweenRects(r1, r2) {
  let x1, x2;
  if (r1.right < r2.left) {
    x1 = r1.right;
    x2 = r2.left;
  } else if (r2.right < r1.left) {
    x1 = r1.left;
    x2 = r2.right;
  } else {
    const xOverlap = overlapInterval(r1.left, r1.right, r2.left, r2.right);
    const midX = (xOverlap.start + xOverlap.end) / 2;
    x1 = midX;
    x2 = midX;
  }

  let y1, y2;
  if (r1.bottom < r2.top) {
    y1 = r1.bottom;
    y2 = r2.top;
  } else if (r2.bottom < r1.top) {
    y1 = r1.top;
    y2 = r2.bottom;
  } else {
    const yOverlap = overlapInterval(r1.top, r1.bottom, r2.top, r2.bottom);
    const midY = (yOverlap.start + yOverlap.end) / 2;
    y1 = midY;
    y2 = midY;
  }

  const p1 = { x: x1, y: y1 };
  const p2 = { x: x2, y: y2 };
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return { p1, p2, distance };
}

function drawLine(p1, p2, label) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  const line = ensureLineOverlay();
  Object.assign(line.style, {
    left: p1.x + 'px',
    top: p1.y + 'px',
    width: length + 'px',
    transform: `rotate(${angle}deg)`
  });

  const labelEl = ensureLabelOverlay();
  labelEl.textContent = label;
  Object.assign(labelEl.style, {
    left: (p1.x + p2.x) / 2 + 'px',
    top: (p1.y + p2.y) / 2 + 'px'
  });
}

function drawHorizontalMeasurement(x1, x2, y) {
  const left = Math.min(x1, x2);
  const width = Math.abs(x2 - x1);
  if (width <= 0.5) return;
  const line = createOverlayElement('div', {
    position: 'fixed',
    left: left + 'px',
    top: y + 'px',
    width: width + 'px',
    height: '2px',
    background: 'rgba(234,67,53,0.95)',
    zIndex: '2147483647',
    pointerEvents: 'none'
  });
  const label = createOverlayElement('div', {
    position: 'fixed',
    left: x2 + 'px',
    top: y + 'px',
    padding: '2px 5px',
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    fontSize: '12px',
    borderRadius: '3px',
    transform: 'translate(6px, -50%)',
    zIndex: '2147483647',
    pointerEvents: 'none',
    whiteSpace: 'nowrap'
  });
  label.textContent = Math.round(width) + ' px';
  document.documentElement.appendChild(line);
  document.documentElement.appendChild(label);
  selectionOverlays.push(line, label);
}

function drawVerticalMeasurement(x, y1, y2) {
  const top = Math.min(y1, y2);
  const height = Math.abs(y2 - y1);
  if (height <= 0.5) return;
  const line = createOverlayElement('div', {
    position: 'fixed',
    left: x + 'px',
    top: top + 'px',
    width: '2px',
    height: height + 'px',
    background: 'rgba(52,168,83,0.95)',
    zIndex: '2147483647',
    pointerEvents: 'none'
  });
  const label = createOverlayElement('div', {
    position: 'fixed',
    left: x + 'px',
    top: y2 + 'px',
    padding: '2px 5px',
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    fontSize: '12px',
    borderRadius: '3px',
    transform: 'translate(-50%, 6px)',
    zIndex: '2147483647',
    pointerEvents: 'none',
    whiteSpace: 'nowrap'
  });
  label.textContent = Math.round(height) + ' px';
  document.documentElement.appendChild(line);
  document.documentElement.appendChild(label);
  selectionOverlays.push(line, label);
}

function clearOverlays() {
  if (hoverOverlay && hoverOverlay.parentNode) hoverOverlay.parentNode.removeChild(hoverOverlay);
  hoverOverlay = null;
  selectionOverlays.forEach(o => o.parentNode && o.parentNode.removeChild(o));
  selectionOverlays = [];
  if (lineOverlay && lineOverlay.parentNode) lineOverlay.parentNode.removeChild(lineOverlay);
  lineOverlay = null;
  if (labelOverlay && labelOverlay.parentNode) labelOverlay.parentNode.removeChild(labelOverlay);
  labelOverlay = null;
  if (crosshairV && crosshairV.parentNode) crosshairV.parentNode.removeChild(crosshairV);
  if (crosshairH && crosshairH.parentNode) crosshairH.parentNode.removeChild(crosshairH);
  crosshairV = null;
  crosshairH = null;
}

function updateHover(target) {
  if (!measuringActive) return;
  if (!(target instanceof Element)) return;
  const rect = getElementRect(target);
  const h = ensureHoverOverlay();
  Object.assign(h.style, {
    left: rect.left + 'px',
    top: rect.top + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px'
  });
}

function onClick(event) {
  if (!measuringActive) return;
  event.preventDefault();
  event.stopPropagation();
  const target = event.target;
  if (!(target instanceof Element)) return;
  const rect = getElementRect(target);

  if (!firstElement) {
    firstElement = target;
    addSelectionOverlay(rect, 'rgba(52,168,83,0.95)');
  } else {
    const firstRect = getElementRect(firstElement);
    addSelectionOverlay(rect, 'rgba(251,188,5,0.95)');
    const leftToRight = firstRect.right <= rect.left;
    const rightToLeft = rect.right <= firstRect.left;
    const vOverlap = overlapInterval(firstRect.top, firstRect.bottom, rect.top, rect.bottom);
    const yForH = vOverlap.overlaps ? (vOverlap.start + vOverlap.end) / 2 : Math.max(Math.min((firstRect.top + firstRect.bottom) / 2, rect.bottom), rect.top);
    if (leftToRight) {
      drawHorizontalMeasurement(firstRect.right, rect.left, yForH);
    } else if (rightToLeft) {
      drawHorizontalMeasurement(rect.right, firstRect.left, yForH);
    }

    const topToBottom = firstRect.bottom <= rect.top;
    const bottomToTop = rect.bottom <= firstRect.top;
    const hOverlap = overlapInterval(firstRect.left, firstRect.right, rect.left, rect.right);
    const xForV = hOverlap.overlaps ? (hOverlap.start + hOverlap.end) / 2 : Math.max(Math.min((firstRect.left + firstRect.right) / 2, rect.right), rect.left);
    if (topToBottom) {
      drawVerticalMeasurement(xForV, firstRect.bottom, rect.top);
    } else if (bottomToTop) {
      drawVerticalMeasurement(xForV, rect.bottom, firstRect.top);
    }

    // Allow multiple measurements; do not reset firstElement here.
  }
}

function onKeyDown(event) {
  if (!measuringActive) return;
  if (event.key === 'Escape') {
    stopMeasuring();
  }
}

function onGlobalKeyDown(event) {
  const key = (event.key || '').toLowerCase();
  const target = event.target;
  if (target && (target.isContentEditable || (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'))) return;
  if (key === 'r' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    if (measuringActive) {
      // Fully restart: remove listeners/overlays, then start fresh
      stopMeasuring();
      startMeasuring();
    } else {
      startMeasuring();
    }
  }
}

document.addEventListener('keydown', onGlobalKeyDown, true);
window.addEventListener('keydown', onGlobalKeyDown, true);

function startMeasuring() {
  if (measuringActive) return;
  measuringActive = true;
  firstElement = null;
  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
  ensureCrosshairs();
}

function stopMeasuring() {
  measuringActive = false;
  firstElement = null;
  document.removeEventListener('mousemove', onMouseMove, true);
  document.removeEventListener('click', onClick, true);
  document.removeEventListener('keydown', onKeyDown, true);
  clearOverlays();
}

function onMouseMove(event) {
  if (!measuringActive) return;
  const target = event.target;
  updateHover(target);
  ensureCrosshairs();
  const x = event.clientX;
  const y = event.clientY;
  if (crosshairV) {
    crosshairV.style.left = x + 'px';
    crosshairV.style.top = (y - 7) + 'px';
  }
  if (crosshairH) {
    crosshairH.style.left = (x - 7) + 'px';
    crosshairH.style.top = y + 'px';
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'MEASURE_START') {
    startMeasuring();
    sendResponse && sendResponse({ status: 'Measuring started' });
    return true;
  }
  if (msg && msg.type === 'MEASURE_STOP') {
    stopMeasuring();
    sendResponse && sendResponse({ status: 'Measuring stopped' });
    return true;
  }
  if (msg && msg.type === 'MEASURE_STATUS') {
    sendResponse && sendResponse({ measuring: measuringActive });
    return true;
  }
});