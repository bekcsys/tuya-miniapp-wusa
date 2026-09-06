const MIN_F = 86;
const MAX_F = 150;
const GAUGE_ROOM_C = 28;
const GAUGE_MAX_C = 66;
const MIN_TIMER = 10;
const MAX_TIMER = 90;
const TIMER_INF = 91;
const ARC_START = 225;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sweepProgress(x, y, cx, cy) {
  const dx = x - cx;
  const dy = y - cy;
  const start = 0.75 * Math.PI;
  const sweep = 1.5 * Math.PI;
  const angle = Math.atan2(dy, dx);
  let delta = angle - start;
  while (delta < 0) {
    delta += Math.PI * 2;
  }
  while (delta >= Math.PI * 2) {
    delta -= Math.PI * 2;
  }
  if (delta <= sweep) {
    return delta / sweep;
  }
  const toEnd = delta - sweep;
  const toStart = Math.PI * 2 - delta;
  return toStart < toEnd ? 0 : 1;
}

function toC(tempF) {
  return Math.round((tempF - 32) * 5 / 9);
}

function toF(tempC) {
  return Math.round(tempC * 9 / 5 + 32);
}

function gaugeProgress(tempF) {
  const tempC = clamp((tempF - 32) * 5 / 9, 0, GAUGE_MAX_C);
  if (tempC <= GAUGE_ROOM_C) {
    return tempC / GAUGE_ROOM_C / 3;
  }
  return 1 / 3 + (tempC - GAUGE_ROOM_C) / (GAUGE_MAX_C - GAUGE_ROOM_C) * 2 / 3;
}

function ringFillStyle(progress) {
  const fill = Math.max(1, progress * 270);
  return 'background: conic-gradient(from 225deg, #2b7cff 0deg, #e31b23 ' + fill + 'deg, #d8dee8 ' + fill + 'deg, #d8dee8 270deg, transparent 270deg, transparent 360deg);';
}

function formatTemp(tempF, unit) {
  if (unit === 'C') {
    return toC(tempF) + ' °C';
  }
  return Math.round(tempF) + ' °F';
}

function buildGaugeTicks() {
  const ticks = [];
  const count = 54;
  for (let i = 0; i <= count; i++) {
    const major = i % 9 === 0;
    ticks.push({
      key: 't' + i,
      deg: ARC_START + (i / count) * 270,
      tickClass: major ? 'g-tick g-tick-major' : 'g-tick',
    });
  }
  return ticks;
}

function tempCFromProgress(progress) {
  if (progress <= 1 / 3) {
    return progress * 3 * GAUGE_ROOM_C;
  }
  return GAUGE_ROOM_C + (progress - 1 / 3) * 3 / 2 * (GAUGE_MAX_C - GAUGE_ROOM_C);
}

function buildGaugeMarks(unit) {
  const steps = [0, 1 / 6, 1 / 3, 2 / 3, 1];
  return steps.map(function (progress, index) {
    const tempC = tempCFromProgress(progress);
    const deg = ARC_START + progress * 270;
    let label = unit === 'C' ? '' + Math.round(tempC) : '' + Math.round(tempC * 9 / 5 + 32);
    if (progress === 1) {
      label = unit === 'C' ? '66' : '150';
    }
    return {
      key: 'n' + index,
      deg: deg,
      rot: -deg,
      label: label,
    };
  });
}

function buildTempMarks(unit) {
  const marks = [];
  for (let i = 0; i < 5; i++) {
    const progress = i / 4;
    const tempF = MIN_F + progress * (MAX_F - MIN_F);
    const deg = ARC_START + progress * 270;
    marks.push({
      deg: deg,
      rot: -deg,
      label: unit === 'C' ? '' + toC(tempF) : '' + Math.round(tempF),
    });
  }
  return marks;
}

function isFeatureOn(state) {
  return !!(state.heaterOn || state.ledOn || state.readingLights || state.saltLights);
}

