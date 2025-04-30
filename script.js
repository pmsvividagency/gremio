// script.js

// === Supabase setup ===
const { createClient } = supabase;
const _supabase = createClient(
  'https://sajqgagcsritkjifnicr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhanFnYWdjc3JpdGtqaWZuaWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjA3MTQsImV4cCI6MjA2MDYzNjcxNH0.39Hz8Ql39niAlAvk4rTvMgcF0AfwGTdXM_erUU95NGg'
);
const baseUrl = 'https://sajqgagcsritkjifnicr.supabase.co/storage/v1/object/public/gremio/';

// State
let items = [];
let currentDeg = 0;

// === Data fetching ===
async function getSpinStats() {
  const { data, error } = await _supabase.from('spin_stats').select('*');
  if (error) { console.error(error); return {}; }
  return data.reduce((o, i) => (o[i.text] = i.won, o), {});
}

// Прелоадер: скрывает спиннер загрузки
function hidePreloader() {
  const pre = document.getElementById('preloader');
  if (pre) pre.style.display = 'none';
}


const tickAudio = new Audio('https://sajqgagcsritkjifnicr.supabase.co/storage/v1/object/public/gremio/tick.mp3');
tickAudio.volume = 1;
let lastTickAngle = 0;
const tickAngleStep = 35; // угол между звуками в градусах

// При первом клике активируем аудио-плейбек (для браузеров, требующих интерактивности)
document.body.addEventListener('click', () => {
  tickAudio.play().then(() => {
    tickAudio.pause();
    tickAudio.currentTime = 0;
  }).catch(() => {});
}, { once: true });


async function fetchGifts() {
  const stats = await getSpinStats();
  const { data, error } = await _supabase
    .from('gifts').select('*').order('sort_order');
  if (error) { console.error(error); return []; }
  return data.map(g => ({
    id:     g.id,
    text:   g.text,
    fulltext:   g.fulltext,
    class:  g.class || '',
    chance: g.count_static > 0 ? g.chance * (g.count / g.count_static) : 0,
    count:  g.count,
    icon:   g.icon
  }));
}

// === SVG Helpers ===
const SVG_NS   = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const p1 = polarToCartesian(cx, cy, r, endAngle);
  const p2 = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = ((endAngle - startAngle) % 360) <= 180 ? '0' : '1';
  return [
    'M', p2.x, p2.y,
    'A', r, r, 0, largeArcFlag, 0, p1.x, p1.y,
    'L', cx, cy,
    'Z'
  ].join(' ');
}

