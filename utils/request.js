const { getApiBaseUrl } = require('./config')
const { getToken, clearSession } = require('./storage')

function request(options) {
  const {
    url,
    method = 'GET',
    data,
    withAuth = true,
  } = options

  return new Promise((resolve, reject) => {
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
      url: `${getApiBaseUrl()}${url}`,
      method,
      data,
      header,
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
        reject({
          message: error?.errMsg || 'Network error',
        })
      },
    })
  })
}

module.exports = {
  request,
}
