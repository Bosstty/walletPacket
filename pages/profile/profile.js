const { bootstrapSession } = require('../../utils/session')
const { fetchCurrentUser, updateSettings } = require('../../services/users')
const { fetchBudgets, upsertOverallBudget, upsertCategoryBudget } = require('../../services/budgets')
const { fetchCategories } = require('../../services/categories')
const { formatMonth, formatCurrencyFromCent } = require('../../utils/format')

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
  },

  onShow() {
    this.loadPage()
  },

  async loadPage() {
    this.setData({ loading: true })

    try {
      await bootstrapSession()
      const [user, budgets, expenseCategories] = await Promise.all([
        fetchCurrentUser(),
        fetchBudgets(this.data.month),
        fetchCategories({ type: 'EXPENSE' }),
      ])

      this.setData({
        loading: false,
        user,
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
    } catch (error) {
      this.setData({ loading: false })
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
      })
    }
  },

  handleSwitchChange(event) {
    this.setData({
      showBalance: event.detail.value,
    })
  },

  async handleSaveSettings() {
    try {
      await updateSettings({
        showBalance: this.data.showBalance,
      })

      wx.showToast({
        title: '设置已更新',
        icon: 'success',
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '保存失败',
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

  handleOverallBudgetInput(event) {
    this.setData({
      overallBudgetInput: event.detail.value.replace(/[^\d.]/g, ''),
    })
  },

  handleCategoryBudgetInput(event) {
    this.setData({
      categoryBudgetInput: event.detail.value.replace(/[^\d.]/g, ''),
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
      this.loadPage()
    } catch (error) {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none',
      })
    }
  },
})
