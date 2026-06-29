const { ensureSession } = require('../../utils/session')
const { fetchMonthlyStats } = require('../../services/stats')
const { formatMonth, formatCurrencyFromCent } = require('../../utils/format')
const { THEME_COLORS } = require('../../utils/theme')

const CHART_COLORS = THEME_COLORS.palette

Page({
  data: {
    month: formatMonth(),
    loading: true,
    stats: null,
  },

  onLoad() {
    this.initialized = false
    this.lastRefreshToken = -1
    this.loadPage()
  },

  onShow() {
    const app = getApp()
    const refreshToken = app.globalData.refreshFlags.stats

    if (this.initialized && refreshToken !== this.lastRefreshToken) {
      this.loadPage()
    }
  },

  async loadPage() {
    this.setData({ loading: true })

    try {
      await ensureSession(getApp())
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
                progressWidth: `${Math.min(stats.overallBudget.usageRatio * 100, 100)}%`,
              }
            : null,
          expenseByCategory: stats.expenseByCategory.map((item, index) => ({
            ...item,
            amountText: formatCurrencyFromCent(item.amountCent),
            ratioText: `${(item.ratio * 100).toFixed(1)}%`,
            color: CHART_COLORS[index % CHART_COLORS.length],
          })),
          dailyTrend: stats.dailyTrend.map((item) => ({
            ...item,
            expenseText: formatCurrencyFromCent(item.expenseTotalCent),
            incomeText: formatCurrencyFromCent(item.incomeTotalCent),
            chartValue: Math.max(item.expenseTotalCent, item.incomeTotalCent) / 100,
          })),
          categoryBudgets: stats.categoryBudgets.map((item) => ({
            ...item,
            amountText: formatCurrencyFromCent(item.amountCent),
            usedText: formatCurrencyFromCent(item.usedCent),
            remainingText: formatCurrencyFromCent(item.remainingCent),
            ratioText: `${(item.usageRatio * 100).toFixed(1)}%`,
            progressWidth: `${Math.min(item.usageRatio * 100, 100)}%`,
          })),
          expenseDonutSegments: stats.expenseByCategory.map((item, index) => ({
            value: item.amountCent,
            color: CHART_COLORS[index % CHART_COLORS.length],
          })),
          trendPoints: stats.dailyTrend.map((item) => ({
            value: Math.max(item.expenseTotalCent, item.incomeTotalCent) / 100,
          })),
        },
      })
      this.initialized = true
      this.lastRefreshToken = getApp().globalData.refreshFlags.stats
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED') {
        wx.reLaunch({
          url: '/pages/login/login',
        })
        return
      }

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
