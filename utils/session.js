const { wechatLogin, wechatPhoneLogin } = require('../services/auth')
const { fetchCurrentUser } = require('../services/users')
const {
  setToken,
  setUser,
  getToken,
  getUser,
  clearSession,
} = require('./storage')

let bootstrapPromise = null

function createAuthRequiredError(message = '请先登录') {
  return {
    code: 'AUTH_REQUIRED',
    message,
  }
}

async function bootstrapSession(forceRefresh = false) {
  if (bootstrapPromise && !forceRefresh) {
    return bootstrapPromise
  }

  bootstrapPromise = (async () => {
    if (!getToken()) {
      throw createAuthRequiredError()
    }

    try {
      const user = await fetchCurrentUser()
      setUser(user)
      return user
    } catch (error) {
      clearSession()
      throw createAuthRequiredError('登录状态已失效，请重新登录')
    }
  })()

  try {
    return await bootstrapPromise
  } finally {
    bootstrapPromise = null
  }
}

async function ensureSession(app, forceRefresh = false) {
  if (!forceRefresh && app?.globalData?.user && getToken()) {
    return app.globalData.user
  }

  if (app?.globalData?.sessionReady && !forceRefresh) {
    return app.globalData.sessionReady
  }

  const sessionPromise = bootstrapSession(forceRefresh)

  if (app?.globalData) {
    app.globalData.sessionReady = sessionPromise
  }

  return sessionPromise
}

async function loginWithWechat(app, payload = {}) {
  const loginResult = await new Promise((resolve, reject) => {
    wx.login({
      success: resolve,
      fail: reject,
    })
  })

  if (!loginResult.code) {
    throw {
      message: '未获取到微信登录凭证',
    }
  }

  const result = await wechatLogin({
    code: loginResult.code,
    nickname: payload.nickname,
    avatarUrl: payload.avatarUrl,
  })

  setToken(result.accessToken)
  setUser(result.user)

  if (app?.globalData) {
    app.globalData.user = result.user
    app.globalData.sessionReady = Promise.resolve(result.user)
  }

  return result.user
}

async function loginWithWechatPhone(app, payload = {}) {
  const loginResult = await new Promise((resolve, reject) => {
    wx.login({
      success: resolve,
      fail: reject,
    })
  })

  if (!loginResult.code) {
    throw {
      message: '未获取到微信登录凭证',
    }
  }

  if (!payload.phoneCode) {
    throw {
      message: '未获取到手机号授权凭证',
    }
  }

  const result = await wechatPhoneLogin({
    loginCode: loginResult.code,
    phoneCode: payload.phoneCode,
    nickname: payload.nickname,
    avatarUrl: payload.avatarUrl,
  })

  setToken(result.accessToken)
  setUser(result.user)

  if (app?.globalData) {
    app.globalData.user = result.user
    app.globalData.sessionReady = Promise.resolve(result.user)
  }

  return result.user
}

function getCachedUser() {
  return getUser()
}

module.exports = {
  bootstrapSession,
  ensureSession,
  loginWithWechat,
  loginWithWechatPhone,
  createAuthRequiredError,
  getCachedUser,
}
