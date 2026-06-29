const { ensureSession } = require('../../utils/session')
const { fetchCurrentUser, updateSettings } = require('../../services/users')
const { fetchBudgets, upsertOverallBudget, upsertCategoryBudget } = require('../../services/budgets')
const { fetchCategories } = require('../../services/categories')
const { formatMonth, formatCurrencyFromCent } = require('../../utils/format')
const { clearSession } = require('../../utils/storage')

Page({
  data: {
    loading: true,
    month: formatMonth(),
    user: null,
    overallBudgetInput: '',
    categoryBudgetInput: '',
    selectedExpenseCategoryIndex: 0,
    selectedExpenseCategoryName: '',
    expenseCategories: [],
    overallBudget: null,
    categoryBudgets: [],
    showBalance: true,
    overallBudgetDirty: false,
    categoryBudgetDirty: false,
  },

  onLoad() {
    this.initialized = false
    this.lastRefreshToken = -1
    this.loadPage()
  },

  onShow() {
    const app = getApp()
    const refreshToken = app.globalData.refreshFlags.profile

    if (this.initialized && refreshToken !== this.lastRefreshToken) {
      this.loadPage()
    }
  },

  async loadPage() {
    this.setData({ loading: true })

    try {
      await ensureSession(getApp())
      const [user, budgets, expenseCategories] = await Promise.all([
        fetchCurrentUser(),
        fetchBudgets(this.data.month),
        fetchCategories({ type: 'EXPENSE' }),
      ])

      this.setData({
        loading: false,
        user,
        userOpenidMasked: this.maskOpenid(user.wechatOpenid),
        userPhoneMasked: this.maskPhone(user.phoneNumber),
        showBalance: user.showBalance,
        expenseCategories: expenseCategories.items,
        selectedExpenseCategoryName: expenseCategories.items[0]?.name || '选择分类',
        overallBudget: budgets.overall,
        overallBudgetInput: budgets.overall
          ? formatCurrencyFromCent(budgets.overall.amountCent)
          : '',
        categoryBudgets: budgets.categories.map((item) => ({
          ...item,
          amountText: formatCurrencyFromCent(item.amountCent),
        })),
      })
      this.initialized = true
      this.lastRefreshToken = getApp().globalData.refreshFlags.profile
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

  handleSwitchChange(event) {
    const nextValue = typeof event === 'boolean' ? event : event.detail.value
    this.setData({
      showBalance: nextValue,
    })
    this.saveSettings(nextValue)
  },

  async saveSettings(showBalance) {
    try {
      await updateSettings({ showBalance })
      wx.showToast({
        title: '已生效',
        icon: 'success',
      })
    } catch (error) {
      this.setData({
        showBalance: !showBalance,
      })
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none',
      })
    }
  },

  handleShowBalanceToggleTap() {
    this.handleSwitchChange(!this.data.showBalance)
  },

  handleMonthChange(event) {
    this.setData({
      month: event.detail.value,
    })
    this.loadPage()
  },

  handleOverallBudgetInput(event) {
    this.setData({
      overallBudgetInput: event.detail.value.replace(/[^\d.]/g, ''),
      overallBudgetDirty: true,
    })
  },

  handleCategoryBudgetInput(event) {
    this.setData({
      categoryBudgetInput: event.detail.value.replace(/[^\d.]/g, ''),
      categoryBudgetDirty: true,
    })
  },

  handleCategoryChange(event) {
    const selectedExpenseCategoryIndex = Number(event.detail.value)
    this.setData({
      selectedExpenseCategoryIndex,
      selectedExpenseCategoryName:
        this.data.expenseCategories[selectedExpenseCategoryIndex]?.name || '选择分类',
    })
  },

  async handleSaveOverallBudget() {
    const amountCent = Math.round(Number(this.data.overallBudgetInput) * 100)

    try {
      await upsertOverallBudget({
        month: this.data.month,
        amountCent,
        alertThreshold: 0.8,
        isEnabled: true,
      })
      wx.showToast({
        title: '总预算已保存',
        icon: 'success',
      })
      this.setData({
        overallBudgetDirty: false,
      })
      this.loadPage()
    } catch (error) {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none',
      })
    }
  },

  async handleSaveCategoryBudget() {
    const amountCent = Math.round(Number(this.data.categoryBudgetInput) * 100)
    const category = this.data.expenseCategories[this.data.selectedExpenseCategoryIndex]

    if (!category) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none',
      })
      return
    }

    try {
      await upsertCategoryBudget({
        month: this.data.month,
        categoryId: category.id,
        amountCent,
        alertThreshold: 0.75,
        isEnabled: true,
      })
      wx.showToast({
        title: '分类预算已保存',
        icon: 'success',
      })
      this.setData({
        categoryBudgetDirty: false,
      })
      this.loadPage()
    } catch (error) {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none',
      })
    }
  },

  maskOpenid(openid = '') {
    if (!openid || openid.length < 8) {
      return openid || '未获取'
    }

    return `${openid.slice(0, 4)}****${openid.slice(-4)}`
  },

  maskPhone(phone = '') {
    if (!phone || phone.length < 7) {
      return phone || '未绑定'
    }

    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  },

  async handleLogout() {
    const result = await new Promise((resolve) => {
      wx.showModal({
        title: '退出登录',
        content: '退出后将返回登录页，可重新用微信登录。',
        confirmColor: '#B85C38',
        success: resolve,
      })
    })

    if (!result.confirm) {
      return
    }

    clearSession()
    const app = getApp()
    app.globalData.user = null
    app.globalData.sessionReady = null

    wx.reLaunch({
      url: '/pages/login/login',
    })
  },
})
