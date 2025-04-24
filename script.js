  const { createClient } = supabase
  const _supabase = createClient('https://sajqgagcsritkjifnicr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhanFnYWdjc3JpdGtqaWZuaWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjA3MTQsImV4cCI6MjA2MDYzNjcxNH0.39Hz8Ql39niAlAvk4rTvMgcF0AfwGTdXM_erUU95NGg')


async function getIp() {
  try {
    const response = await fetch('https://sajqgagcsritkjifnicr.supabase.co/functions/v1/get-ip');
    const data = await response.json();
    return data.ip || 'unknown';  // Повертаємо IP або 'unknown', якщо IP не знайдено
  } catch (error) {
    console.error('Error fetching IP:', error);
    return 'unknown'; // Якщо не вдалося отримати IP, повертаємо 'unknown'
  }
}

async function saveLog(text) {
  const ip = await getIp(); // Отримуємо IP через API або іншим способом

  // Викликаємо insert і чекаємо відповідь
  const { data, error } = await _supabase
    .from('log')
    .insert([{ id_gift: text.id, text: text.text, ip_user: ip }]);

  if (error) {
    console.error('Error saving log:', error);
    return; // Якщо сталася помилка, припиняємо виконання
  }

  // Після успішного збереження логу, оновлюємо таблицю gifts
  const { data: updateData, error: updateError } = await _supabase
    .from('gifts')
    .select('count')
    .eq('id', text.id); // Отримуємо поточне значення count для цього id

  if (updateError) {
    console.error('Error fetching current gift count:', updateError);
    return;
  }

  if (updateData.length > 0) {
    const currentCount = updateData[0].count;
    const { data: updatedGift, error: updateGiftError } = await _supabase
      .from('gifts')
      .update({ count: currentCount - 1 })  // Зменшуємо count на 1
      .eq('id', text.id); // Оновлюємо запис за id

    if (updateGiftError) {
      console.error('Error updating gift count:', updateGiftError);
    } else {
      console.log('Gift count updated successfully:', updatedGift);
      return 'ok'; // Повертаємо успішний результат
    }
  } else {
    console.error('No gift found for id:', text.id);
    return;
  }
}


async function getSpinStats() {
  // Запитуємо таблицю spin_stats, щоб отримати статистику виграшів
  const { data, error } = await _supabase
    .from('spin_stats')
    .select('*');  // Отримуємо всі записи з таблиці spin_stats

  const stats = {};
  if (error) {
    console.error('Error fetching spin stats:', error);
  } else {
    // Перетворюємо отримані дані в об'єкт, де кожен key - це text, а значення - це won
    data.forEach(item => {
      stats[item.text] = item.won;
    });
  }
  return stats;
}



async function fetchGifts() {
  const stats = await getSpinStats(); // Отримуємо статистику

  const { data, error } = await _supabase
    .from('gifts')
    .select('*')
    .order('sort_order', { ascending: true }); // Сортуємо за порядком
	


  if (error) {
    console.error('Error fetching gifts:', error);
  } else {
    // Оновлюємо шанси виграшу
    data.forEach(gift => {
      gift.adjusted_chance = (gift.count_static > 0)
        ? gift.chance * (gift.count / gift.count_static)
        : 0;
      gift.won = stats[gift.text] || 0;
    });

    console.log('Fetched gifts:', data);
    return data;
  }
}

// === ОНОВЛЕНИЙ script.js (v3.1) з логуванням до обертання ===
const url = 'https://sajqgagcsritkjifnicr.supabase.co/storage/v1/object/public/gremio/'
// ⏯️ Попередня активація звуку при першому кліку
const tickAudio = new Audio("https://sajqgagcsritkjifnicr.supabase.co/storage/v1/object/public/gremio//tick.mp3");
tickAudio.volume = 1;
document.body.addEventListener('click', () => {
  tickAudio.play().then(() => {
    tickAudio.pause();
    tickAudio.currentTime = 0;
  }).catch(err => {
    console.warn("Tick sound play failed:", err);
  });
}, { once: true });

let tickAngleStep = 35; // 🎯 змінюй для частоти тикань (в градусах)

// Оновлений метод logSpinResult
async function logSpinResult(item, index) {

const data = {
  id: item.id,
  text: item.text
};
  // Викликаємо saveLog для збереження логу в Supabase і чекаємо відповіді
  try {
    const response = await saveLog(data);  // Викликаємо saveLog і чекаємо відповідь
	console.log(response);
    // Перевіряємо, чи є успішний статус відповіді
    if (response !== 'ok') {
      console.error('❌ Log not saved:', response );
      return; // Якщо немає відповіді або статус не 201, припиняємо виконання
    }

    // Якщо все добре і відповідь є, виконуємо обертання
    console.log('Log saved:', response);
    //self._doSpin(index);
  } catch (err) {
    console.error('❌ Fetch error:', err); // Виводимо помилку, якщо вона сталася
  }
}



