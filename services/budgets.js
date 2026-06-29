const { request } = require('../utils/request')

function fetchBudgets(month) {
  const suffix = month ? `?month=${encodeURIComponent(month)}` : ''

  return request({
    url: `/budgets${suffix}`,
  })
}

function upsertOverallBudget(data) {
  return request({
    url: '/budgets/overall',
    method: 'PUT',
    data,
  })
}

function upsertCategoryBudget(data) {
  return request({
    url: '/budgets/category',
    method: 'PUT',
    data,
  })
}

module.exports = {
  fetchBudgets,
  upsertOverallBudget,
  upsertCategoryBudget,
}
