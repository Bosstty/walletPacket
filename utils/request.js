const { getApiBaseUrl } = require('./config')
const { getToken, clearSession } = require('./storage')

function request(options) {
  const {
    url,
    method = 'GET',
    data,
    withAuth = true,
    timeout = 15000,
  } = options

  return new Promise((resolve, reject) => {
    const requestUrl = `${getApiBaseUrl()}${url}`
    const startedAt = Date.now()
    const header = {
      'content-type': 'application/json',
    }

    if (withAuth) {
      const token = getToken()
      if (token) {
        header.Authorization = `Bearer ${token}`
      }
    }

    wx.request({
      url: requestUrl,
      method,
      data,
      header,
      timeout,
      success(res) {
        const { statusCode, data: responseData } = res

        if (statusCode >= 200 && statusCode < 300) {
          resolve(responseData)
          return
        }

        if (statusCode === 401) {
          clearSession()
        }

        reject({
          statusCode,
          data: responseData,
          message: responseData?.message || 'Request failed',
        })
      },
      fail(error) {
        const duration = Date.now() - startedAt
        const isTimeout = String(error?.errMsg || '').includes('timeout')
        console.warn('request failed', {
          method,
          url: requestUrl,
          duration,
          timeout,
          error,
        })
        reject({
          message: isTimeout
            ? `请求超时：${method} ${url}`
            : error?.errMsg || 'Network error',
          isTimeout,
          url,
          method,
          duration,
        })
      },
    })
  })
}

module.exports = {
  request,
}
