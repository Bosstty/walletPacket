const { ensureSession } = require('../../utils/session')
const { fetchHomeStats } = require('../../services/stats')
const { formatCurrencyFromCent, formatDateTime } = require('../../utils/format')

Page({
  data: {
    loading: true,
    errorMessage: '',
    home: null,
    focusMode: 'month',
    greetingTitle: '',
    greetingCopy: '',
    createSheetVisible: false,
  },

  onLoad() {
    this.initialized = false
    this.lastRefreshToken = -1
    this.loadPage()
  },

  onShow() {
    wx.showTabBar({
      animation: false,
    })

    const app = getApp()
    const refreshToken = app.globalData.refreshFlags.home

    if (this.initialized && refreshToken !== this.lastRefreshToken) {
      this.loadPage()
    }
  },

  onHide() {
    wx.showTabBar({
      animation: false,
    })
  },

  async loadPage() {
    this.setData({
      loading: true,
      errorMessage: '',
    })

    try {
      await ensureSession(getApp())
      const home = await fetchHomeStats()

      const recentTransactions = home.recentTransactions.map((item) => ({
        ...item,
        amountText: formatCurrencyFromCent(item.amountCent),
        occurredAtText: formatDateTime(new Date(item.occurredAt)),
      }))

      const decoratedTodaySummary = this.decorateSummary(home.todaySummary)
      const decoratedMonthSummary = this.decorateSummary(home.monthSummary)
      const recentCount = recentTransactions.length
      const greeting = this.buildGreeting(home, recentCount)

      this.setData({
        loading: false,
        greetingTitle: greeting.title,
        greetingCopy: greeting.copy,
        home: {
          ...home,
          todaySummary: decoratedTodaySummary,
          monthSummary: decoratedMonthSummary,
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
          focusDay: {
            title: '今日',
            dateText: home.today,
            heroValue: decoratedTodaySummary.expenseText,
            heroLabel: '今日支出',
            incomeText: decoratedTodaySummary.incomeText,
            expenseText: decoratedTodaySummary.expenseText,
            balanceText: decoratedTodaySummary.balanceText,
          },
          focusMonth: {
            title: '本月',
            dateText: home.month,
            heroValue: decoratedMonthSummary.expenseText,
            heroLabel: '本月支出',
            incomeText: decoratedMonthSummary.incomeText,
            expenseText: decoratedMonthSummary.expenseText,
            balanceText: decoratedMonthSummary.balanceText,
          },
        },
      })
      this.initialized = true
      this.lastRefreshToken = getApp().globalData.refreshFlags.home
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED') {
        wx.reLaunch({
          url: '/pages/login/login',
        })
        return
      }

      this.setData({
        loading: false,
        errorMessage: error.message || '加载失败',
      })
    }
  },

  handleFocusChange(event) {
    this.setData({
      focusMode: event.currentTarget.dataset.mode,
    })
  },

  decorateSummary(summary) {
    return {
      ...summary,
      expenseText: formatCurrencyFromCent(summary.expenseTotalCent),
      incomeText: formatCurrencyFromCent(summary.incomeTotalCent),
      balanceText: formatCurrencyFromCent(summary.balanceCent),
    }
  },

  buildGreeting(home, recentCount) {
    const monthText = home.month ? `${home.month} 账目概览` : '本月账目概览'

    if (recentCount === 0) {
      return {
        title: monthText,
        copy: '先从一笔真实消费开始，首页会逐步长出你自己的资金轨迹。',
      }
    }

    if (home.monthSummary.balanceCent >= 0) {
      return {
        title: monthText,
        copy: '先看当下最重要的支出，再决定今天还需不需要补记。',
      }
    }

    return {
      title: monthText,
      copy: '这个月结余已经转负，建议先回看最近几笔支出。',
    }
  },

  handleCreateTap() {
    wx.hideTabBar({
      animation: true,
    })
    this.setData({
      createSheetVisible: true,
    })
  },

  handleCloseCreateSheet() {
    wx.showTabBar({
      animation: true,
    })
    this.setData({
      createSheetVisible: false,
    })
  },

  handleCreateSaved() {
    wx.showTabBar({
      animation: true,
    })
    this.loadPage()
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
