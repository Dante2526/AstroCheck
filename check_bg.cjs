const { createCanvas, loadImage } = require('canvas');
async function check() {
  const img = await loadImage('public/file_0000000089fc820ea47b4a9167700293.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  console.log("Top-left:", data[0], data[1], data[2], data[3]);
  console.log("Top-right:", data[(img.width-1)*4], data[(img.width-1)*4+1], data[(img.width-1)*4+2], data[(img.width-1)*4+3]);
  console.log("Bottom-left:", data[(img.height-1)*img.width*4], data[(img.height-1)*img.width*4+1], data[(img.height-1)*img.width*4+2], data[(img.height-1)*img.width*4+3]);
}
check().catch(console.error);