var RouletteWheel = function(el, items) {
  this.$el = $(el);
  this.items = items || [];
  this._bis = false;
  this._angle = 0;
  this._index = 0;
  this.options = { angleOffset: -90 };
};
_.extend(RouletteWheel.prototype, Backbone.Events);


// === Добавляем фейковое вращение ===
RouletteWheel.prototype.startFakeSpin = function() {
  const self = this;
  const $spinner = self.$el.find('.spinner');
  self.fakeAngle = 0;

  if (self.fakeSpinInterval) clearInterval(self.fakeSpinInterval);

  self.fakeSpinInterval = setInterval(() => {
    self.fakeAngle = (self.fakeAngle + 10) % 360;
    $spinner.css('transform', `rotate(${self.fakeAngle}deg)`);
  }, 50);
};

RouletteWheel.prototype.stopFakeSpin = function() {
  const self = this;
  if (self.fakeSpinInterval) {
    clearInterval(self.fakeSpinInterval);
    self.fakeSpinInterval = null;
  }
};


RouletteWheel.prototype.refreshItems = function() {
  // Викликаємо функцію fetchGifts() з іншого файлу
  return fetchGifts()
    .then(data => {
      this.items = data.map(item => {
        let chance = parseFloat(item.adjusted_chance || item.chance || 0);
        let won = parseInt(item.won || 0);
        if (won === 0) chance *= 1.5;
        return {
          id: item.id,
          type: item.type,
          text: item.text,
          class: item.class,
          icon: item.icon,
          chance: chance,
          count: item.count
        };
      });
    })
    .catch(err => {
      console.error("Refresh error:", err);
    });
};

RouletteWheel.prototype.weightedRandom = function() {
  const items = this.items;
  const totalChance = items.reduce((sum, item) => sum + (item.count > 0 ? item.chance : 0), 0);
  let rand = Math.random() * totalChance;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const chance = item.count > 0 ? item.chance : 0;
    rand -= chance;
    if (rand <= 0) return i;
  }
  return items.length - 1;
};

RouletteWheel.prototype.spin = function(_index) {
  const self = this;
  if (this.$el.hasClass('busy')) return;

  self.$el.addClass('busy');
  self.startFakeSpin(); // запускаем фейковое вращение сразу

  this.refreshItems().then(() => {
    let index = _index;
    if (isNaN(parseInt(index)) || !self.items[index] || self.items[index].count <= 0) {
      index = self.weightedRandom();
    }

    const item = self.items[index];
    const data = { id: item.id, text: item.text };

    logSpinResult(data, index).then(() => {
      self._doSpin(index); // запускаем финальную анимацию
    }).catch(err => {
      console.error("❌ Fetch error:", err);
      self.stopFakeSpin();
      self.$el.removeClass('busy');
    });
  });
};

