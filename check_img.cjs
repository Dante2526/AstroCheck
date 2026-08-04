const { createCanvas, loadImage } = require('canvas');
async function check() {
  const img = await loadImage('public/1000215324.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  console.log("Top-left:", data[0], data[1], data[2], data[3]);
}
check().catch(console.error);
