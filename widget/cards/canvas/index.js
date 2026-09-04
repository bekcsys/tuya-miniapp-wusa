function fToC(tempF) {
  return Math.round((tempF - 32) * (5 / 9));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

Widget({
  data: {
    tempF: 130,
    minF: 80,
    maxF: 150,
    unit: 'F',
    displayTemp: 130,
    minLabel: '80°',
    maxLabel: '150°',
  },
  onLoad() {
    this.syncDisplay(this.data.tempF, this.data.unit);
  },
  syncDisplay(tempF, unit) {
    const { minF, maxF } = this.data;
    this.setData({
      displayTemp: unit === 'C' ? fToC(tempF) : Math.round(tempF),
      minLabel: unit === 'C' ? `${fToC(minF)}°` : `${minF}°`,
      maxLabel: unit === 'C' ? `${fToC(maxF)}°` : `${maxF}°`,
    });
  },
  applyTemp(tempF) {
    const next = clamp(Math.round(tempF), this.data.minF, this.data.maxF);
    this.setData({ tempF: next });
    this.syncDisplay(next, this.data.unit);
  },
  onSliderChanging(e) {
    this.applyTemp(e.detail.value);
  },
  onSliderChange(e) {
    this.applyTemp(e.detail.value);
  },
  setUnitF() {
    this.setData({ unit: 'F' });
    this.syncDisplay(this.data.tempF, 'F');
  },
  setUnitC() {
    this.setData({ unit: 'C' });
    this.syncDisplay(this.data.tempF, 'C');
  },
});
