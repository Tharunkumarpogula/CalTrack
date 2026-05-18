/**
 * CalTrack — Nutrition Calculator
 * Vanilla ES6+ modular logic
 */

const STORAGE_KEY = 'caltrack_last_calc';

const MACRO_SPLIT = {
  protein: { pct: 0.3, calPerGram: 4 },
  carbs: { pct: 0.4, calPerGram: 4 },
  fats: { pct: 0.3, calPerGram: 9 },
};

const GOAL_ADJUST = {
  lose: -500,
  maintain: 0,
  gain: 500,
};

/** @type {{ weight: string, height: string }} */
const units = { weight: 'kg', height: 'cm' };

// --- Unit conversion ---

function lbsToKg(lbs) {
  return lbs / 2.20462;
}

function kgToLbs(kg) {
  return kg * 2.20462;
}

function ftInToCm(feet, inches) {
  const totalInches = feet * 12 + inches;
  return totalInches * 2.54;
}

function cmToFtIn(cm) {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches: inches === 12 ? 0 : inches };
}

function getWeightKg() {
  const raw = parseFloat(document.getElementById('weight').value);
  if (Number.isNaN(raw) || raw <= 0) return null;
  return units.weight === 'kg' ? raw : lbsToKg(raw);
}

function getHeightCm() {
  if (units.height === 'cm') {
    const raw = parseFloat(document.getElementById('height-cm').value);
    if (Number.isNaN(raw) || raw <= 0) return null;
    return raw;
  }
  const ft = parseInt(document.getElementById('height-ft').value, 10);
  const inches = parseInt(document.getElementById('height-in').value, 10) || 0;
  if (Number.isNaN(ft) || ft <= 0) return null;
  return ftInToCm(ft, inches);
}

// --- Calculations ---

function calculateBMR(weightKg, heightCm, age, gender) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

function calculateTDEE(bmr, activityMultiplier) {
  return bmr * activityMultiplier;
}

function applyGoal(tdee, goal) {
  return Math.round(tdee + GOAL_ADJUST[goal]);
}

function calculateMacros(calories) {
  return {
    protein: Math.round((calories * MACRO_SPLIT.protein.pct) / MACRO_SPLIT.protein.calPerGram),
    carbs: Math.round((calories * MACRO_SPLIT.carbs.pct) / MACRO_SPLIT.carbs.calPerGram),
    fats: Math.round((calories * MACRO_SPLIT.fats.pct) / MACRO_SPLIT.fats.calPerGram),
  };
}

function calculateWaterLiters(weightKg) {
  return Math.round((weightKg * 35) / 100) / 10;
}

function getMicronutrients(gender, age) {
  const isFemale = gender === 'female';
  const isOlder = age >= 51;

  return [
    { name: 'Vitamin A', value: isFemale ? '700 mcg' : '900 mcg' },
    { name: 'Vitamin C', value: isFemale ? '75 mg' : '90 mg' },
    { name: 'Vitamin D', value: isOlder ? '20 mcg' : '15 mcg' },
    { name: 'Vitamin B12', value: '2.4 mcg' },
    { name: 'Iron', value: isFemale && age < 51 ? '18 mg' : '8 mg' },
    { name: 'Calcium', value: isOlder ? '1,200 mg' : '1,000 mg' },
    { name: 'Potassium', value: isFemale ? '2,600 mg' : '3,400 mg' },
    { name: 'Magnesium', value: isFemale ? '320 mg' : '420 mg' },
    { name: 'Zinc', value: isFemale ? '8 mg' : '11 mg' },
  ];
}

// --- Formatting ---

