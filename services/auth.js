const { request } = require('../utils/request')

function devLogin(payload) {
  return request({
    url: '/auth/dev-login',
    method: 'POST',
    data: payload,
    withAuth: false,
  })
}

function wechatLogin(payload) {
  return request({
    url: '/auth/wechat-login',
    method: 'POST',
    data: payload,
    withAuth: false,
  })
}

function wechatPhoneLogin(payload) {
  return request({
    url: '/auth/wechat-phone-login',
    method: 'POST',
    data: payload,
    withAuth: false,
  })
}

module.exports = {
  devLogin,
  wechatLogin,
  wechatPhoneLogin,
}
