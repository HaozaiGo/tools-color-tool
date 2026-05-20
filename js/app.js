/* === Color Tool - App Logic === */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initConverter();
  initPalette();
  initGradient();
});

/* ---- Tab Switching ---- */
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
    t.setAttribute('aria-selected', t.dataset.tab === tabId ? 'true' : 'false');
    t.tabIndex = t.dataset.tab === tabId ? 0 : -1;
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.hidden = p.id !== 'panel-' + tabId;
    p.classList.toggle('active', p.id === 'panel-' + tabId);
  });
  if (tabId === 'palette') updatePalette();
  if (tabId === 'gradient') updateGradientPreview();
}

/* ======== CONVERTER ======== */
function initConverter() {
  const picker = document.getElementById('color-picker');
  picker.addEventListener('input', () => updateFromHex(picker.value));

  // Input listeners
  ['val-hex', 'val-rgb', 'val-hsl', 'val-hsv', 'val-cmyk'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => parseInput(id));
    document.getElementById(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') parseInput(id);
    });
  });

  // Initial update
  updateFromHex('#3B82F6');
}

function updateFromHex(hex) {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  // Update preview
  document.getElementById('color-preview').style.background = hex;
  document.getElementById('color-hex-display').textContent = hex.toUpperCase();
  document.getElementById('color-picker').value = hex;

  // Update input fields
  document.getElementById('val-hex').value = hex.toUpperCase();
  document.getElementById('val-rgb').value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  document.getElementById('val-hsl').value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  document.getElementById('val-hsv').value = `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
  document.getElementById('val-cmyk').value = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;

  // Update similar colors
  updateSimilarColors(hsl);
  // Update color info
  updateColorInfo(rgb, hex);
}

function parseInput(id) {
  const val = document.getElementById(id).value.trim();
  try {
    let hex;
    switch (id) {
      case 'val-hex': {
        let h = val.startsWith('#') ? val : '#' + val;
        if (/^#[0-9a-fA-F]{6}$/.test(h)) hex = h;
        else if (/^#[0-9a-fA-F]{3}$/.test(h)) hex = '#' + h[1]+h[1] + h[2]+h[2] + h[3]+h[3];
        else throw new Error('Invalid hex');
        break;
      }
      case 'val-rgb': {
        const m = val.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        if (!m) throw new Error('Invalid RGB');
        const r = Math.max(0, Math.min(255, parseInt(m[1])));
        const g = Math.max(0, Math.min(255, parseInt(m[2])));
        const b = Math.max(0, Math.min(255, parseInt(m[3])));
        hex = rgbToHex(r, g, b);
        break;
      }
      case 'val-hsl': {
        const m = val.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i);
        if (!m) throw new Error('Invalid HSL');
        const c = hslToRgb(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
        hex = rgbToHex(c.r, c.g, c.b);
        break;
      }
      case 'val-hsv': {
        const m = val.match(/hsv\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i);
        if (!m) throw new Error('Invalid HSV');
        const c = hsvToRgb(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
        hex = rgbToHex(c.r, c.g, c.b);
        break;
      }
      case 'val-cmyk': {
        const m = val.match(/cmyk\(\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i);
        if (!m) throw new Error('Invalid CMYK');
        const c = 1 - parseInt(m[1]) / 100;
        const y = 1 - parseInt(m[2]) / 100;
        const mk = 1 - parseInt(m[3]) / 100;
        const k = 1 - parseInt(m[4]) / 100;
        const r = Math.round(255 * (1 - c) * (1 - k));
        const g = Math.round(255 * (1 - y) * (1 - k));
        const b = Math.round(255 * (1 - mk) * (1 - k));
        hex = rgbToHex(Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b)));
        break;
      }
    }
    if (hex) updateFromHex(hex);
  } catch (e) {
    showToast('❌ 格式错误，请检查输入');
  }
}

function updateSimilarColors(hsl) {
  const container = document.getElementById('similar-colors');
  const offsets = [0, 30, -30, 60, -60, 120, -120, 180];
  let html = '';
  for (const offset of offsets) {
    const h = ((hsl.h + offset) % 360 + 360) % 360;
    const c = hslToRgb(h, hsl.s, hsl.l);
    const hex = rgbToHex(c.r, c.g, c.b);
    html += `<div class="sim-color" style="background:${hex}" onclick="updateFromHex('${hex}')" title="${hex}"></div>`;
  }
  container.innerHTML = html;
}

function updateColorInfo(rgb, hex) {
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const lum = relativeLuminance(rgb.r, rgb.g, rgb.b).toFixed(3);
  const contrast = contrastRatio(rgb.r, rgb.g, rgb.b, 0, 0, 0).toFixed(2);
  const contrastWhite = contrastRatio(rgb.r, rgb.g, rgb.b, 255, 255, 255).toFixed(2);
  const wcagAA = contrast >= 4.5 ? '✅' : '❌';
  const wcagAABig = contrast >= 3 ? '✅' : '❌';
  const wcagAAA = contrast >= 7 ? '✅' : '❌';

  const container = document.getElementById('color-info');
  container.innerHTML = `
    <div class="info-item"><span>亮度</span><span>${lum}</span></div>
    <div class="info-item"><span>色相</span><span>${hsl.h}°</span></div>
    <div class="info-item"><span>饱和度</span><span>${hsl.s}%</span></div>
    <div class="info-item"><span>明度</span><span>${hsl.l}%</span></div>
    <div class="info-item"><span>白字对比度</span><span>${contrastWhite}:1</span></div>
    <div class="info-item"><span>黑字对比度</span><span>${contrast}:1</span></div>
    <div class="info-item"><span>WCAG AA(正文)</span><span>${wcagAA}</span></div>
    <div class="info-item"><span>WCAG AAA</span><span>${wcagAAA}</span></div>
  `;
}

/* ======== PALETTE ======== */
function initPalette() {
  ['base-color-picker', 'palette-type', 'palette-count'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePalette);
  });
}

function updatePalette() {
  const hex = document.getElementById('base-color-picker').value;
  const type = document.getElementById('palette-type').value;
  const count = parseInt(document.getElementById('palette-count').value);

  const colors = generatePalette(hex, type, count);
  const container = document.getElementById('palette-result');

  let html = '';
  for (const c of colors) {
    const textColor = textColorForBg(hexToRgb(c).r, hexToRgb(c).g, hexToRgb(c).b);
    html += `<div class="palette-swatch" style="background:${c};color:${textColor}" onclick="copyHex('${c}')">
      <span>${c}</span>
      <span class="palette-code">${c}</span>
    </div>`;
  }
  container.innerHTML = html;
}

function exportPaletteCSS() {
  const swatches = document.querySelectorAll('.palette-swatch');
  if (!swatches.length) { showToast('❌ 请先生成调色板'); return; }
  let css = ':root {\n';
  swatches.forEach((s, i) => {
    const hex = s.querySelector('.palette-code')?.textContent || '';
    css += `  --color-${i + 1}: ${hex};\n`;
  });
  css += '}';
  navigator.clipboard.writeText(css).then(() => showToast('✅ CSS 变量已复制')).catch(() => showToast('❌ 复制失败'));
}

function exportPaletteImage() {
  const swatches = document.querySelectorAll('.palette-swatch');
  if (!swatches.length) { showToast('❌ 请先生成调色板'); return; }

  const canvas = document.createElement('canvas');
  const h = 60, count = swatches.length;
  canvas.width = count * 120;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  swatches.forEach((s, i) => {
    const hex = s.style.background;
    ctx.fillStyle = hex;
    ctx.fillRect(i * 120, 0, 120, h);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hex, i * 120 + 60, h / 2);
  });

  const link = document.createElement('a');
  link.download = 'palette.png';
  link.href = canvas.toDataURL();
  link.click();
  showToast('✅ 调色板图片已下载');
}

/* ======== GRADIENT ======== */
function initGradient() {
  // Stop color pickers
  document.querySelectorAll('.gradient-stop input[type="color"]').forEach(p => {
    p.addEventListener('input', updateGradientPreview);
  });

  ['gradient-direction', 'gradient-type'].forEach(id => {
    document.getElementById(id).addEventListener('change', updateGradientPreview);
  });
}

function updateGradientPreview() {
  const type = document.getElementById('gradient-type').value;
  const direction = document.getElementById('gradient-direction').value;
  const stops = document.querySelectorAll('.gradient-stop input[type="color"]');

  const colors = Array.from(stops).map(s => s.value);

  let css;
  if (type === 'linear') {
    css = `linear-gradient(${direction}, ${colors.join(', ')})`;
  } else {
    css = `radial-gradient(circle, ${colors.join(', ')})`;
  }

  document.getElementById('gradient-preview').style.background = css;
  document.getElementById('gradient-css-code').textContent = `background: ${css};`;
}

function addGradientStop() {
  const container = document.querySelector('.gradient-colors-row');
  const existing = container.querySelectorAll('.gradient-stop');
  if (existing.length >= 6) { showToast('最多 6 种颜色'); return; }

  const lastColor = existing[existing.length - 1]?.querySelector('input')?.value || '#000000';
  // Generate a slightly different color
  const rgb = hexToRgb(lastColor);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const h = (hsl.h + 60) % 360;
  const c = hslToRgb(h, hsl.s, hsl.l);
  const newColor = rgbToHex(c.r, c.g, c.b);

  const div = document.createElement('div');
  div.className = 'gradient-stop';
  div.innerHTML = `<label>颜色 ${existing.length + 1}</label>
    <input type="color" value="${newColor}">`;
  
  const input = div.querySelector('input');
  input.addEventListener('input', updateGradientPreview);

  container.appendChild(div);
  updateGradientPreview();
}

function randomGradient() {
  const stops = document.querySelectorAll('.gradient-stop input[type="color"]');
  stops.forEach(s => s.value = randomColor());
  updateGradientPreview();
}

function copyGradientCSS() {
  const code = document.getElementById('gradient-css-code').textContent;
  navigator.clipboard.writeText(code).then(() => showToast('✅ CSS 已复制')).catch(() => showToast('❌ 复制失败'));
}

/* ======== Utilities ======== */
function copyValue(id) {
  const val = document.getElementById(id).value;
  navigator.clipboard.writeText(val).then(() => showToast('✅ 已复制'));
}

function copyHex(hex) {
  navigator.clipboard.writeText(hex).then(() => showToast(`✅ ${hex} 已复制`));
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 2000);
}
