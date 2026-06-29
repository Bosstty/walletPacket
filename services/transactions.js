const { request } = require('../utils/request')

function buildQuery(params = {}) {
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)

  return query.length ? `?${query.join('&')}` : ''
}

function fetchTransactions(params) {
  return request({
    url: `/transactions${buildQuery(params)}`,
  })
}

function fetchTransaction(id) {
  return request({
    url: `/transactions/${id}`,
  })
}

function createTransaction(data) {
  return request({
    url: '/transactions',
    method: 'POST',
    data,
  })
}

function updateTransaction(id, data) {
  return request({
    url: `/transactions/${id}`,
    method: 'PATCH',
    data,
  })
}

function deleteTransaction(id) {
  return request({
    url: `/transactions/${id}`,
    method: 'DELETE',
  })
}

module.exports = {
  fetchTransactions,
  fetchTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
}
