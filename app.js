const { bootstrapSession } = require('./utils/session')
const { getUser } = require('./utils/storage')

App({
  async onLaunch() {
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo
    this.globalData.navBarHeight =
      (systemInfo.statusBarHeight || 0) + 44

    try {
      const user = await bootstrapSession()
      this.globalData.user = user
    } catch (error) {
      console.error('bootstrap session failed', error)
    }
  },

  globalData: {
    user: getUser(),
    systemInfo: null,
    navBarHeight: 88,
  },
})