// === Render SVG Wheel ===
function renderSvgWheel(items) {
  const svg = document.getElementById('rouletteSvg');
  if (!svg) return;
  svg.style.overflow = 'visible';
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const size  = 400;
  const cx    = size/2, cy = size/2, R = size/2;
  const count = items.length;
  const delta = 360 / count;

  // ─── Градиент ─────────────────────
  const defs = document.createElementNS(SVG_NS, 'defs');
  const grad = document.createElementNS(SVG_NS, 'radialGradient');
  grad.setAttribute('id', 'wheelGrad');
  const stop1 = document.createElementNS(SVG_NS, 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#181717');
  const stop2 = document.createElementNS(SVG_NS, 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', '#000');
  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);

  // ─── Группа колеса ────────────────
  const wheelGroup = document.createElementNS(SVG_NS, 'g');
  wheelGroup.setAttribute('id', 'wheelGroup');
  svg.appendChild(wheelGroup);

  // ─── Фон круга ─────────────────────
  const bg = document.createElementNS(SVG_NS, 'circle');
  bg.setAttribute('cx', cx);
  bg.setAttribute('cy', cy);
  bg.setAttribute('r', R);
  bg.setAttribute('fill', 'url(#wheelGrad)');
  wheelGroup.appendChild(bg);

  // ─── Сектора с выступанием ────────
  const strokeW = 0, extra = 10;
  const outerR  = R + extra + strokeW/2;
  for (let i = 0; i < count; i++) {
    const start = i * delta, end = start + delta;
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', describeArc(cx, cy, outerR, start, end));
    path.setAttribute('fill', i % 2 ? '#202020' : '#ff5408');
    path.setAttribute('stroke', '#000');
    path.setAttribute('stroke-width', strokeW);
    path.setAttribute('stroke-linejoin', 'round');
    wheelGroup.appendChild(path);
  }

  // ─── Иконки ───────────────────────
  const iconRad = R * 0.87, sizeImg = 45;
  items.forEach((it, idx) => {
    if (!it.icon) return;
    const ang = (idx + 0.5) * delta;
    const pos = polarToCartesian(cx, cy, iconRad, ang);

    const ig = document.createElementNS(SVG_NS, 'g');
    ig.setAttribute('transform', `translate(${pos.x},${pos.y}) rotate(${ang})`);
	let cls = it.class || '';
	// добавляем ваш статический класс, например 'my-static-class'
	cls = (cls ? cls + ' ' : '') + 'icn';
    const img = document.createElementNS(SVG_NS, 'image');
    img.setAttributeNS(XLINK_NS, 'href', baseUrl + it.icon);
    img.setAttribute('class',  cls);
    img.setAttribute('width',  sizeImg);
    img.setAttribute('height', sizeImg);
    img.setAttribute('x', -sizeImg/2);
    img.setAttribute('y', -sizeImg/2);

    ig.appendChild(img);
    wheelGroup.appendChild(ig);
  });

  // ─── Текст ────────────────────────
  const defaultTextRad  = R * 0.74;
  const discountTextRad = R * 0.95; // для класса discount
  const maxChars   = 15;
  const lineHeight = 0.9;
  items.forEach((it, idx) => {
    const ang = (idx + 0.5) * delta;
    const rad = it.class === 'discount' ? discountTextRad : defaultTextRad;
	const pos = polarToCartesian(cx, cy, rad, ang);

    const dx = cx - pos.x, dy = cy - pos.y;
    const degAng = Math.atan2(dy, dx) * 180 / Math.PI;

    const words = it.text.split(' ');
    const lines = [];
    let line = '';
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (test.length > maxChars && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);

    const totalEm = (lines.length - 1) * lineHeight;
    const initEm  = -totalEm / 2;

    const tg = document.createElementNS(SVG_NS, 'g');
    tg.setAttribute('transform', `translate(${pos.x},${pos.y}) rotate(${degAng})`);

    const textEl = document.createElementNS(SVG_NS, 'text');
	let cls = it.class || '';
	// добавляем ваш статический класс, например 'my-static-class'
	cls = (cls ? cls + ' ' : '') + 'text';
	textEl.setAttribute('class', cls);
    textEl.setAttribute('fill', '#fff');
    textEl.setAttribute('font-size', '14');
    textEl.setAttribute('font-weight', 'bold');
    textEl.setAttribute('text-anchor', 'start');
    textEl.setAttribute('dominant-baseline', 'middle');

    lines.forEach((ln, j) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', '0');
      tspan.setAttribute('dy', j === 0 ? `${initEm}em` : `${lineHeight}em`);
      tspan.textContent = ln;
      textEl.appendChild(tspan);
    });

    tg.appendChild(textEl);
    wheelGroup.appendChild(tg);
  });
}


// === Animation ===
function animateSvgTo(targetDeg, duration = 6000) {
  return new Promise(res => {
    const g = document.getElementById('wheelGroup');
    const start = currentDeg;
    const t0 = performance.now();
	function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }
    function frame(t) {
      const p = Math.min((t - t0) / duration, 1);
      const eased = easeOutCubic(p);
      const cur = start + (targetDeg - start) * eased;
	  if (Math.abs(cur - lastTickAngle) >= tickAngleStep) {
		  lastTickAngle = cur;
		  tickAudio.currentTime = 0;
		  tickAudio.play().catch(() => {});
		}
      g.setAttribute('transform', `rotate(${cur} 200 200)`);
      if (p < 1) requestAnimationFrame(frame);
      else { 
	  currentDeg = targetDeg; 
	  g.setAttribute('transform', `rotate(${currentDeg} 200 200)`);
	          tickAudio.currentTime = 0;
        tickAudio.play().catch(() => {});
	  res();
	  }
    }
    requestAnimationFrame(frame);
  });
}