const SOLFEGGIO = [
  { hz: 174, name: 'Foundation', note: 'Pain relief' },
  { hz: 285, name: 'Healing', note: 'Tissue repair' },
  { hz: 396, name: 'Liberation', note: 'Release fear' },
  { hz: 417, name: 'Change', note: 'Clear energy' },
  { hz: 528, name: 'Love', note: 'Transformation' },
  { hz: 639, name: 'Connection', note: 'Relationships' },
  { hz: 741, name: 'Expression', note: 'Awakening' },
  { hz: 852, name: 'Intuition', note: 'Inner order' },
  { hz: 963, name: 'Divine', note: 'Higher mind' },
];

function buildToneList(toneHz, toneOn) {
  return SOLFEGGIO.map(function (item) {
    const selected = item.hz === toneHz;
    let cardClass = 'tone-card';
    if (selected && toneOn) {
      cardClass = 'tone-card tone-card-on';
    } else if (selected) {
      cardClass = 'tone-card tone-card-sel';
    }
    return {
      hz: item.hz,
      hzLabel: item.hz + ' Hz',
      name: item.name,
      note: item.note,
      src: '/assets/audio/solfeggio-' + item.hz + '.wav',
      cardClass: cardClass,
    };
  });
}

function buildHealthStats(state) {
  const sessionMin = state.timerMin >= TIMER_INF ? 45 : state.timerMin;
  const active = isFeatureOn(state);
  const hrBpm = state.heaterOn ? 88 : active ? 76 : 68;
  const kcal = active ? Math.round(sessionMin * (state.heaterOn ? 4.2 : 1.6)) : 0;
  const spo2 = state.heaterOn ? 97 : 99;
  const week = [28, 64, 40, 88, 52, 72, 36];
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = (new Date().getDay() + 6) % 7;
  const weekBars = week.map(function (value, index) {
    const on = index === today && active;
    return {
      key: 'd' + index,
      label: labels[index],
      height: value,
      barClass: on ? 'week-bar week-bar-on' : 'week-bar',
    };
  });
  return {
    hrBpm: '' + hrBpm,
    hrStatus: state.heaterOn ? 'Elevated' : 'Resting',
    kcalBurn: '' + kcal,
    spo2: spo2 + '%',
    spo2Status: 'Normal',
    healthMin: state.timerMin >= TIMER_INF ? 'infinite' : sessionMin + ' min',
    healthSessions: '' + (state.sessionRuns || 0),
    hydration: state.heaterOn ? 'Drink water after heat' : 'On track',
    weekBars: weekBars,
  };
}

function saveState(state) {
  if (typeof ty.setStorage === 'function') {
    ty.setStorage({
      key: 'saunaState',
      data: state,
    });
  }
}

function hsvColor(h, s, v) {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const val = clamp(v, 0, 100) / 100;
  const chroma = val * sat;
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = val - chroma;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) {
    r = chroma;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = chroma;
  } else if (hue < 180) {
    g = chroma;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = chroma;
  } else if (hue < 300) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  return {
    css: 'rgb(' + r + ',' + g + ',' + b + ')',
    hex: hex,
  };
}

