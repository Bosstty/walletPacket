const { request } = require('../utils/request')

function fetchCategories(params = {}) {
  const query = []

  if (params.type) {
    query.push(`type=${encodeURIComponent(params.type)}`)
  }

  if (params.includeDisabled) {
    query.push('includeDisabled=true')
  }

  const suffix = query.length ? `?${query.join('&')}` : ''

  return request({
    url: `/categories${suffix}`,
  })
}

function createCategory(data) {
  return request({
    url: '/categories',
    method: 'POST',
    data,
  })
}

module.exports = {
  fetchCategories,
  createCategory,
}
