const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function processImage(inputFile, outputFile) {
  const img = await loadImage(inputFile);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;

  const toCheck = [];
  
  // Find all transparent pixels to act as boundaries to expand from
  for(let y=0; y<img.height; y++) {
    for(let x=0; x<img.width; x++) {
      let idx = (y * img.width + x) * 4;
      if (data[idx+3] === 0) {
        toCheck.push([x, y]);
      }
    }
  }

  // Also add bottom edge explicitly just in case
  for (let x=0; x<img.width; x++) {
     toCheck.push([x, img.height-1]);
  }
  
  const visited = new Uint8Array(img.width * img.height);
  for(let [x,y] of toCheck) {
     visited[y*img.width+x] = 1;
  }
  
  while(toCheck.length > 0) {
    const [x, y] = toCheck.pop();
    
    // Check neighbors
    const neighbors = [
      [x-1, y], [x+1, y], [x, y-1], [x, y+1]
    ];
    
    for (let [nx, ny] of neighbors) {
      if (nx >= 0 && nx < img.width && ny >= 0 && ny < img.height) {
        let nIdx = ny * img.width + nx;
        if (!visited[nIdx]) {
          let dIdx = nIdx * 4;
          let r = data[dIdx], g = data[dIdx+1], b = data[dIdx+2], a = data[dIdx+3];
          if (a > 0 && r < 45 && g < 45 && b < 45) { // increased tolerance
            data[dIdx+3] = 0; // make transparent
            visited[nIdx] = 1;
            toCheck.push([nx, ny]);
          } else if (a > 0) {
              // mark as visited so we don't check again
              visited[nIdx] = 1;
          }
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
