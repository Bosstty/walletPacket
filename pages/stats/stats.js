const { bootstrapSession } = require('../../utils/session')
const { fetchMonthlyStats } = require('../../services/stats')
const { formatMonth, formatCurrencyFromCent } = require('../../utils/format')

Page({
  data: {
    month: formatMonth(),
    loading: true,
    stats: null,
  },

  onShow() {
    this.loadPage()
  },

  async loadPage() {
    this.setData({ loading: true })

    try {
      await bootstrapSession()
      const stats = await fetchMonthlyStats(this.data.month)

      this.setData({
        loading: false,
        stats: {
          ...stats,
          summary: {
            expenseText: formatCurrencyFromCent(stats.summary.expenseTotalCent),
            incomeText: formatCurrencyFromCent(stats.summary.incomeTotalCent),
            balanceText: formatCurrencyFromCent(stats.summary.balanceCent),
          },
          overallBudget: stats.overallBudget
            ? {
                ...stats.overallBudget,
                amountText: formatCurrencyFromCent(stats.overallBudget.amountCent),
                usedText: formatCurrencyFromCent(stats.overallBudget.usedCent),
                remainingText: formatCurrencyFromCent(stats.overallBudget.remainingCent),
                ratioText: `${(stats.overallBudget.usageRatio * 100).toFixed(1)}%`,
              }
            : null,
          expenseByCategory: stats.expenseByCategory.map((item) => ({
            ...item,
            amountText: formatCurrencyFromCent(item.amountCent),
            ratioText: `${(item.ratio * 100).toFixed(1)}%`,
          })),
          dailyTrend: stats.dailyTrend.map((item) => ({
            ...item,
            expenseText: formatCurrencyFromCent(item.expenseTotalCent),
            incomeText: formatCurrencyFromCent(item.incomeTotalCent),
          })),
          categoryBudgets: stats.categoryBudgets.map((item) => ({
            ...item,
            amountText: formatCurrencyFromCent(item.amountCent),
            usedText: formatCurrencyFromCent(item.usedCent),
            remainingText: formatCurrencyFromCent(item.remainingCent),
            ratioText: `${(item.usageRatio * 100).toFixed(1)}%`,
          })),
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
})
