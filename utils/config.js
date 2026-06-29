const DEV_API_BASE_URL = 'https://wallet-api.cqtlly.top/api/v1'
const PROD_API_BASE_URL = 'https://wallet-api.cqtlly.top/api/v1'

function getApiBaseUrl() {
  const accountInfo = wx.getAccountInfoSync ? wx.getAccountInfoSync() : null
  const envVersion = accountInfo?.miniProgram?.envVersion || 'develop'

  if (envVersion === 'release') {
    return PROD_API_BASE_URL
  }

  return DEV_API_BASE_URL
}

module.exports = {
  getApiBaseUrl,
}
