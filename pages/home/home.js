const { bootstrapSession } = require('../../utils/session')
const { fetchHomeStats } = require('../../services/stats')
const { formatCurrencyFromCent, formatDateTime } = require('../../utils/format')

Page({
  data: {
    loading: true,
    errorMessage: '',
    home: null,
  },

  onShow() {
    this.loadPage()
  },

  async loadPage() {
    this.setData({
      loading: true,
      errorMessage: '',
    })

    try {
      await bootstrapSession()
      const home = await fetchHomeStats()

      const recentTransactions = home.recentTransactions.map((item) => ({
        ...item,
        amountText: formatCurrencyFromCent(item.amountCent),
        occurredAtText: formatDateTime(new Date(item.occurredAt)),
      }))

      this.setData({
        loading: false,
        home: {
          ...home,
          todaySummary: this.decorateSummary(home.todaySummary),
          monthSummary: this.decorateSummary(home.monthSummary),
          overallBudget: home.overallBudget
            ? {
                ...home.overallBudget,
                amountText: formatCurrencyFromCent(home.overallBudget.amountCent),
                usedText: formatCurrencyFromCent(home.overallBudget.usedCent),
                remainingText: formatCurrencyFromCent(home.overallBudget.remainingCent),
                ratioText: `${Math.min(home.overallBudget.usageRatio * 100, 999).toFixed(1)}%`,
                progressWidth: `${Math.min(home.overallBudget.usageRatio * 100, 100)}%`,
              }
            : null,
          recentTransactions,
        },
      })
    } catch (error) {
      this.setData({
        loading: false,
        errorMessage: error.message || '加载失败',
      })
    }
  },

  decorateSummary(summary) {
    return {
      ...summary,
      expenseText: formatCurrencyFromCent(summary.expenseTotalCent),
      incomeText: formatCurrencyFromCent(summary.incomeTotalCent),
      balanceText: formatCurrencyFromCent(summary.balanceCent),
    }
  },

  handleCreateTap() {
    wx.navigateTo({
      url: '/pages/transaction-form/transaction-form',
    })
  },

  handleOpenBills() {
    wx.switchTab({
      url: '/pages/bills/bills',
    })
  },

  handleOpenStats() {
    wx.switchTab({
      url: '/pages/stats/stats',
    })
  },

  handleOpenTransaction(event) {
    const { id } = event.currentTarget.dataset

    wx.navigateTo({
      url: `/pages/transaction-form/transaction-form?id=${id}`,
    })
  },
})
