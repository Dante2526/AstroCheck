const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0; 
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l; 
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [r * 255, g * 255, b * 255];
}

async function main() {
  const img = await loadImage('/tmp/astro2.jpg');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;

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
    
    const dist1 = colorDist([r,g,b], bg1);
    const dist2 = colorDist([r,g,b], bg2);
    
    if (dist1 < 30 || dist2 < 30 || (r>235 && g>235 && b>235)) {
      data[dIdx+3] = 0;
      if (x > 0) toCheck.push([x-1, y]);
      if (x < img.width-1) toCheck.push([x+1, y]);
      if (y > 0) toCheck.push([x, y-1]);
      if (y < img.height-1) toCheck.push([x, y+1]);
    }
  }

  for(let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a === 0) continue;

    let [h, s, l] = rgbToHsl(r, g, b);

    // Is it the red heart?
    // Red hues are near 0 or near 1.
    if ((h < 0.025 || h > 0.95) && s > 0.3) {
      h = 0.0; // Pure red
      s = Math.min(1, s * 1.5);
      // Boost red vibrance
      let [nr, ng, nb] = hslToRgb(h, s, l);
      data[i] = 255; // max out R slightly if we want it super red, but let's just use HSL mapping
      data[i] = nr; data[i+1] = ng; data[i+2] = nb;
    }
    // Visor
    else if (l < 0.35 && s < 0.3) {
      l = l * 0.5;
      let [nr, ng, nb] = hslToRgb(h, s, l);
      data[i] = nr; data[i+1] = ng; data[i+2] = nb;
    } 
    // Orange suit pieces
    else if (h >= 0.025 && h < 0.15 && s > 0.3) {
      h = 0.07;
      s = Math.min(1, s * 1.5);
      let [nr, ng, nb] = hslToRgb(h, s, l);
      data[i] = nr; data[i+1] = ng; data[i+2] = nb;
    }
    // White suit
    else if (s < 0.3 && l > 0.5) {
      l = Math.min(1, l * 1.1);
      s = s * 0.5;
      let [nr, ng, nb] = hslToRgb(h, s, l);
      data[i] = nr; data[i+1] = ng; data[i+2] = nb;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const out = fs.createWriteStream('public/astronaut2_colored.png');
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on('finish', () => console.log('Saved to public/astronaut2_colored.png'));
}

main().catch(console.error);
