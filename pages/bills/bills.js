const { bootstrapSession } = require('../../utils/session')
const { fetchTransactions } = require('../../services/transactions')
const {
  formatMonth,
  formatCurrencyFromCent,
  groupTransactionsByDate,
} = require('../../utils/format')

Page({
  data: {
    loading: true,
    month: formatMonth(),
    type: '',
    groups: [],
    summary: null,
  },

  onShow() {
    this.loadPage()
  },

  async loadPage() {
    this.setData({ loading: true })

    try {
      await bootstrapSession()
      const result = await fetchTransactions({
        month: this.data.month,
        type: this.data.type,
      })

      const groups = groupTransactionsByDate(result.items).map((group) => ({
        ...group,
        expenseText: formatCurrencyFromCent(group.expenseTotalCent),
        incomeText: formatCurrencyFromCent(group.incomeTotalCent),
        items: group.items.map((item) => ({
          ...item,
          amountText: formatCurrencyFromCent(item.amountCent),
          noteText: item.note || item.categoryNameSnapshot,
        })),
      }))

      this.setData({
        loading: false,
        groups,
        summary: {
          expenseText: formatCurrencyFromCent(result.summary.expenseTotalCent),
          incomeText: formatCurrencyFromCent(result.summary.incomeTotalCent),
          balanceText: formatCurrencyFromCent(result.summary.balanceCent),
          total: result.total,
        },
      })
    } catch (error) {
      this.setData({ loading: false })
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
      })
    }
  },

  handleMonthChange(event) {
    this.setData({
      month: event.detail.value,
    })
    this.loadPage()
  },

  handleTypeChange(event) {
    this.setData({
      type: event.currentTarget.dataset.type,
    })
    this.loadPage()
  },

  handleCreateTap() {
    wx.navigateTo({
      url: '/pages/transaction-form/transaction-form',
    })
  },

  handleOpenTransaction(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/transaction-form/transaction-form?id=${id}`,
    })
  },
})
