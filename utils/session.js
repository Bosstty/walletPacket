const { devLogin } = require('../services/auth')
const { fetchCurrentUser } = require('../services/users')
const {
  getOrCreateDevOpenid,
  setToken,
  setUser,
  getToken,
  clearSession,
} = require('./storage')

let bootstrapPromise = null

async function bootstrapSession(forceRefresh = false) {
  if (bootstrapPromise && !forceRefresh) {
    return bootstrapPromise
  }

  bootstrapPromise = (async () => {
    const openid = getOrCreateDevOpenid()

    if (!getToken() || forceRefresh) {
      const loginResult = await devLogin({
        openid,
        nickname: '账本用户',
      })

      setToken(loginResult.accessToken)
      setUser(loginResult.user)
      return loginResult.user
    }

    try {
      const user = await fetchCurrentUser()
      setUser(user)
      return user
    } catch (error) {
      clearSession()
      const loginResult = await devLogin({
        openid,
        nickname: '账本用户',
      })
      setToken(loginResult.accessToken)
      setUser(loginResult.user)
      return loginResult.user
    }
  })()

  try {
    return await bootstrapPromise
  } finally {
    bootstrapPromise = null
  }
}

module.exports = {
  bootstrapSession,
}
