/* === Color Utility Functions === */

/* ---- HEX <-> RGB ---- */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/* ---- RGB <-> HSL ---- */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

/* ---- RGB <-> HSV ---- */
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToRgb(h, s, v) {
  h /= 360; s /= 100; v /= 100;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

/* ---- RGB <-> CMYK ---- */
function rgbToCmyk(r, g, b) {
  const cr = r / 255, cg = g / 255, cb = b / 255;
  const k = 1 - Math.max(cr, cg, cb);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round((1 - cr - k) / (1 - k) * 100),
    m: Math.round((1 - cg - k) / (1 - k) * 100),
    y: Math.round((1 - cb - k) / (1 - k) * 100),
    k: Math.round(k * 100)
  };
}

/* ---- Luminance & Contrast ---- */
function relativeLuminance(r, g, b) {
  const [R, G, B] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(r1, g1, b1, r2, g2, b2) {
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/* ---- Text Color (black or white based on luminance) ---- */
function textColorForBg(r, g, b) {
  const lum = relativeLuminance(r, g, b);
  return lum > 0.5 ? '#000000' : '#FFFFFF';
}

/* ---- Palette Generation ---- */
function generatePalette(hex, type, count) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  let colors = [];

  switch (type) {
    case 'monochromatic': {
      for (let i = 0; i < count; i++) {
        const s = Math.min(100, Math.max(0, hsl.s - 20 + (i * 40 / count)));
        const l = Math.min(95, Math.max(5, 20 + (i * 60 / (count - 1))));
        const c = hslToRgb(hsl.h, s, l);
        colors.push(rgbToHex(c.r, c.g, c.b));
      }
      break;
    }
    case 'complementary': {
      colors.push(hex);
      colors.push(rgbToHex(hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l).r, hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l).g, hslToRgb((hsl.h + 180) % 360, hsl.s, hsl.l).b));
      // Fill rest with variations
      for (let i = 2; i < count; i++) {
        const l = 20 + (i * 60 / (count - 1));
        const c = hslToRgb(hsl.h + (i % 2 ? 0 : 180), hsl.s, l);
        colors.push(rgbToHex(c.r, c.g, c.b));
      }
      break;
    }
    case 'analogous': {
      const step = 30;
      const start = hsl.h - (step * Math.floor(count / 2));
      for (let i = 0; i < count; i++) {
        const h = ((start + step * i) % 360 + 360) % 360;
        const c = hslToRgb(h, hsl.s, hsl.l);
        colors.push(rgbToHex(c.r, c.g, c.b));
      }
      break;
    }
    case 'triadic': {
      const positions = [0, 120, 240];
      for (let i = 0; i < count; i++) {
        const h = (hsl.h + positions[i % 3]) % 360;
        const l = 30 + (i * 50 / (count - 1));
        const c = hslToRgb(h, hsl.s, Math.min(95, l));
        colors.push(rgbToHex(c.r, c.g, c.b));
      }
      break;
    }
    case 'tetradic': {
      const positions = [0, 90, 180, 270];
      for (let i = 0; i < count; i++) {
        const h = (hsl.h + positions[i % 4]) % 360;
        const l = 25 + (i * 50 / (count - 1));
        const c = hslToRgb(h, hsl.s, Math.min(90, l));
        colors.push(rgbToHex(c.r, c.g, c.b));
      }
      break;
    }
    case 'split-complementary': {
      const base = hsl.h;
      const splits = [base, (base + 150) % 360, (base + 210) % 360];
      for (let i = 0; i < count; i++) {
        const h = splits[i % 3];
        const offset = Math.floor(i / 3);
        const l = Math.min(90, 25 + offset * 20);
        const c = hslToRgb(h, Math.max(30, hsl.s - offset * 5), l);
        colors.push(rgbToHex(c.r, c.g, c.b));
      }
      break;
    }
    case 'shades': {
      for (let i = 0; i < count; i++) {
        const l = Math.max(5, 85 - (i * 80 / (count - 1)));
        const c = hslToRgb(hsl.h, hsl.s, l);
        colors.push(rgbToHex(c.r, c.g, c.b));
      }
      break;
    }
    case 'tints': {
      for (let i = 0; i < count; i++) {
        const l = Math.min(95, 15 + (i * 80 / (count - 1)));
        const c = hslToRgb(hsl.h, hsl.s, l);
        colors.push(rgbToHex(c.r, c.g, c.b));
      }
      break;
    }
  }

  return colors;
}

/* ---- Random Color ---- */
function randomColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 60 + Math.floor(Math.random() * 35);
  const l = 40 + Math.floor(Math.random() * 30);
  const c = hslToRgb(h, s, l);
  return rgbToHex(c.r, c.g, c.b);
}