// === Logging spin ===
async function logSpin(id, text) {
	//throw new Error('Simulated logging failure');
  const ipData = await fetch(
    'https://sajqgagcsritkjifnicr.supabase.co/functions/v1/get-ip'
  ).then(r => r.json()).catch(() => ({ ip: 'unknown' }));
  await _supabase.from('log').insert([{ id_gift: id, text, ip_user: ipData.ip }]);
}

// === Spin handler ===
async function spin() {
  const btn = document.querySelector('.roulette .button');
  const wheelEl  = document.querySelector('.roulette');  
  const body    = document.body;
  
    if (items.every(it => it.count === 0)) {
    document.getElementById('no-prizes').classList.remove('hidden');
    return; 
  }
  
  if (btn.disabled) return;
  wheelEl.classList.add('busy');
  body.classList.add('busy');
  btn.disabled = true;
  
  

  items = await fetchGifts();
  renderSvgWheel(items);

  const total = items.reduce((s, it) => it.count > 0 ? s + it.chance : s, 0);
  let r = Math.random() * total;
  let winner = 0;
  for (let i = 0; i < items.length; i++) {
    if (items[i].count > 0) {
      r -= items[i].chance;
      if (r <= 0) { winner = i; break; }
    }
  }

  const delta = 360 / items.length;
  const centerAng = (winner + 0.5) * delta;
  const norm = ((currentDeg % 360) + 360) % 360;
  const arrowAngle = 270;
  let desired = arrowAngle - (norm + centerAng);
  desired = ((desired % 360) + 360) % 360;
  const target = currentDeg + 6 * 360 + desired;

  const logPromise = logSpin(items[winner].id, items[winner].text)
    .catch(err => {
      console.error('Ошибка при записи лога:', err);
	  document.getElementById('err').classList.remove('hidden');
    });

  await animateSvgTo(target);
  //await logSpin(items[winner].id, items[winner].text);

  const prize = items[winner];
const popup = document.getElementById('popup-result');
// собираем HTML: можно стилизовать под свой .popup-content
popup.innerHTML = `
  <div class="congr">Вітаємо!</div>
  <div class="congr2">Ви виграли:</div>
  <div class="congr2d ${prize.class || ''}">${prize.fulltext}</div>
  <div class="congr3 ${prize.class || ''}">${prize.text}</div>
  ${prize.icon ? `<img src="${baseUrl + prize.icon}" alt="icon" class="popup-icon">` : ''}
`;
  
  
  
  document.getElementById('popup').classList.remove('hidden');
    wheelEl.classList.remove('busy');
	body.classList.remove('busy');
  btn.disabled = false;
}

function scaleRouletteToWrapper() {
  const baseSize = 400;
  const wrapper = document.querySelector('.roulette-wrapper'); // main  .roulette-wrapper
  const roulette = document.querySelector('.roulette'); // wrapper   .roulette

  const wrapperWidth = wrapper.offsetWidth;
  const wrapperHeight = wrapper.offsetHeight;

  const scale = Math.min(wrapperWidth, wrapperHeight) / baseSize;

  roulette.style.transform = `scale(${scale})`;
}


// Масштабувати рулетку при зміні розміру вікна
window.addEventListener('resize', scaleRouletteToWrapper);


// === Events ===
document.querySelector('.roulette .button').addEventListener('click', spin);
document.getElementById('popup-close').addEventListener('click', () => {
  document.getElementById('popup').classList.add('hidden');
});

// === Initial render ===
window.addEventListener('load', async () => {
  items = await fetchGifts();
  renderSvgWheel(items);
  scaleRouletteToWrapper();
  hidePreloader();
});
