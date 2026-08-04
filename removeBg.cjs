const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function processImage() {
  const img = await loadImage('/tmp/astro2.jpg');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;
  
  // Find the exact colors of the checkerboard from the top-left 32x32 pixels
  let colorCounts = {};
  for(let i=0; i<32; i++) {
    for(let j=0; j<32; j++) {
      let idx = (i * img.width + j) * 4;
      let r = data[idx], g = data[idx+1], b = data[idx+2];
      let key = `${Math.round(r/5)*5},${Math.round(g/5)*5},${Math.round(b/5)*5}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    }
  }
  
  const sortedColors = Object.entries(colorCounts).sort((a,b) => b[1]-a[1]);
  const bg1 = sortedColors[0][0].split(',').map(Number);
  const bg2 = sortedColors[1] ? sortedColors[1][0].split(',').map(Number) : bg1;
  
  const colorDist = (c1, c2) => Math.sqrt(Math.pow(c1[0]-c2[0], 2) + Math.pow(c1[1]-c2[1], 2) + Math.pow(c1[2]-c2[2], 2));

  // Flood fill from all edges
  const toCheck = [];
  const visited = new Uint8Array(img.width * img.height);
  
  for(let x=0; x<img.width; x++) {
    toCheck.push([x, 0]);
    toCheck.push([x, img.height-1]);
  }
  for(let y=0; y<img.height; y++) {
    toCheck.push([0, y]);
    toCheck.push([img.width-1, y]);
  }
  
  while(toCheck.length > 0) {
    const [x, y] = toCheck.pop();
    const pIdx = y * img.width + x;
    
    if (visited[pIdx]) continue;
    visited[pIdx] = 1;
    
    const dIdx = pIdx * 4;
    const r = data[dIdx], g = data[dIdx+1], b = data[dIdx+2];
    
    const dist1 = colorDist([r,g,b], bg1);
    const dist2 = colorDist([r,g,b], bg2);
    
    if (dist1 < 30 || dist2 < 30 || (r>235 && g>235 && b>235)) {
      data[dIdx+3] = 0; // Make transparent
      
      if (x > 0) toCheck.push([x-1, y]);
      if (x < img.width-1) toCheck.push([x+1, y]);
      if (y > 0) toCheck.push([x, y-1]);
      if (y < img.height-1) toCheck.push([x, y+1]);
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
  
  const out = fs.createWriteStream('public/astronaut2.png');
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on('finish', () => console.log('Saved to public/astronaut2.png'));
}
processImage().catch(console.error);
