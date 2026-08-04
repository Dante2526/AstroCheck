const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function processImage(inputFile, outputFile) {
  const img = await loadImage(inputFile);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;

  const bgColors = [];
  const corners = [
    [0, 0], [img.width-1, 0], [0, img.height-1], [img.width-1, img.height-1],
    [img.width/2 | 0, 0], [0, img.height/2 | 0], [img.width/2 | 0, img.height-1], [img.width-1, img.height/2 | 0]
  ];
  for (let [x, y] of corners) {
    let idx = (y * img.width + x) * 4;
    bgColors.push([data[idx], data[idx+1], data[idx+2]]);
  }

  const colorDist = (c1, c2) => Math.sqrt(Math.pow(c1[0]-c2[0], 2) + Math.pow(c1[1]-c2[1], 2) + Math.pow(c1[2]-c2[2], 2));

  const toCheck = [];
  const visited = new Uint8Array(img.width * img.height);
  
  for(let x=0; x<img.width; x++) {
    toCheck.push([x, 0]); toCheck.push([x, img.height-1]);
  }
  for(let y=0; y<img.height; y++) {
    toCheck.push([0, y]); toCheck.push([img.width-1, y]);
  }
  
  while(toCheck.length > 0) {
    const [x, y] = toCheck.pop();
    const pIdx = y * img.width + x;
    if (visited[pIdx]) continue;
    visited[pIdx] = 1;
    const dIdx = pIdx * 4;
    const r = data[dIdx], g = data[dIdx+1], b = data[dIdx+2];
    
    let isBg = false;
    // Check against corner colors (expecting black/very dark)
    for (let bg of bgColors) {
      if (colorDist([r,g,b], bg) < 30) {
        isBg = true;
        break;
      }
    }
    // Explicitly treat very dark pixels as background during flood fill
    if (r < 15 && g < 15 && b < 15) {
      isBg = true;
    }
    
    if (isBg) {
      data[dIdx+3] = 0;
      if (x > 0) toCheck.push([x-1, y]);
      if (x < img.width-1) toCheck.push([x+1, y]);
      if (y > 0) toCheck.push([x, y-1]);
      if (y < img.height-1) toCheck.push([x, y+1]);
    }
  }

  // Edge smoothing
  for (let y = 1; y < img.height - 1; y++) {
    for (let x = 1; x < img.width - 1; x++) {
      let i = (y * img.width + x) * 4;
      if (data[i+3] > 0) {
        let n1 = ((y-1) * img.width + x) * 4 + 3;
        let n2 = ((y+1) * img.width + x) * 4 + 3;
        let n3 = (y * img.width + (x-1)) * 4 + 3;
        let n4 = (y * img.width + (x+1)) * 4 + 3;
        if (data[n1] === 0 || data[n2] === 0 || data[n3] === 0 || data[n4] === 0) {
          data[i+3] = Math.max(0, data[i+3] - 100); // partially transparent edge
        }
      }
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
