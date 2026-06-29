const { ensureSession } = require('../../utils/session')
const { fetchTransactions, deleteTransaction } = require('../../services/transactions')
const { THEME_COLORS } = require('../../utils/theme')
const {
  formatMonth,
  formatCurrencyFromCent,
  groupTransactionsByDate,
} = require('../../utils/format')

const SWIPE_HINT_KEY = 'wallet_packet_bills_swipe_hint_shown'

Page({
  data: {
    loading: true,
    month: formatMonth(),
    type: '',
    groups: [],
    summary: null,
    swipingId: '',
    createSheetVisible: false,
    swipeHintVisible: false,
    swipeHintTransactionId: '',
  },

  onLoad() {
    this.initialized = false
    this.lastRefreshToken = -1
    this.rpxRatio = 750 / (getApp().globalData.systemInfo?.windowWidth || 375)
    this.swipeHintTimers = []
    this.loadPage()
  },

  onShow() {
    wx.showTabBar({
      animation: false,
    })

    const app = getApp()
    const refreshToken = app.globalData.refreshFlags.bills

    if (this.initialized && refreshToken !== this.lastRefreshToken) {
      this.loadPage()
    }
  },

  onHide() {
    wx.showTabBar({
      animation: false,
    })

    this.clearSwipeHintTimers()
  },

  onUnload() {
    this.clearSwipeHintTimers()
  },

  async loadPage() {
    this.setData({ loading: true })

    try {
      await ensureSession(getApp())
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
          swipeOffset: 0,
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
      this.initialized = true
      this.lastRefreshToken = getApp().globalData.refreshFlags.bills
      this.maybePlaySwipeHint(groups)
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

  handleTypeChange(event) {
    this.setData({
      type: event.currentTarget.dataset.type,
    })
    this.loadPage()
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

  handleRowTouchStart(event) {
    const { id } = event.currentTarget.dataset
    this.touchStartX = event.touches[0].clientX
    this.touchTargetId = id
    this.dismissSwipeHint()

    if (this.data.swipingId && this.data.swipingId !== id) {
      this.resetSwipeItem(this.data.swipingId)
    }
  },

  handleRowTouchMove(event) {
    if (!this.touchTargetId) {
      return
    }

    const currentX = event.touches[0].clientX
    const deltaRpx = (currentX - this.touchStartX) * this.rpxRatio
    const offset = Math.max(-200, Math.min(0, deltaRpx))

    this.updateTransactionItem(this.touchTargetId, {
      swipeOffset: offset,
    })
  },

  handleRowTouchEnd() {
    if (!this.touchTargetId) {
      return
    }

    const item = this.findTransactionItem(this.touchTargetId)
    const shouldOpen = Math.abs(item?.swipeOffset || 0) > 100
    const finalOffset = shouldOpen ? -200 : 0

    this.updateTransactionItem(this.touchTargetId, {
      swipeOffset: finalOffset,
    })

    this.setData({
      swipingId: shouldOpen ? this.touchTargetId : '',
    })
    this.touchTargetId = ''
  },

  handleOpenTransaction(event) {
    const { id } = event.currentTarget.dataset
    this.dismissSwipeHint()
    wx.navigateTo({
      url: `/pages/transaction-form/transaction-form?id=${id}`,
    })
  },

  handleEditTransaction(event) {
    const { id } = event.currentTarget.dataset
    this.dismissSwipeHint()
    this.resetSwipeItem(id)
    wx.navigateTo({
      url: `/pages/transaction-form/transaction-form?id=${id}`,
    })
  },

  async handleDeleteTransaction(event) {
    const { id } = event.currentTarget.dataset
    this.dismissSwipeHint()
    const result = await new Promise((resolve) => {
      wx.showModal({
        title: '删除账单',
        content: '删除后不会出现在账单和统计中。',
        confirmColor: THEME_COLORS.primary,
        success: resolve,
      })
    })

    if (!result.confirm) {
      return
    }

    try {
      await deleteTransaction(id)
      this.resetSwipeItem(id)
      this.loadPage()
      wx.showToast({
        title: '已删除',
        icon: 'success',
      })
      const next = Date.now()
      const app = getApp()
      app.globalData.refreshFlags.home = next
      app.globalData.refreshFlags.bills = next
      app.globalData.refreshFlags.stats = next
    } catch (error) {
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none',
      })
    }
  },

  findTransactionItem(id) {
    for (const group of this.data.groups) {
      const matched = group.items.find((item) => item.id === id)
      if (matched) {
        return matched
      }
    }
    return null
  },

  resetSwipeItem(id) {
    if (!id) {
      return
    }

    this.updateTransactionItem(id, {
      swipeOffset: 0,
    })
    this.setData({
      swipingId: this.data.swipingId === id ? '' : this.data.swipingId,
    })
  },

  updateTransactionItem(id, patch) {
    const groups = this.data.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => (
        item.id === id
          ? { ...item, ...patch }
          : item
      )),
    }))

    this.setData({ groups })
  },

  maybePlaySwipeHint(groups) {
    if (wx.getStorageSync(SWIPE_HINT_KEY)) {
      return
    }

    const firstTransaction = groups[0]?.items?.[0]

    if (!firstTransaction) {
      return
    }

    const transactionId = firstTransaction.id
    wx.setStorageSync(SWIPE_HINT_KEY, true)

    this.setData({
      swipeHintVisible: true,
      swipeHintTransactionId: transactionId,
    })

    this.clearSwipeHintTimers()

    this.swipeHintTimers.push(
      setTimeout(() => {
        this.updateTransactionItem(transactionId, {
          swipeOffset: -96,
        })
      }, 420),
    )

    this.swipeHintTimers.push(
      setTimeout(() => {
        this.updateTransactionItem(transactionId, {
          swipeOffset: 0,
        })
      }, 1600),
    )

    this.swipeHintTimers.push(
      setTimeout(() => {
        this.setData({
          swipeHintVisible: false,
          swipeHintTransactionId: '',
        })
      }, 2150),
    )
  },

  dismissSwipeHint() {
    if (!this.data.swipeHintVisible && !this.data.swipeHintTransactionId) {
      return
    }

    this.clearSwipeHintTimers()

    if (this.data.swipeHintTransactionId) {
      this.updateTransactionItem(this.data.swipeHintTransactionId, {
        swipeOffset: 0,
      })
    }

    this.setData({
      swipeHintVisible: false,
      swipeHintTransactionId: '',
    })
  },

  clearSwipeHintTimers() {
    if (!this.swipeHintTimers?.length) {
      return
    }

    this.swipeHintTimers.forEach((timer) => clearTimeout(timer))
    this.swipeHintTimers = []
  },
})
