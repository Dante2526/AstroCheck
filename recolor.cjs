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
  const img = await loadImage('public/astronaut2.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imgData.data;

  // #FF6B00 is HSL ~25 deg, 100% sat, 50% lightness.
  // We want to map orange-ish colors (Hue 0-45) to a warmer orange, and boost saturation.
  // #1A1A1A is very dark gray (Lightness ~10%).
  // #FFFFFF is white.

  for(let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a === 0) continue;

    let [h, s, l] = rgbToHsl(r, g, b);

    // If it's the visor (dark gray/black)
    // Dark parts in this image (visor) have low lightness, and very low saturation.
    if (l < 0.35 && s < 0.3) {
      l = l * 0.5; // darken further to #1A1A1A
    } 
    // If it's orange (Hue between ~10 and ~50 degrees)
    else if (h > 0.02 && h < 0.15 && s > 0.3) {
      // shift hue towards 25 degrees (0.07)
      h = 0.07;
      s = Math.min(1, s * 1.5); // saturate heavily
      // keep l to preserve shading
    }
    // If it's the white suit (low saturation, high lightness)
    else if (s < 0.3 && l > 0.5) {
      // whiten it
      l = Math.min(1, l * 1.1);
      s = s * 0.5; // remove color cast
    }

    let [nr, ng, nb] = hslToRgb(h, s, l);
    data[i] = nr;
    data[i+1] = ng;
    data[i+2] = nb;
  }

  ctx.putImageData(imgData, 0, 0);

  const out = fs.createWriteStream('public/astronaut2_colored.png');
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on('finish', () => console.log('Saved to public/astronaut2_colored.png'));
}

main().catch(console.error);
