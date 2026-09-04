import Render from './index.rjs';

function toC(tempF) {
  return Math.round((tempF - 32) * 5 / 9);
}

function readState(done) {
  if (typeof ty.getStorage !== 'function') {
    done({});
    return;
  }
  ty.getStorage({
    key: 'saunaState',
    success: function (res) {
      done(res.data || {});
    },
    fail: function () {
      done({});
    },
  });
}

Widget({
  data: {
    tempF: 130,
    unit: 'F',
    displayTemp: 130,
    heaterOn: true,
    statusLine: 'Heating · 130 F',
  },
  onLoad(e) {
    console.log('onLoad', e);
  },
  onReady() {
    this.render = new Render(this);
    this.syncFromStore();
  },
  onShow() {
    this.syncFromStore();
  },
  onRefresh() {
    this.syncFromStore();
  },
  syncFromStore() {
    const self = this;
    readState(function (state) {
      const tempF = typeof state.tempF === 'number' ? state.tempF : self.data.tempF;
      const unit = state.unit === 'C' ? 'C' : 'F';
      const saunaOn = typeof state.saunaOn === 'boolean' ? state.saunaOn : true;
      const heaterOn = typeof state.heaterOn === 'boolean' ? state.heaterOn : self.data.heaterOn;
      self.paint(tempF, unit, saunaOn && heaterOn);
    });
  },
  paint(tempF, unit, heaterOn) {
    const displayTemp = unit === 'C' ? toC(tempF) : tempF;
    const unitLabel = unit === 'C' ? 'C' : 'F';
    const percent = Math.round((tempF - 80) / 70 * 100);
    const heatText = heaterOn ? 'Heating' : 'Off';
    this.setData({
      tempF: tempF,
      unit: unit,
      displayTemp: displayTemp,
      heaterOn: heaterOn,
      statusLine: heatText + ' · ' + displayTemp + ' ' + unitLabel,
    });
    if (!this.render) {
      return;
    }
    this.render.drawBuArc({ percent: percent, value: displayTemp });
    this.render.drawKcalArc({
      percent: heaterOn ? 100 : 8,
      value: heaterOn ? 'ON' : 'OFF',
    });
  },
  openApp() {
    const url =
      '/pages/tab1/index?tempF=' +
      this.data.tempF +
      '&heaterOn=' +
      (this.data.heaterOn ? '1' : '0') +
      '&unit=' +
      this.data.unit;
    if (typeof ty.navigateTo === 'function') {
      ty.navigateTo({
        url: url,
        fail: function () {
          if (typeof ty.redirectTo === 'function') {
            ty.redirectTo({ url: url });
          }
        },
      });
      return;
    }
    if (typeof ty.redirectTo === 'function') {
      ty.redirectTo({ url: url });
    }
  },
});
