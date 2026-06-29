const TOKEN_KEY = 'wallet_packet_token'
const USER_KEY = 'wallet_packet_user'
const OPENID_KEY = 'wallet_packet_dev_openid'

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || ''
}

function setToken(token) {
  wx.setStorageSync(TOKEN_KEY, token)
}

function getUser() {
  return wx.getStorageSync(USER_KEY) || null
}

function setUser(user) {
  wx.setStorageSync(USER_KEY, user)
}

function clearSession() {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
  wx.removeStorageSync(OPENID_KEY)
}

function getOrCreateDevOpenid() {
  const cached = wx.getStorageSync(OPENID_KEY)

  if (cached) {
    return cached
  }

  const seed = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const openid = `dev_mp_${seed}`
  wx.setStorageSync(OPENID_KEY, openid)
  return openid
}

module.exports = {
  getToken,
  setToken,
  getUser,
  setUser,
  clearSession,
  getOrCreateDevOpenid,
}
