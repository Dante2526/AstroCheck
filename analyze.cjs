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

async function analyze(file) {
  const img = await loadImage(file);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height).data;
  
  let hues = [];
  for(let i=0; i<data.length; i+=4) {
    let [h,s,l] = rgbToHsl(data[i], data[i+1], data[i+2]);
    if(s > 0.2 && l > 0.2 && l < 0.8) {
       hues.push(h);
    }
  }
  let hueCounts = {};
  for(let h of hues) {
    let bucket = Math.round(h * 100) / 100;
    hueCounts[bucket] = (hueCounts[bucket] || 0) + 1;
  }
  console.log('Hue buckets for', file);
  console.log(Object.entries(hueCounts).sort((a,b)=>b[1]-a[1]).slice(0, 10));
}

analyze('/tmp/astro2_orig.jpg').catch(console.error);
