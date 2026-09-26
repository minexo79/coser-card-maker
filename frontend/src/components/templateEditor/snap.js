// 模板編輯器的「對齊吸附」純函式（不依賴 React，方便單元測試）。

const SNAP_THRESHOLD = 5;

function getEdges(box) {
  return {
    left: box.x,
    cx: box.x + box.width / 2,
    right: box.x + box.width,
    top: box.y,
    cy: box.y + box.height / 2,
    bottom: box.y + box.height
  };
}

// 找出最接近的吸附參考線。
// candidates: [{ edge, pos }]，edge 為自身的哪一條邊（left/cx/right 或 top/cy/bottom），pos 為其座標。
// 回傳 { edge, ref } 或 null（皆不在門檻內）。
function findNearestSnap(candidates, refs, threshold) {
  let best = null;
  for (const { edge, pos } of candidates) {
    for (const ref of refs) {
      const d = Math.abs(pos - ref.val);
      if (d < threshold && (!best || d < best.distance)) {
        best = { edge, ref: ref.val, distance: d };
      }
    }
  }
  return best;
}

// 將某一條邊吸附到 ref，回傳新的 { start, size }（start 為 x 或 y）。
//   - move：整個方框平移，尺寸不變。
//   - resize：只移動「正在拖曳的那條邊」，對面的邊固定不動，
//     因此改變的是目前元素的寬/高，而不是把整個方框推過去。
function applySnap(start, size, edge, ref, mode) {
  const isStartEdge = edge === 'left' || edge === 'top';
  const isEndEdge = edge === 'right' || edge === 'bottom';

  if (mode === 'resize') {
    if (isStartEdge) {
      const end = start + size;
      return { start: ref, size: end - ref };
    }
    if (isEndEdge) {
      return { start, size: ref - start };
    }
    return { start, size };
  }

  if (isStartEdge) return { start: ref, size };
  if (isEndEdge) return { start: ref - size, size };
  return { start: ref - size / 2, size }; // 中心線
}

// 回傳吸附後的 box 與 snapLines。
// move 時座標取整數、尺寸不變；resize 時不取整數，讓被拖曳的邊剛好對齊參考線。
// mode === 'move' 時六條參考邊（含中心線）都會吸附；
// mode === 'resize' 時只吸附 handle 對應的邊（例如 'se' → right、bottom）。
export function computeSnap(box, others, mode, handle, canvasW, canvasH) {
  const snapped = { ...box };
  const lines = [];
  const my = getEdges(box);

  // 收集所有參考吸附點：畫布邊緣／中心線 + 其他元素的邊與中心線
  const refXs = [{ val: 0 }, { val: canvasW / 2 }, { val: canvasW }];
  const refYs = [{ val: 0 }, { val: canvasH / 2 }, { val: canvasH }];
  for (const el of others) {
    const e = getEdges(el.box);
    refXs.push({ val: e.left }, { val: e.cx }, { val: e.right });
    refYs.push({ val: e.top }, { val: e.cy }, { val: e.bottom });
  }

  // 決定哪些邊需要吸附
  const isMove = mode === 'move';
  const h = handle || '';
  const xCandidates = [];
  if (isMove || h.includes('w')) xCandidates.push({ edge: 'left', pos: my.left });
  if (isMove || h.includes('e')) xCandidates.push({ edge: 'right', pos: my.right });
  if (isMove) xCandidates.push({ edge: 'cx', pos: my.cx });
  const yCandidates = [];
  if (isMove || h.includes('n')) yCandidates.push({ edge: 'top', pos: my.top });
  if (isMove || h.includes('s')) yCandidates.push({ edge: 'bottom', pos: my.bottom });
  if (isMove) yCandidates.push({ edge: 'cy', pos: my.cy });

  // X 軸吸附
  const snapX = findNearestSnap(xCandidates, refXs, SNAP_THRESHOLD);
  if (snapX) {
    const { start, size } = applySnap(box.x, box.width, snapX.edge, snapX.ref, mode);
    snapped.x = isMove ? Math.round(start) : start;
    snapped.width = size;
    lines.push({ x: snapX.ref, type: 'vertical' });
  }

  // Y 軸吸附
  const snapY = findNearestSnap(yCandidates, refYs, SNAP_THRESHOLD);
  if (snapY) {
    const { start, size } = applySnap(box.y, box.height, snapY.edge, snapY.ref, mode);
    snapped.y = isMove ? Math.round(start) : start;
    snapped.height = size;
    lines.push({ y: snapY.ref, type: 'horizontal' });
  }

  return { box: snapped, lines };
}
