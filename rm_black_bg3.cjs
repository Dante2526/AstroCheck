const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function processImage(inputFile, outputFile) {
  const img = await loadImage(inputFile);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;

  let removedCount = 0;
  for(let i=0; i<data.length; i+=4) {
    let r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a > 0 && r < 40 && g < 40 && b < 40) {
      data[i+3] = 0;
      removedCount++;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const out = fs.createWriteStream(outputFile);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  
  return new Promise(resolve => out.on('finish', resolve));
}

(async () => {
  await processImage('public/file_0000000089fc820ea47b4a9167700293.png', 'public/file_0000000089fc820ea47b4a9167700293.png');
  console.log('Saved');
})().catch(console.error);
