const { ensureSession } = require('./utils/session')
const { getUser } = require('./utils/storage')

App({
  async onLaunch() {
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo
    this.globalData.navBarHeight =
      (systemInfo.statusBarHeight || 0) + 44

    try {
      const user = await ensureSession(this)
      this.globalData.user = user
    } catch (error) {
      this.globalData.sessionReady = null
    }
  },

  globalData: {
    user: getUser(),
    systemInfo: null,
    navBarHeight: 88,
    sessionReady: null,
    refreshFlags: {
      home: 0,
      bills: 0,
      stats: 0,
      profile: 0,
    },
  },
})