function formatNumber(num, decimals = 0) {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// --- Validation ---

function validateForm() {
  const errors = [];
  const age = parseInt(document.getElementById('age').value, 10);
  const gender = document.querySelector('input[name="gender"]:checked');
  const activity = document.getElementById('activity').value;
  const goal = document.querySelector('input[name="goal"]:checked');
  const weightKg = getWeightKg();
  const heightCm = getHeightCm();

  if (!age || age < 15 || age > 100) errors.push('Enter a valid age (15–100).');
  if (!gender) errors.push('Select your gender.');
  if (!weightKg) errors.push('Enter a valid weight.');
  if (!heightCm || heightCm < 50 || heightCm > 280) errors.push('Enter a valid height.');
  if (!activity) errors.push('Select an activity level.');
  if (!goal) errors.push('Select a goal.');

  return errors;
}

function showFormError(message) {
  const el = document.getElementById('form-error');
  if (message) {
    el.textContent = message;
    el.hidden = false;
  } else {
    el.hidden = true;
    el.textContent = '';
  }
}

// --- Animations ---

function animateCounter(element, target, duration = 1500, decimals = 0) {
  const start = performance.now();
  const from = 0;

  function frame(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = from + (target - from) * eased;
    element.textContent = formatNumber(
      decimals ? current : Math.round(current),
      decimals
    );
    if (progress < 1) requestAnimationFrame(frame);
    else element.textContent = formatNumber(target, decimals);
  }

  requestAnimationFrame(frame);
}

function animateProgressBars() {
  document.querySelectorAll('.progress-track').forEach((track) => {
    const target = parseFloat(track.dataset.target) || 0;
    const fill = track.querySelector('.progress-fill');
    fill.style.width = '0';
    requestAnimationFrame(() => {
      fill.style.width = `${target}%`;
      track.setAttribute('aria-valuenow', String(target));
    });
  });
}

function animateDonutChart() {
  const chart = document.querySelector('.donut-chart');
  if (!chart) return;

  const proteinDeg = 360 * 0.3;
  const carbsDeg = 360 * 0.4;
  const proteinEnd = proteinDeg;
  const carbsEnd = proteinDeg + carbsDeg;

  chart.style.setProperty('--protein-deg', '0deg');
  chart.style.setProperty('--carbs-end', '0deg');
  chart.style.setProperty('--fats-end', '0deg');
  chart.classList.remove('animated');

  requestAnimationFrame(() => {
    chart.classList.add('animated');
    setTimeout(() => {
      chart.style.setProperty('--protein-deg', `${proteinEnd}deg`);
    }, 100);
    setTimeout(() => {
      chart.style.setProperty('--carbs-end', `${carbsEnd}deg`);
    }, 400);
    setTimeout(() => {
      chart.style.setProperty('--fats-end', '360deg');
    }, 700);
  });
}

// --- Results UI ---

function renderMicronutrients(micros) {
  const list = document.getElementById('micros-list');
  list.innerHTML = micros
    .map(
      (m) =>
        `<li class="micro-item"><span class="micro-name">${m.name}</span><span class="micro-value">${m.value}</span></li>`
    )
    .join('');
}

function displayResults(data) {
  const {
    name,
    calories,
    bmr,
    tdee,
    macros,
    water,
    micros,
  } = data;

  const placeholder = document.getElementById('results-placeholder');
  const panel = document.getElementById('results-panel');
  const greeting = document.querySelector('.results-greeting');

  placeholder.classList.add('hidden');
  panel.removeAttribute('hidden');
  panel.classList.remove('visible');
  void panel.offsetWidth;
  panel.classList.add('visible');

  greeting.textContent = name
    ? `${name}'s Daily Plan`
    : 'Your Daily Plan';

  const caloriesEl = document.getElementById('calories-display');
  caloriesEl.dataset.target = calories;
  animateCounter(caloriesEl, calories);

  document.getElementById('bmr-display').textContent = `${formatNumber(Math.round(bmr))} kcal`;
  document.getElementById('tdee-display').textContent = `${formatNumber(Math.round(tdee))} kcal`;

  animateCounter(document.getElementById('protein-g'), macros.protein, 1500);
  animateCounter(document.getElementById('carbs-g'), macros.carbs, 1500);
  animateCounter(document.getElementById('fats-g'), macros.fats, 1500);

  document.getElementById('protein-pct').textContent = '30%';
  document.getElementById('carbs-pct').textContent = '40%';
  document.getElementById('fats-pct').textContent = '30%';

  document.getElementById('protein-bar').dataset.target = '30';
  document.getElementById('carbs-bar').dataset.target = '40';
  document.getElementById('fats-bar').dataset.target = '30';

  document.querySelectorAll('.progress-fill').forEach((f) => {
    f.style.width = '0';
  });

  setTimeout(() => {
    animateProgressBars();
    animateDonutChart();
  }, 200);

  const waterEl = document.getElementById('water-display');
  animateCounter(waterEl, water, 1500, 1);

  renderMicronutrients(micros);

  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function runCalculation() {
  const errors = validateForm();
  if (errors.length) {
    showFormError(errors[0]);
    return;
  }
  showFormError('');

  const age = parseInt(document.getElementById('age').value, 10);
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const activity = parseFloat(document.getElementById('activity').value);
  const goal = document.querySelector('input[name="goal"]:checked').value;
  const name = document.getElementById('name').value.trim();
  const weightKg = getWeightKg();
  const heightCm = getHeightCm();

  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const tdee = calculateTDEE(bmr, activity);
  const calories = applyGoal(tdee, goal);
  const macros = calculateMacros(calories);
  const water = calculateWaterLiters(weightKg);
  const micros = getMicronutrients(gender, age);

  const result = {
    name,
    age,
    gender,
    activity,
    goal,
    weightKg,
    heightCm,
    bmr,
    tdee,
    calories,
    macros,
    water,
    micros,
    units: { ...units },
  };

  saveToStorage(result);
  displayResults(result);
}

// --- LocalStorage ---

function saveToStorage(data) {
  try {
    const payload = {
      form: collectFormState(),
      result: {
        calories: data.calories,
        bmr: data.bmr,
        tdee: data.tdee,
        macros: data.macros,
        water: data.water,
        micros: data.micros,
        name: data.name,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

function collectFormState() {
  return {
    name: document.getElementById('name').value,
    age: document.getElementById('age').value,
    gender: document.querySelector('input[name="gender"]:checked')?.value,
    weight: document.getElementById('weight').value,
    heightCm: document.getElementById('height-cm').value,
    heightFt: document.getElementById('height-ft').value,
    heightIn: document.getElementById('height-in').value,
    activity: document.getElementById('activity').value,
    goal: document.querySelector('input[name="goal"]:checked')?.value,
    units: { ...units },
  };
}

function restoreFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const { form, result } = JSON.parse(raw);
    if (!form) return;

    if (form.name) document.getElementById('name').value = form.name;
    if (form.age) document.getElementById('age').value = form.age;
    if (form.gender) {
      const radio = document.querySelector(`input[name="gender"][value="${form.gender}"]`);
      if (radio) radio.checked = true;
    }
    if (form.weight) document.getElementById('weight').value = form.weight;
    if (form.heightCm) document.getElementById('height-cm').value = form.heightCm;
    if (form.heightFt) document.getElementById('height-ft').value = form.heightFt;
    if (form.heightIn) document.getElementById('height-in').value = form.heightIn;
    if (form.activity) document.getElementById('activity').value = form.activity;
    if (form.goal) {
      const goalRadio = document.querySelector(`input[name="goal"][value="${form.goal}"]`);
      if (goalRadio) goalRadio.checked = true;
    }

    if (form.units) {
      units.weight = form.units.weight || 'kg';
      units.height = form.units.height || 'cm';
      syncUnitButtons();
      toggleHeightInputs();
    }

    if (result) {
      displayResults({
        name: result.name,
        calories: result.calories,
        bmr: result.bmr,
        tdee: result.tdee,
        macros: result.macros,
        water: result.water,
        micros: result.micros,
      });
    }
  } catch {
    /* corrupt data */
  }
}

// --- Unit toggles ---

function syncUnitButtons() {
  document.querySelectorAll('.unit-btn').forEach((btn) => {
    const type = btn.dataset.unit;
    const value = btn.dataset.value;
    const active = units[type] === value;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

function toggleHeightInputs() {
  const group = document.querySelector('.height-group');
  const cmWrap = document.querySelector('.height-cm-wrap');
  const ftWrap = document.querySelector('.height-ft-wrap');
  const cmInput = document.getElementById('height-cm');

  if (units.height === 'cm') {
    group.dataset.heightUnit = 'cm';
    cmWrap.classList.remove('hidden');
    ftWrap.classList.add('hidden');
    cmInput.required = true;
  } else {
    group.dataset.heightUnit = 'ft';
    cmWrap.classList.add('hidden');
    ftWrap.classList.remove('hidden');
    cmInput.required = false;
  }
}

function convertWeightOnToggle(newUnit) {
  const input = document.getElementById('weight');
  const val = parseFloat(input.value);
  if (Number.isNaN(val) || val <= 0) return;

  if (units.weight === 'kg' && newUnit === 'lbs') {
    input.value = Math.round(kgToLbs(val) * 10) / 10;
  } else if (units.weight === 'lbs' && newUnit === 'kg') {
    input.value = Math.round(lbsToKg(val) * 10) / 10;
  }
}

function convertHeightOnToggle(newUnit) {
  const cmInput = document.getElementById('height-cm');
  const ftInput = document.getElementById('height-ft');
  const inInput = document.getElementById('height-in');

  if (units.height === 'cm' && newUnit === 'ft') {
    const cm = parseFloat(cmInput.value);
    if (!Number.isNaN(cm) && cm > 0) {
      const { feet, inches } = cmToFtIn(cm);
      ftInput.value = feet;
      inInput.value = inches;
    }
  } else if (units.height === 'ft' && newUnit === 'cm') {
    const ft = parseInt(ftInput.value, 10);
    const inches = parseInt(inInput.value, 10) || 0;
    if (!Number.isNaN(ft) && ft > 0) {
      cmInput.value = Math.round(ftInToCm(ft, inches) * 10) / 10;
    }
  }
}

function handleUnitToggle(btn) {
  const type = btn.dataset.unit;
  const newUnit = btn.dataset.value;
  if (units[type] === newUnit) return;

  if (type === 'weight') convertWeightOnToggle(newUnit);
  if (type === 'height') convertHeightOnToggle(newUnit);

  units[type] = newUnit;
  syncUnitButtons();
  if (type === 'height') toggleHeightInputs();
}

// --- UI init ---

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.animate-on-scroll').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.1}s`;
    observer.observe(el);
  });
}

function initParallax() {
  const heroBg = document.querySelector('.hero-bg');
  if (!heroBg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY * 0.25;
        heroBg.style.transform = `translateY(${y}px)`;
        ticking = false;
      });
    },
    { passive: true }
  );
}

function initForm() {
  const form = document.getElementById('calc-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runCalculation();
  });

  document.querySelectorAll('.unit-btn').forEach((btn) => {
    btn.addEventListener('click', () => handleUnitToggle(btn));
  });

  const calcBtn = document.querySelector('.btn-calc');
  calcBtn.addEventListener('click', () => {
    calcBtn.classList.add('clicked');
    setTimeout(() => calcBtn.classList.remove('clicked'), 300);
  });
}

function init() {
  initNav();
  initScrollAnimations();
  initParallax();
  initForm();
  toggleHeightInputs();
  restoreFromStorage();

  document.querySelectorAll('.animate-on-scroll').forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) el.classList.add('visible');
  });
}

document.addEventListener('DOMContentLoaded', init);
