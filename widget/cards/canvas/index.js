import Render from './index.rjs';

Widget({
  data: {
    time: '2023-03-01 10:36',
    long: 0,
  },
  onLoad(e) {
    console.log('onLoad', e);
  },
  onReady() {
    this.render = new Render(this);
    this.drawChart();
  },
  async drawChart() {
    this.render.drawBuArc({ percent: 35, value: 3500 });
    this.render.drawKcalArc({ percent: 80, value: 800 });
    this.setData({
      long: Math.floor(3500 * 0.6),
    });
  },
  async tap() {
    ty.showToast({ title: 'success' });
    const systemInfo = await ty.getSystemInfo();
    console.log('systemInfo', systemInfo);
  },
  jumpToH5() {
    ty.openInnerH5({
      url: 'https://www.baidu.com/',
      complete: () => {
        console.log('ty.openInnerH5');
      },
    });
  },
});
