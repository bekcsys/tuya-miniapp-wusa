const START_ANGLE = 0.75 * Math.PI;
const SWEEP = 1.5 * Math.PI;
const CANVAS_ID = 'heaterDial';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fToC(tempF) {
  return Math.round((tempF - 32) * (5 / 9));
}

function cToF(tempC) {
  return Math.round(tempC * (9 / 5) + 32);
}

function formatBound(tempF, unit) {
  if (unit === 'C') {
    return `${fToC(tempF)}°`;
  }
  return `${Math.round(tempF)}°`;
}

Component({
  properties: {
    value: {
      type: Number,
      value: 130,
    },
    unit: {
      type: String,
      value: 'F',
    },
    minF: {
      type: Number,
      value: 80,
    },
    maxF: {
      type: Number,
      value: 150,
    },
  },
  data: {
    displayTemp: 130,
    minLabel: '80°',
    maxLabel: '150°',
  },
  observers: {
    'value, unit, minF, maxF': function (value, unit, minF, maxF) {
      this.syncDisplay(value, unit, minF, maxF);
      this.drawDial();
    },
  },
  lifetimes: {
    ready() {
      this.measureCanvas(() => {
        this.syncDisplay(this.data.value, this.data.unit, this.data.minF, this.data.maxF);
        this.drawDial();
      });
    },
  },
  methods: {
    syncDisplay(value, unit, minF, maxF) {
      const safeMin = typeof minF === 'number' ? minF : 80;
      const safeMax = typeof maxF === 'number' ? maxF : 150;
      const safeUnit = unit === 'C' ? 'C' : 'F';
      const tempF = clamp(typeof value === 'number' ? value : 130, safeMin, safeMax);
      this.setData({
        displayTemp: safeUnit === 'C' ? fToC(tempF) : Math.round(tempF),
        minLabel: formatBound(safeMin, safeUnit),
        maxLabel: formatBound(safeMax, safeUnit),
      });
    },
    measureCanvas(done) {
      const applySize = (windowWidth) => {
        const px = (560 / 750) * (windowWidth || 375);
        this.canvasRect = { width: px, height: px };
        if (typeof done === 'function') {
          done();
        }
      };
      if (typeof ty.getSystemInfoSync === 'function') {
        applySize(ty.getSystemInfoSync().windowWidth);
        return;
      }
      ty.getSystemInfo({
        success: (info) => applySize(info.windowWidth),
        fail: () => applySize(375),
      });
    },
    tempToAngle(tempF) {
      const { minF, maxF } = this.data;
      const progress = (clamp(tempF, minF, maxF) - minF) / (maxF - minF);
      return START_ANGLE + progress * SWEEP;
    },
    pointToTemp(x, y) {
      const rect = this.canvasRect || { width: 280, height: 280 };
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const angle = Math.atan2(y - cy, x - cx);
      let delta = angle - START_ANGLE;
      while (delta < 0) {
        delta += Math.PI * 2;
      }
      while (delta >= Math.PI * 2) {
        delta -= Math.PI * 2;
      }
      let progress;
      if (delta <= SWEEP) {
        progress = delta / SWEEP;
      } else {
        const toEnd = delta - SWEEP;
        const toStart = Math.PI * 2 - delta;
        progress = toStart < toEnd ? 0 : 1;
      }
      const { minF, maxF, unit } = this.data;
      const rawF = minF + progress * (maxF - minF);
      if (unit === 'C') {
        return clamp(cToF(fToC(rawF)), minF, maxF);
      }
      return clamp(Math.round(rawF), minF, maxF);
    },
    emitTemp(tempF) {
      const next = clamp(tempF, this.data.minF, this.data.maxF);
      if (next === this.liveTemp) {
        return;
      }
      this.liveTemp = next;
      this.setData({
        displayTemp: this.data.unit === 'C' ? fToC(next) : Math.round(next),
      });
      this.drawDial(next);
      this.triggerEvent('change', { value: next });
    },
    getTouchPoint(e) {
      const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
      if (!touch) {
        return null;
      }
      if (typeof touch.x === 'number' && typeof touch.y === 'number') {
        return { x: touch.x, y: touch.y };
      }
      const rect = this.canvasRect || { left: 0, top: 0 };
      return {
        x: (touch.clientX || touch.pageX || 0) - (rect.left || 0),
        y: (touch.clientY || touch.pageY || 0) - (rect.top || 0),
      };
    },
    onTouchStart(e) {
      this.dragging = true;
      this.onTouchMove(e);
    },
    onTouchMove(e) {
      if (!this.dragging) {
        return;
      }
      const point = this.getTouchPoint(e);
      if (!point) {
        return;
      }
      this.emitTemp(this.pointToTemp(point.x, point.y));
    },
    onTouchEnd() {
      this.dragging = false;
    },
    drawDial(tempF) {
      const rect = this.canvasRect;
      if (!rect || !rect.width) {
        return;
      }
      const ctx = ty.createCanvasContext(CANVAS_ID, this);
      const width = rect.width;
      const height = rect.height;
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) / 2 - 28;
      const value =
        typeof tempF === 'number'
          ? tempF
          : typeof this.liveTemp === 'number'
            ? this.liveTemp
            : this.data.value;
      const angle = this.tempToAngle(value);

      ctx.clearRect(0, 0, width, height);

      ctx.beginPath();
      ctx.arc(cx, cy, radius - 36, 0, Math.PI * 2);
      ctx.setFillStyle('rgba(255, 246, 234, 0.03)');
      ctx.fill();

      ctx.setLineCap('round');
      ctx.setLineWidth(14);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, START_ANGLE, START_ANGLE + SWEEP, false);
      ctx.setStrokeStyle('rgba(255, 246, 234, 0.12)');
      ctx.stroke();

      ctx.setLineWidth(14);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, START_ANGLE, angle, false);
      ctx.setStrokeStyle('#e8a54b');
      ctx.stroke();

      const tickCount = this.data.maxF - this.data.minF;
      const step = tickCount > 70 ? 2 : 1;
      for (let temp = this.data.minF; temp <= this.data.maxF; temp += step) {
        const tickAngle = this.tempToAngle(temp);
        const major = (temp - this.data.minF) % 10 === 0;
        const inner = radius - (major ? 28 : 22);
        const outer = radius - 16;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(tickAngle) * inner, cy + Math.sin(tickAngle) * inner);
        ctx.lineTo(cx + Math.cos(tickAngle) * outer, cy + Math.sin(tickAngle) * outer);
        ctx.setLineWidth(major ? 3 : 1.5);
        ctx.setStrokeStyle(major ? 'rgba(255, 246, 234, 0.35)' : 'rgba(255, 246, 234, 0.14)');
        ctx.stroke();
      }

      const knobX = cx + Math.cos(angle) * radius;
      const knobY = cy + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.arc(knobX, knobY, 16, 0, Math.PI * 2);
      ctx.setFillStyle('#fff6ea');
      ctx.fill();
      ctx.beginPath();
      ctx.arc(knobX, knobY, 7, 0, Math.PI * 2);
      ctx.setFillStyle('#e85d04');
      ctx.fill();

      ctx.draw();
    },
  },
});
