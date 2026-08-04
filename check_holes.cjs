const { createCanvas, loadImage } = require('canvas');
async function check() {
  const img = await loadImage('public/1000215324.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  let transparentPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] === 0) transparentPixels++;
  }
  console.log("Total transparent pixels:", transparentPixels);
}
check().catch(console.error);
