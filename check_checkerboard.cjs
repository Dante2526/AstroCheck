const { createCanvas, loadImage } = require('canvas');
async function check() {
  const img = await loadImage('public/1000215324.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  console.log("Top-left color:", data[0], data[1], data[2], data[3]);
  console.log("Color at 10,10:", data[40*img.width+40], data[40*img.width+41], data[40*img.width+42], data[40*img.width+43]);
}
check().catch(console.error);
