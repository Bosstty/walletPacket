const { request } = require('../utils/request')

function devLogin(payload) {
  return request({
    url: '/auth/dev-login',
    method: 'POST',
    data: payload,
    withAuth: false,
  })
}

module.exports = {
  devLogin,
}
