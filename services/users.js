const { request } = require('../utils/request')

function fetchCurrentUser() {
  return request({
    url: '/users/me',
  })
}

function updateSettings(data) {
  return request({
    url: '/users/settings',
    method: 'PATCH',
    data,
  })
}

module.exports = {
  fetchCurrentUser,
  updateSettings,
}