RouletteWheel.prototype._doSpin = function(_index) {
  const self = this;
  const count = this.items.length;
  const delta = 360 / count;
  const $spinner = self.$el.find('.spinner');

  let raf;
  const totalDuration = 6000;
  const startTime = performance.now();
  let startAngle = self.fakeAngle || 0; // начинаем с текущего угла

  const sectorAngle = _index * delta;
  const normalizedStart = startAngle % 360;
  const deltaToTarget = (sectorAngle - normalizedStart + 360) % 360;
  const finalAngle = startAngle + deltaToTarget + 6 * 360;

  function easeOutExpo(t, b, c, d) {
    return (t === d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
  }

  let lastTickedAngle = startAngle;

  const animate = (now) => {
    const elapsed = now - startTime;
    if (elapsed < totalDuration) {
      const easedAngle = easeOutExpo(elapsed, startAngle, finalAngle - startAngle, totalDuration);

      if (Math.abs(easedAngle - lastTickedAngle) >= tickAngleStep) {
        lastTickedAngle = easedAngle;
        tickAudio.currentTime = 0;
        tickAudio.play().catch(() => {});
      }

      $spinner.css('transform', `rotate(${easedAngle}deg)`);
      raf = requestAnimationFrame(animate);
    } else {
      $spinner.css('transform', `rotate(${finalAngle}deg)`);
      self.$el.removeClass('busy');
      self.trigger('spin:end', self);
    }
  };

  self._angle = finalAngle;
  self._index = _index;

  self.stopFakeSpin(); // отключаем фейковое вращение плавно

  self.trigger('spin:start', self);
  requestAnimationFrame(animate);
};


RouletteWheel.prototype.render = function() {
  
  const $spinner = this.$el.find('.spinner');
  const D = this.$el.width();
  const R = D * 0.5;
  const count = this.items.length;
  const delta = 360 / count;
  const colors = ['#ff5408', '#202020'];

  for (let i = 0; i < count; i++) {
    const item = this.items[i];
    const html = `
      <div class="item" data-index="${i}" data-type="${item.type}">
        <span class="label">
          ${item.icon ? `<img src="${url}${item.icon}" class="prize-icon" alt="icon">` : ""}
          <span class="text ${item.class || ''}">${item.text}</span>
        </span>
      </div>
    `;
    const $item = $(html);
    const borderTopWidth = D + D * 0.0025;
    const deltaInRadians = delta * Math.PI / 180;
    const borderRightWidth = D / (1 / Math.tan(deltaInRadians));
    const r = delta * (count - i) + this.options.angleOffset - delta * 0.5;
    const color = colors[i % 2];

    $item.css({
      borderTopWidth,
      borderRightWidth,
      transform: `scale(2) rotate(${r}deg)`,
      borderTopColor: color
    });

    const textHeight = parseInt(((2 * Math.PI * R) / count) * .5);

    $item.find('.label').css({
      transform: `translateY(${D * -0.29}px) translateX(${textHeight * 1.15}px) rotateZ(${90 + delta * .5}deg)`,
      height: `${textHeight}px`,
      lineHeight: `${textHeight}px`,
      textIndent: `${R * .1}px`
    });

    $spinner.append($item);
  }

  $spinner.css({ fontSize: `${parseInt(R * 0.06)}px` });
};

RouletteWheel.prototype.bindEvents = function() {
  this.$el.find('.button').on('click', $.proxy(this.spin, this));
};

$(window).ready(function() {
  // Викликаємо вашу функцію fetchGifts() замість fetch()
  fetchGifts()
    .then(fetchedData => {
      console.log('Received data from fetchGifts:', fetchedData); // Логування отриманих даних

      // Перевіряємо, чи отримані дані є масивом
      if (!Array.isArray(fetchedData)) {
        console.error("Received data is not an array:", fetchedData);
        return; // Якщо дані не є масивом, зупиняємо виконання
      }

      // Форматуємо дані для рулетки
      const formattedData = fetchedData.map(item => ({
        id: item.id,
        type: item.type,
        text: item.text,
        class: item.class,
        icon: item.icon,
        chance: parseFloat(item.adjusted_chance || item.chance || 0),
        count: item.count
      }));

      console.log('Formatted data:', formattedData);

      // Створення екземпляру рулетки та рендеринг
      spinner = new RouletteWheel($('.roulette'), formattedData);
      spinner.render();
      spinner.bindEvents();


      // Після повного завантаження і рендеру:
      document.getElementById('preloader').style.display = 'none';
      // Подія при старті обертання
      spinner.on('spin:start', function(r) {
        console.log('spin start!');
      });

      // Подія при закінченні обертання
      spinner.on('spin:end', function(r) {
        const item = spinner.items[r._index];
        document.getElementById('popup-result').innerHTML = `
          <div class="congr">Вітаємо!</div>
          <div class="congr2">Ви виграли:</div>
          <div class="congr3 ${item.class || ''}">${item.text}</div>
          ${item.icon ? `<img src="${url}${item.icon}" alt="icon" style="max-width: 120px; margin-top: 10px;">` : ''}
        `;
        document.getElementById('popup').classList.remove('hidden');
      });

      // Закриття спливаючого вікна
      document.getElementById('popup-close').addEventListener('click', function () {
        document.getElementById('popup').classList.add('hidden');
      });


      // Масштабування рулетки під розмір контейнера
      scaleRouletteToWrapper();

    })
    .catch(err => {
      console.error("Ошибка при загрузке данных рулетки:", err);
    });
	
});

function scaleRouletteToWrapper() {
  const baseSize = 400;
  const wrapper = document.querySelector('.roulette-wrapper');
  const roulette = document.querySelector('.roulette');

  const wrapperWidth = wrapper.offsetWidth;
  const wrapperHeight = wrapper.offsetHeight;

  const scale = Math.min(wrapperWidth, wrapperHeight) / baseSize;

  roulette.style.transform = `scale(${scale})`;
}


// Масштабувати рулетку при зміні розміру вікна
window.addEventListener('resize', scaleRouletteToWrapper);
