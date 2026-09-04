function fToC(tempF) {
  return Math.round((tempF - 32) * (5 / 9));
}

function formatTemp(tempF, unit) {
  if (unit === 'C') {
    return `${fToC(tempF)}°C`;
  }
  return `${Math.round(tempF)}°F`;
}

Page({
  data: {
    tempF: 130,
    currentTempF: 92,
    minF: 80,
    maxF: 150,
    unit: 'F',
    heaterOn: false,
    heaterLabel: '',
    statusLine: '',
    currentDisplay: '',
    maxDisplay: '',
  },
  onLoad() {
    this.refreshCopy();
  },
  refreshCopy() {
    const { tempF, currentTempF, maxF, unit, heaterOn } = this.data;
    this.setData({
      currentDisplay: formatTemp(currentTempF, unit),
      maxDisplay: formatTemp(maxF, unit),
      heaterLabel: heaterOn ? I18n.t('heating') : I18n.t('heaterOff'),
      statusLine: heaterOn
        ? `${I18n.t('heatingTo')} ${formatTemp(tempF, unit)}`
        : I18n.t('setThenHeat'),
    });
  },
  onTempChange(e) {
    this.setData({ tempF: e.detail.value });
    this.refreshCopy();
  },
  setUnitF() {
    this.setData({ unit: 'F' });
    this.refreshCopy();
  },
  setUnitC() {
    this.setData({ unit: 'C' });
    this.refreshCopy();
  },
  toggleHeater() {
    this.setData({ heaterOn: !this.data.heaterOn });
    this.refreshCopy();
  },
});
