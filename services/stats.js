const { request } = require('../utils/request')

function fetchHomeStats() {
  return request({
    url: '/stats/home',
  })
}

function fetchMonthlyStats(month) {
  const suffix = month ? `?month=${encodeURIComponent(month)}` : ''

  return request({
    url: `/stats/monthly${suffix}`,
  })
}

module.exports = {
  fetchHomeStats,
  fetchMonthlyStats,
}
