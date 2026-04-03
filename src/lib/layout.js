/**
 * Stack nodes vertically, proportional to their value.
 */
function stackNodes(items, x, nodeWidth, height, scaleTotal) {
  const pad = Math.max(3, Math.min(5, height / items.length / 8));
  const usableH = height - 20;
  const sum = scaleTotal || items.reduce((s, i) => s + i.value, 0);
  const totalPad = pad * (items.length - 1);
  const scale = (usableH - totalPad) / sum;
  let y = 10;
  return items.map((item) => {
    const h = Math.max(item.value * scale, 1.5);
    const node = { ...item, x, y, height: h, width: nodeWidth };
    y += h + pad;
    return node;
  });
}

/**
 * Calculate proportional flow links between left and right node stacks.
 */
function calcLinks(left, right) {
  const lSum = left.reduce((a, n) => a + n.value, 0);
  const scale = left[0] ? left[0].height / left[0].value : 1;
  const links = [];
  const lOffsets = left.map(() => 0);
  const rOffsets = right.map(() => 0);

  for (let li = 0; li < left.length; li++) {
    for (let ri = 0; ri < right.length; ri++) {
      const flow = (left[li].value * right[ri].value) / lSum;
      const t = flow * scale;
      if (t < 0.2) continue;
      links.push({
        id: `${left[li].id}-${right[ri].id}`,
        sx: left[li].x + left[li].width,
        sy: left[li].y + lOffsets[li] + t / 2,
        tx: right[ri].x,
        ty: right[ri].y + rOffsets[ri] + t / 2,
        thickness: t,
        sourceColor: left[li].color,
        targetColor: right[ri].color,
        sourceId: left[li].id,
        targetId: right[ri].id,
      });
      lOffsets[li] += t;
      rOffsets[ri] += t;
    }
  }
  return links;
}

/**
 * Full sankey layout calculation.
 * Returns { left, right, links }.
 */
export function calcLayout(leftItems, rightItems, w, h, scaleTotal) {
  const nW = w * 0.12;
  const left = stackNodes(leftItems, 0, nW, h, scaleTotal);
  const right = stackNodes(rightItems, w - nW, nW, h, scaleTotal);
  const links = calcLinks(left, right);
  return { left, right, links };
}