Page({
  data: {
    statusBarHeight: 44,
    tempF: 150,
    currentTempF: 82,
    unit: 'F',
    timerMin: 45,
    timerLabel: '45 min',
    timerCapClass: 'timer-cap',
    timerSlider: 45,
    saunaOn: true,
    heaterOn: true,
    hue: 195,
    val: 100,
    ledOn: true,
    ledCss: 'rgb(38,217,255)',
    ledHex: '#26d9ff',
    ledOrbStyle: 'background-color: rgb(38,217,255); box-shadow: 0 0 28px rgb(38,217,255);',
    hueDeg: 195,
    spectrumClass: 'spectrum',
    ledMeterClass: 'led-meter',
    ledSliderDisabled: false,
    currentDisplay: '82 °F',
    targetDisplay: '150°F',
    gaugeTemp: '82',
    targetNum: '150',
    ringStyle: ringFillStyle(gaugeProgress(82)),
    knobDeg: ARC_START,
    targetKnobDeg: ARC_START + 270,
    tempMarks: buildTempMarks('F'),
    gaugeTicks: buildGaugeTicks(),
    gaugeMarks: buildGaugeMarks('F'),
    shutdownClass: 'shutdown-btn',
    shutdownLabel: 'Shut down sauna',
    heaterClass: 'io-switch io-on',
    heaterLabel: 'heater on',
    tempDisabled: false,
    tempBlockClass: 'adjust-block',
    unitMark: '°F',
    tempMin: 86,
    tempMax: 150,
    tempSlider: 150,
    tempMinLabel: '86°F',
    tempMaxLabel: '150°F',
    cSegClass: 'seg-off',
    fSegClass: 'seg-on',
    readingLights: false,
    saltLights: false,
    readingClass: 'light-btn light-off',
    colorClass: 'light-btn light-on',
    ledLabel: 'ON',
    ledToggleClass: 'io-switch io-on',
    saltClass: 'light-btn light-off',
    saltSwitchClass: 'io-switch io-off',
    readSwitchClass: 'io-switch io-off',
    setDisabled: false,
    adjustPanelClass: 'adjust-panel',
    navTab: 'sauna',
    saunaTabClass: 'tab-item tab-on',
    healthTabClass: 'tab-item',
    hrBpm: '88',
    hrStatus: 'Elevated',
    kcalBurn: '189',
    spo2: '97%',
    spo2Status: 'Normal',
    healthMin: '45 min',
    healthSessions: '0',
    sessionRuns: 0,
    hydration: 'Drink water after heat',
    weekBars: [],
    healthTips: [
      { key: 't1', text: 'Drink water before, during, and after your session.' },
      { key: 't2', text: 'Keep early sessions to 15-20 minutes.' },
      { key: 't3', text: 'Cool down slowly when you finish.' },
      { key: 't4', text: 'Step out if you feel dizzy or unwell.' },
    ],
    soundTabClass: 'tab-item',
    toneHz: 528,
    toneName: 'Love',
    toneNote: 'Transformation',
    toneOn: false,
    tonePlayLabel: 'Play',
    tonePlayClass: 'tone-play',
    toneVol: 80,
    toneList: buildToneList(528, false),
  },
  onLoad(query) {
    const sys = typeof ty.getSystemInfoSync === 'function' ? ty.getSystemInfoSync() : null;
    if (sys && sys.statusBarHeight) {
      this.setData({ statusBarHeight: sys.statusBarHeight });
    }
    const tempF = query && query.tempF ? parseInt(query.tempF, 10) : this.data.tempF;
    const saunaOn = query && query.saunaOn === '0' ? false : this.data.saunaOn;
    const heaterOn = query && query.heaterOn === '0' ? false : this.data.heaterOn;
    const unit = query && query.unit === 'C' ? 'C' : 'F';
    this.apply({
      tempF: clamp(tempF, MIN_F, MAX_F),
      heaterOn: saunaOn ? heaterOn : false,
      shutdown: !saunaOn,
      unit: unit,
    });
    this.loadSessionRuns();
    this.hidePhoneStatusBar();
  },
  onReady() {
    const sys = typeof ty.getSystemInfoSync === 'function' ? ty.getSystemInfoSync() : null;
    const width = sys && sys.windowWidth ? sys.windowWidth : 375;
    this.gaugeSize = (520 / 750) * width;
    this.spectrumSize = (360 / 750) * width;
    this.measureSpectrum();
    this.initAudio();
  },
  onShow() {
    this.measureSpectrum();
    this.hidePhoneStatusBar();
  },
  onHide() {
    this.stopTone();
  },
  onUnload() {
    this.stopTone();
    if (this.audio && typeof this.audio.destroy === 'function') {
      this.audio.destroy();
      this.audio = null;
    }
  },
  measureSpectrum() {
    if (typeof ty.createSelectorQuery !== 'function') {
      return;
    }
    const self = this;
    ty.createSelectorQuery()
      .in(this)
      .select('#spectrum')
      .boundingClientRect(function (rect) {
        if (rect && rect.width) {
          self.spectrumRect = rect;
          self.spectrumSize = rect.width;
        }
      })
      .exec();
  },
  pointToBand(x, y) {
    const size = this.gaugeSize || 260;
    const cx = size / 2;
    const cy = size / 2;
    const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
    const ratio = dist / size;
    if (ratio >= 0.36 && ratio <= 0.54) {
      return 'temp';
    }
    return null;
  },
  valueFromPoint(x, y) {
    const size = this.gaugeSize || 260;
    const progress = sweepProgress(x, y, size / 2, size / 2);
    const rawF = MIN_F + progress * (MAX_F - MIN_F);
    if (this.data.unit === 'C') {
      return clamp(toF(toC(rawF)), MIN_F, MAX_F);
    }
    return clamp(Math.round(rawF), MIN_F, MAX_F);
  },
  readTouch(e) {
    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    if (!touch || typeof touch.x !== 'number') {
      return null;
    }
    return { x: touch.x, y: touch.y };
  },
  onGaugeStart(e) {
    if (!this.data.saunaOn) {
      this.dragging = null;
      return;
    }
    const point = this.readTouch(e);
    if (!point) {
      this.dragging = null;
      return;
    }
    this.dragging = this.pointToBand(point.x, point.y);
    if (this.dragging === 'temp') {
      this.apply({ tempF: this.valueFromPoint(point.x, point.y) });
    }
  },
  onGaugeMove(e) {
    if (!this.dragging) {
      return;
    }
    const point = this.readTouch(e);
    if (!point) {
      return;
    }
    if (this.dragging === 'temp') {
      this.apply({ tempF: this.valueFromPoint(point.x, point.y) });
    }
  },
  onGaugeEnd() {
    this.dragging = null;
  },
  onAdjTouch() {
    this.dragging = null;
  },
  apply(patch) {
    const next = {
      tempF: this.data.tempF,
      currentTempF: this.data.currentTempF,
      unit: this.data.unit,
      timerMin: this.data.timerMin,
      saunaOn: this.data.saunaOn,
      heaterOn: this.data.heaterOn,
      readingLights: this.data.readingLights,
      saltLights: this.data.saltLights,
      hue: this.data.hue,
      val: this.data.val,
      ledOn: this.data.ledOn,
      sessionRuns: this.data.sessionRuns || 0,
    };
    if (typeof patch.tempF === 'number') {
      next.tempF = clamp(patch.tempF, MIN_F, MAX_F);
    }
    if (typeof patch.currentTempF === 'number') {
      next.currentTempF = patch.currentTempF;
    }
    if (patch.unit) {
      next.unit = patch.unit;
    }
    if (typeof patch.timerMin === 'number') {
      if (patch.timerMin >= TIMER_INF) {
        next.timerMin = TIMER_INF;
      } else {
        next.timerMin = clamp(patch.timerMin, MIN_TIMER, MAX_TIMER);
      }
    }
    if (typeof patch.saunaOn === 'boolean') {
      next.saunaOn = patch.saunaOn;
    }
    if (typeof patch.heaterOn === 'boolean') {
      if (patch.heaterOn && !next.heaterOn) {
        next.sessionRuns += 1;
      }
      next.heaterOn = patch.heaterOn;
    }
    if (typeof patch.sessionRuns === 'number') {
      next.sessionRuns = patch.sessionRuns;
    }
    if (typeof patch.readingLights === 'boolean') {
      next.readingLights = patch.readingLights;
    }
    if (typeof patch.saltLights === 'boolean') {
      next.saltLights = patch.saltLights;
    }
    if (typeof patch.hue === 'number') {
      next.hue = ((patch.hue % 360) + 360) % 360;
    }
    if (typeof patch.val === 'number') {
      next.val = clamp(patch.val, 0, 100);
    }
    if (typeof patch.ledOn === 'boolean') {
      next.ledOn = patch.ledOn;
    }
    if (patch.shutdown) {
      next.heaterOn = false;
      next.readingLights = false;
      next.saltLights = false;
      next.ledOn = false;
    }
    next.saunaOn = isFeatureOn(next);
    const isC = next.unit === 'C';
    const gaugeTemp = isC ? toC(next.currentTempF) : Math.round(next.currentTempF);
    const currentProgress = gaugeProgress(next.currentTempF);
    const progress = (next.tempF - MIN_F) / (MAX_F - MIN_F);
    const timerLabel = next.timerMin >= TIMER_INF ? 'infinite' : next.timerMin + ' min';
    const led = hsvColor(next.hue, 100, next.val);
    const health = buildHealthStats(next);
    this.setData({
      tempF: next.tempF,
      currentTempF: next.currentTempF,
      unit: next.unit,
      timerMin: next.timerMin,
      timerLabel: timerLabel,
      timerCapClass: next.timerMin >= TIMER_INF ? 'timer-cap timer-inf' : 'timer-cap',
      timerSlider: next.timerMin >= TIMER_INF ? 91 : next.timerMin,
      saunaOn: next.saunaOn,
      heaterOn: next.heaterOn,
      hue: next.hue,
      val: next.val,
      ledOn: next.ledOn,
      ledCss: led.css,
      ledHex: led.hex,
      ledOrbStyle: next.ledOn
        ? 'background-color: ' + led.css + '; box-shadow: 0 0 28px ' + led.css + ';'
        : 'background-color: #1a2a3a;',
      hueDeg: next.hue,
      spectrumClass: next.ledOn ? 'spectrum' : 'spectrum spectrum-dim',
      ledMeterClass: next.ledOn ? 'led-meter' : 'led-meter led-meter-off',
      ledSliderDisabled: !next.ledOn,
      currentDisplay: formatTemp(next.currentTempF, next.unit),
      targetDisplay: isC ? toC(next.tempF) + '°C' : next.tempF + '°F',
      gaugeTemp: '' + (isC ? toC(next.currentTempF) : Math.round(next.currentTempF)),
      targetNum: '' + (isC ? toC(next.tempF) : next.tempF),
      ringStyle: ringFillStyle(currentProgress),
      knobDeg: ARC_START + currentProgress * 270,
      targetKnobDeg: ARC_START + progress * 270,
      tempMarks: buildTempMarks(next.unit),
      gaugeMarks: buildGaugeMarks(next.unit),
      shutdownClass: next.saunaOn ? 'shutdown-btn' : 'shutdown-btn shutdown-btn-off',
      shutdownLabel: 'Shut down sauna',
      heaterClass: next.heaterOn ? 'io-switch io-on' : 'io-switch io-off',
      heaterLabel: next.heaterOn ? 'heater on' : 'heater off',
      unitMark: isC ? '°C' : '°F',
      tempMin: isC ? toC(MIN_F) : MIN_F,
      tempMax: isC ? toC(MAX_F) : MAX_F,
      tempSlider: isC ? toC(next.tempF) : next.tempF,
      tempMinLabel: isC ? toC(MIN_F) + '°C' : MIN_F + '°F',
      tempMaxLabel: isC ? toC(MAX_F) + '°C' : MAX_F + '°F',
      cSegClass: isC ? 'seg-on' : 'seg-off',
      fSegClass: isC ? 'seg-off' : 'seg-on',
      readingLights: next.readingLights,
      saltLights: next.saltLights,
      readingClass: next.readingLights ? 'light-btn light-on' : 'light-btn light-off',
      colorClass: next.ledOn ? 'light-btn light-on' : 'light-btn light-off',
      ledLabel: next.ledOn ? 'ON' : 'OFF',
      ledToggleClass: next.ledOn ? 'io-switch io-on' : 'io-switch io-off',
      saltClass: next.saltLights ? 'light-btn light-on' : 'light-btn light-off',
      saltSwitchClass: next.saltLights ? 'io-switch io-on' : 'io-switch io-off',
      readSwitchClass: next.readingLights ? 'io-switch io-on' : 'io-switch io-off',
      setDisabled: !next.saunaOn,
      tempDisabled: !next.heaterOn,
      tempBlockClass: next.heaterOn ? 'adjust-block' : 'adjust-block adjust-block-off',
      adjustPanelClass: next.saunaOn ? 'adjust-panel' : 'adjust-panel adjust-panel-off',
      hrBpm: health.hrBpm,
      hrStatus: health.hrStatus,
      kcalBurn: health.kcalBurn,
      spo2: health.spo2,
      spo2Status: health.spo2Status,
      healthMin: health.healthMin,
      healthSessions: health.healthSessions,
      sessionRuns: next.sessionRuns,
      hydration: health.hydration,
      weekBars: health.weekBars,
    });
    saveState({
      tempF: next.tempF,
      unit: next.unit,
      timerMin: next.timerMin,
      saunaOn: next.saunaOn,
      heaterOn: next.heaterOn,
      hue: next.hue,
      val: next.val,
      ledOn: next.ledOn,
      sessionRuns: next.sessionRuns,
    });
  },
  hidePhoneStatusBar() {
    const self = this;
    if (typeof ty.hideStatusBar !== 'function') {
      return;
    }
    ty.hideStatusBar({
      success: function () {
        self.setData({ statusBarHeight: 0 });
      },
    });
  },
  loadSessionRuns() {
    const self = this;
    if (typeof ty.getStorage === 'function') {
      ty.getStorage({
        key: 'saunaState',
        success: function (res) {
          const saved = res && res.data ? res.data : res;
          if (saved && typeof saved.sessionRuns === 'number') {
            self.apply({ sessionRuns: saved.sessionRuns });
          }
        },
      });
    }
  },
  goHome() {
    if (typeof ty.navigateBack === 'function') {
      ty.navigateBack();
    }
  },
  selectNav(e) {
    const tab = e.currentTarget.dataset.tab;
    if (!tab || tab === this.data.navTab) {
      return;
    }
    this.setData({
      navTab: tab,
      saunaTabClass: tab === 'sauna' ? 'tab-item tab-on' : 'tab-item',
      healthTabClass: tab === 'health' ? 'tab-item tab-on' : 'tab-item',
      soundTabClass: tab === 'sound' ? 'tab-item tab-on' : 'tab-item',
    });
  },
  initAudio(onReady) {
    if (this.audio) {
      if (typeof onReady === 'function') {
        onReady();
      }
      return;
    }
    if (typeof ty.createInnerAudioContext !== 'function') {
      return;
    }
    const created = ty.createInnerAudioContext();
    const self = this;
    if (created && typeof created.then === 'function') {
      created.then(function (ctx) {
        self.audio = ctx;
        if (typeof onReady === 'function') {
          onReady();
        }
      });
      return;
    }
    this.audio = created;
    if (typeof onReady === 'function') {
      onReady();
    }
  },
  stopTone() {
    if (this.audio && typeof this.audio.stop === 'function') {
      this.audio.stop();
    }
    this.setData({
      toneOn: false,
      tonePlayLabel: 'Play',
      tonePlayClass: 'tone-play',
      toneList: buildToneList(this.data.toneHz, false),
    });
  },
  playTone() {
    const self = this;
    const hz = this.data.toneHz;
    const src = '/assets/audio/solfeggio-' + hz + '.wav';
    const volume = this.data.toneVol / 100;
    const meta = SOLFEGGIO.filter(function (item) {
      return item.hz === hz;
    })[0] || SOLFEGGIO[4];
    this.setData({
      toneOn: true,
      toneName: meta.name,
      toneNote: meta.note,
      tonePlayLabel: 'Stop',
      tonePlayClass: 'tone-play tone-play-on',
      toneList: buildToneList(hz, true),
    });
    this.initAudio(function () {
      const ctx = self.audio;
      if (!ctx) {
        return;
      }
      if (typeof ctx.stop === 'function') {
        ctx.stop();
      }
      ctx.src = src;
      ctx.loop = true;
      ctx.volume = volume;
      if (typeof ctx.play === 'function') {
        ctx.play({
          src: src,
          loop: true,
          volume: volume,
        });
      }
    });
  },
  selectTone(e) {
    const hz = parseInt(e.currentTarget.dataset.hz, 10);
    if (!hz) {
      return;
    }
    const meta = SOLFEGGIO.filter(function (item) {
      return item.hz === hz;
    })[0];
    if (!meta) {
      return;
    }
    const keepPlaying = this.data.toneOn;
    this.setData({
      toneHz: hz,
      toneName: meta.name,
      toneNote: meta.note,
      toneList: buildToneList(hz, keepPlaying),
    });
    if (keepPlaying) {
      this.playTone();
    }
  },
  toggleTone() {
    if (this.data.toneOn) {
      this.stopTone();
      return;
    }
    this.playTone();
  },
  onToneVol(e) {
    const value = e.detail.value;
    this.setData({ toneVol: value });
    if (this.audio) {
      this.audio.volume = value / 100;
    }
  },
  setUnitF() {
    this.apply({ unit: 'F' });
  },
  setUnitC() {
    this.apply({ unit: 'C' });
  },
  toggleUnit() {
    this.apply({ unit: this.data.unit === 'F' ? 'C' : 'F' });
  },
  tempUp() {
    if (!this.data.heaterOn) {
      return;
    }
    if (this.data.unit === 'C') {
      this.apply({ tempF: clamp(toF(toC(this.data.tempF) + 1), MIN_F, MAX_F) });
      return;
    }
    this.apply({ tempF: clamp(this.data.tempF + 1, MIN_F, MAX_F) });
  },
  tempDown() {
    if (!this.data.heaterOn) {
      return;
    }
    if (this.data.unit === 'C') {
      this.apply({ tempF: clamp(toF(toC(this.data.tempF) - 1), MIN_F, MAX_F) });
      return;
    }
    this.apply({ tempF: clamp(this.data.tempF - 1, MIN_F, MAX_F) });
  },
  timerDown() {
    if (!this.data.saunaOn) {
      return;
    }
    if (this.data.timerMin >= TIMER_INF) {
      this.apply({ timerMin: MAX_TIMER });
      return;
    }
    this.apply({ timerMin: this.data.timerMin - 1 });
  },
  timerUp() {
    if (!this.data.saunaOn) {
      return;
    }
    if (this.data.timerMin >= TIMER_INF) {
      return;
    }
    if (this.data.timerMin >= MAX_TIMER) {
      this.apply({ timerMin: TIMER_INF });
      return;
    }
    this.apply({ timerMin: this.data.timerMin + 1 });
  },
  onTempSlide(e) {
    if (!this.data.heaterOn) {
      return;
    }
    const value = e.detail.value;
    this.apply({
      tempF: this.data.unit === 'C' ? toF(value) : value,
    });
  },
  onTimerSlide(e) {
    if (!this.data.saunaOn) {
      return;
    }
    const value = e.detail.value;
    this.apply({ timerMin: value >= 91 ? TIMER_INF : value });
  },
  toggleSauna() {
    if (!this.data.saunaOn) {
      return;
    }
    this.stopTone();
    this.apply({ shutdown: true });
  },
  toggleHeater() {
    this.apply({ heaterOn: !this.data.heaterOn });
  },
  toggleReading() {
    this.apply({ readingLights: !this.data.readingLights });
  },
  toggleSalt() {
    this.apply({ saltLights: !this.data.saltLights });
  },
  hueFromPoint(x, y) {
    const size = this.spectrumSize || 180;
    const cx = size / 2;
    const cy = size / 2;
    let deg = Math.atan2(x - cx, cy - y) * (180 / Math.PI);
    if (deg < 0) {
      deg += 360;
    }
    return Math.round(deg);
  },
  readSpectrumPoint(e) {
    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    const rect = this.spectrumRect;
    if (touch && rect && typeof touch.clientX === 'number') {
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    if (touch && typeof touch.x === 'number') {
      return { x: touch.x, y: touch.y };
    }
    if (e.detail && rect && typeof e.detail.x === 'number') {
      return { x: e.detail.x - rect.left, y: e.detail.y - rect.top };
    }
    if (e.detail && typeof e.detail.x === 'number') {
      return { x: e.detail.x, y: e.detail.y };
    }
    return null;
  },
  isHueRing(x, y) {
    const size = this.spectrumSize || 180;
    const dx = x - size / 2;
    const dy = y - size / 2;
    const ratio = Math.sqrt(dx * dx + dy * dy) / size;
    return ratio >= 0.2 && ratio <= 0.55;
  },
  pickHue(e) {
    const point = this.readSpectrumPoint(e);
    if (!point || !this.isHueRing(point.x, point.y)) {
      return false;
    }
    this.apply({ hue: this.hueFromPoint(point.x, point.y), ledOn: true });
    return true;
  },
  onHueTap(e) {
    this.pickHue(e);
  },
  onHueStart(e) {
    this.hueDragging = this.pickHue(e);
  },
  onHueMove(e) {
    if (!this.hueDragging) {
      return;
    }
    const point = this.readSpectrumPoint(e);
    if (!point) {
      return;
    }
    this.apply({ hue: this.hueFromPoint(point.x, point.y), ledOn: true });
  },
  onHueEnd() {
    this.hueDragging = false;
  },
  onValSlide(e) {
    if (!this.data.ledOn) {
      return;
    }
    this.apply({ val: e.detail.value });
  },
  onLedOrbTouch() {
    this.hueDragging = false;
  },
  toggleLed() {
    this.apply({ ledOn: !this.data.ledOn });
  },
});
