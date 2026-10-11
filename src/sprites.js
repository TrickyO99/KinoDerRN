/* Booth-scene decoration sprites — pixel-art props drawn procedurally on
   <canvas>, no image assets. Bot/player avatars use DiceBear instead (see
   components/Avatar.vue) — these shapes are only for the desk/wall props. */

export const SHAPE_LAMP = [
  "..WWWW..",
  ".WWWWWW.",
  "WWWWWWWW",
  "..KKKK..",
  "..KKKK..",
  ".KKKKKK.",
  "........",
  "........",
];

export const SHAPE_COFFEE = [
  "........",
  ".KKKKK..",
  ".KWWWK.K",
  ".KWWWK.K",
  ".KWWWK.K",
  ".KKKKK..",
  "........",
  "........",
];

export const SHAPE_STAMP = [
  "........",
  "..KKKK..",
  ".KRRRRK.",
  ".KRRRRK.",
  "..KKKK..",
  "...KK...",
  "..KKKK..",
  "........",
];

export const SHAPE_PAPERS = [
  "........",
  "WWWWWWW.",
  "WWWWWWW.",
  ".WWWWWWW",
  ".WWWWWWW",
  "WWWWWWW.",
  "WWWWWWW.",
  "........",
];

// Shown briefly over a token when you correctly call out an actual bot —
// a little chrome skull with a glowing red eye, Terminator-style.
export const SHAPE_ROBOT_HEAD = [
  ".GGGGGGGG.",
  "GGGGGGGGGG",
  "GGKRRRRKGG",
  "GGKRRRRKGG",
  "GGGGGGGGGG",
  "GGGKKKKGGG",
  "GGKKKKKKGG",
  ".GGGGGGGG.",
  "..GG..GG..",
  ".GG....GG.",
];

export function drawSprite(canvas, shape, palette, scale) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const rows = shape.length;
  const cols = shape[0].length;
  const px = scale || Math.floor(canvas.width / cols);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const offsetX = Math.floor((canvas.width - cols * px) / 2);
  const offsetY = Math.floor((canvas.height - rows * px) / 2);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = shape[r][c];
      if (ch === ".") continue;
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(offsetX + c * px, offsetY + r * px, px, px);
    }
  }
}

export const PALETTES = {
  lamp: { W: "#e8c877", K: "#4a4030" },
  coffee: { K: "#2a1a10", W: "#6b4428" },
  stamp: { K: "#2a1a10", R: "#b33a3a" },
  papers: { W: "#d8cdb0" },
  robotHead: { G: "#8a8f94", K: "#2a2d30", R: "#ff3344" },
};
