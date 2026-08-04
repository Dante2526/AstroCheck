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

async function processImage(inputFile, outputFile, hasHeart) {
  const img = await loadImage(inputFile);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;

  // Background removal via flood fill from edges
  const corners = [
    [0, 0], [img.width-1, 0], [0, img.height-1], [img.width-1, img.height-1],
    [img.width/2 | 0, 0], [0, img.height/2 | 0]
  ];
  const bgColors = [];
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
    for (let bg of bgColors) {
      if (colorDist([r,g,b], bg) < 25) {
        isBg = true;
        break;
      }
    }
    if (r>240 && g>240 && b>240) {
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

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let i = (y * img.width + x) * 4;
      if (data[i+3] === 0) continue;

      let r = data[i], g = data[i+1], b = data[i+2];
      let [h, s, l] = rgbToHsl(r, g, b);
      let newH = h, newS = s, newL = l;

      let isHeartArea = hasHeart && (x > 80 && x < 280 && y > 150 && y < 350);
      let isThermometerArea = hasHeart && (x > 250 && y > 150 && y < 300); // Approximate right side for thermometer

      // Preserve blue in thermometer screen
      if (h > 0.45 && h < 0.65 && s > 0.1) {
          // Keep it as is
      }
      else if (isHeartArea && (h < 0.04 || h > 0.9) && s > 0.3) {
        // Red Heart: pure red
        newH = 1.0; 
        newS = 1.0; 
        newL = Math.max(0.3, Math.min(0.6, l)); // Keep shading, but make it very saturated red
      } 
      else if (s > 0.15 && (h >= 0.00 && h < 0.15)) {
        // Orange Suit Pieces: Laranja Vibrante #FF6B00
        // Target: H=25/360 (~0.069), S=1, L=0.5
        newH = 0.0694;
        newS = 1.0;
        // Map original lightness to target lightness nicely
        newL = 0.5 + (l - 0.5) * 0.8; // Maintain some shading around base 0.5
      } 
      else if (h >= 0.12 && h < 0.20 && s > 0.3) {
        // Yellow Moon (only relevant for astro1)
        newH = 0.15;
        newS = 1.0;
      }
      else if (l < 0.35) {
        // Visor: Escuro #1A1A1A (L=0.1)
        // Keep reflections (lighter parts) but darken overall
        newS = 0;
        newL = Math.max(0.05, Math.min(0.2, l * 0.7)); // Very dark
      } 
      else {
        // White suit base
        newS = 0;
        newL = Math.min(1, l * 1.2); // Brighten to pure white
      }

      let [nr, ng, nb] = hslToRgb(newH, newS, newL);
      data[i] = nr; data[i+1] = ng; data[i+2] = nb;
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
          data[i+3] = Math.max(0, data[i+3] - 100);
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
  await processImage('/tmp/astro1_orig.jpg', 'public/astronaut1_colored.png', false);
  console.log('Saved to public/astronaut1_colored.png');
  await processImage('/tmp/astro2_orig.jpg', 'public/astronaut2_colored.png', true);
  console.log('Saved to public/astronaut2_colored.png');
})().catch(console.error);
