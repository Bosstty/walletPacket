const { ensureSession } = require('../../utils/session')
const { fetchCategories } = require('../../services/categories')
const {
  createTransaction,
  fetchTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../../services/transactions')
const {
  formatCurrencyFromCent,
  toIsoStringFromLocal,
  toLocalDateAndTime,
} = require('../../utils/format')
const { THEME_COLORS } = require('../../utils/theme')

Page({
  data: {
    id: '',
    saving: false,
    loading: true,
    type: 'EXPENSE',
    amountInput: '',
    selectedCategoryId: '',
    note: '',
    budgetIncluded: true,
    occurredDate: '',
    occurredTime: '',
    expenseCategories: [],
    incomeCategories: [],
    activeCategories: [],
    quickAmounts: [20, 50, 100, 200],
  },

  onLoad(options) {
    this.options = options || {}
    this.loadPage()
  },

  onShow() {
    if (!this.loadedOnce) {
      return
    }
  },

  async loadPage() {
    this.loadedOnce = true
    const id = this.options?.id || ''
    const dateAndTime = toLocalDateAndTime()

    this.setData({
      loading: true,
      id,
      occurredDate: dateAndTime.date,
      occurredTime: dateAndTime.time,
    })

    try {
      await ensureSession(getApp())
      const [expenseCategories, incomeCategories] = await Promise.all([
        fetchCategories({ type: 'EXPENSE' }),
        fetchCategories({ type: 'INCOME' }),
      ])

      const baseData = {
        loading: false,
        expenseCategories: expenseCategories.items,
        incomeCategories: incomeCategories.items,
      }

      if (!id) {
        this.setData({
          ...baseData,
          type: 'EXPENSE',
          activeCategories: expenseCategories.items,
          budgetIncluded: true,
          selectedCategoryId: expenseCategories.items[0]?.id || '',
          amountInput: '',
          note: '',
        })
        return
      }

      const transaction = await fetchTransaction(id)
      const localDateTime = toLocalDateAndTime(transaction.occurredAt)

      this.setData({
        ...baseData,
        type: transaction.type,
        activeCategories:
          transaction.type === 'EXPENSE'
            ? expenseCategories.items
            : incomeCategories.items,
        amountInput: formatCurrencyFromCent(transaction.amountCent),
        selectedCategoryId: transaction.categoryId,
        note: transaction.note || '',
        budgetIncluded: transaction.budgetIncluded,
        occurredDate: localDateTime.date,
        occurredTime: localDateTime.time,
      })
    } catch (error) {
      if (error.code === 'AUTH_REQUIRED') {
        wx.reLaunch({
          url: '/pages/login/login',
        })
        return
      }

      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
      })
      this.setData({ loading: false })
    }
  },

  handleTypeChange(event) {
    const { type } = event.currentTarget.dataset
    const categories =
      type === 'EXPENSE' ? this.data.expenseCategories : this.data.incomeCategories

    this.setData({
      type,
      activeCategories: categories,
      selectedCategoryId: categories[0]?.id || '',
      budgetIncluded: type === 'EXPENSE',
    })
  },

  handleAmountInput(event) {
    this.setData({
      amountInput: event.detail.value.replace(/[^\d.]/g, ''),
    })
  },

  handleQuickAmount(event) {
    const { amount } = event.currentTarget.dataset
    this.setData({
      amountInput: String(amount),
    })
  },

  handleCategoryTap(event) {
    this.setData({
      selectedCategoryId: event.currentTarget.dataset.id,
    })
  },

  handleNoteInput(event) {
    this.setData({
      note: event.detail.value,
    })
  },

  handleQuickNote(event) {
    const { note } = event.currentTarget.dataset
    this.setData({
      note,
    })
  },

  handleBudgetChange(event) {
    this.setData({
      budgetIncluded: event.detail.value,
    })
  },

  handleBudgetToggleTap() {
    this.setData({
      budgetIncluded: !this.data.budgetIncluded,
    })
  },

  handleDateChange(event) {
    this.setData({
      occurredDate: event.detail.value,
    })
  },

  handleTimeChange(event) {
    this.setData({
      occurredTime: event.detail.value,
    })
  },

  async handleSave() {
    const amountCent = Math.round(Number(this.data.amountInput) * 100)

    if (!amountCent || amountCent <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none',
      })
      return
    }

    if (!this.data.selectedCategoryId) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none',
      })
      return
    }

    this.setData({ saving: true })

    const payload = {
      type: this.data.type,
      amountCent,
      categoryId: this.data.selectedCategoryId,
      occurredAt: toIsoStringFromLocal(
        this.data.occurredDate,
        this.data.occurredTime,
      ),
      note: this.data.note,
      budgetIncluded: this.data.budgetIncluded,
    }

    try {
      if (this.data.id) {
        await updateTransaction(this.data.id, payload)
      } else {
        await createTransaction(payload)
      }

      wx.showToast({
        title: '已保存',
        icon: 'success',
      })
      this.bumpRefreshFlags()

      setTimeout(() => {
        wx.navigateBack()
      }, 300)
    } catch (error) {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none',
      })
    } finally {
      this.setData({ saving: false })
    }
  },

  async handleDelete() {
    if (!this.data.id) {
      return
    }

    const result = await new Promise((resolve) => {
      wx.showModal({
        title: '删除账单',
        content: '删除后不会出现在账单和统计中。',
        confirmColor: THEME_COLORS.primaryActive,
        success: resolve,
      })
    })

    if (!result.confirm) {
      return
    }

    try {
      await deleteTransaction(this.data.id)
      this.bumpRefreshFlags()
      wx.showToast({
        title: '已删除',
        icon: 'success',
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 300)
    } catch (error) {
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none',
      })
    }
  },

  bumpRefreshFlags() {
    const app = getApp()
    const next = Date.now()
    app.globalData.refreshFlags.home = next
    app.globalData.refreshFlags.bills = next
    app.globalData.refreshFlags.stats = next
  },
})
