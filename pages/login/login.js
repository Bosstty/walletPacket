const { ensureSession, loginWithWechat } = require('../../utils/session')

Page({
  data: {
    checking: true,
    submitting: false,
    agreed: false,
    inviteCode: '',
  },

  async onLoad() {
    await this.tryRestoreSession()
  },

  async tryRestoreSession() {
    this.setData({ checking: true })

    try {
      const user = await ensureSession(getApp())
      if (user) {
        wx.switchTab({
          url: '/pages/home/home',
        })
        return
      }
    } catch (error) {
      if (error.code !== 'AUTH_REQUIRED') {
        wx.showToast({
          title: error.message || '登录状态校验失败',
          icon: 'none',
        })
      }
    } finally {
      this.setData({ checking: false })
    }
  },

  handleAgreementChange() {
    this.setData({
      agreed: !this.data.agreed,
    })
  },

  handleInviteCodeInput(event) {
    this.setData({
      inviteCode: event.detail.value.trim(),
    })
  },

  async handleWechatLogin() {
    if (this.data.submitting) {
      return
    }

    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意协议后再登录',
        icon: 'none',
      })
      return
    }

    this.setData({ submitting: true })

    try {
      await loginWithWechat(getApp(), {
        nickname: '账本用户',
        inviteCode: this.data.inviteCode,
      })

      wx.showToast({
        title: '登录成功',
        icon: 'success',
      })

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/home/home',
        })
      }, 250)
    } catch (error) {
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none',
      })
    } finally {
      this.setData({ submitting: false })
    }
  },
})
