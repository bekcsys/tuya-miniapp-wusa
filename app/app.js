App({
  globalData: {
    created: [],
    attached: [],
    ready: [],
    detached: [],
    'observer': []
  },
  onLaunch() {
    console.log('onLaunch')
  },
  onShow() {
    console.log('onShow')
  },
  onHide() {
    console.log('onHide')
  },
  onError() {
    console.log('onError')
  },
})
