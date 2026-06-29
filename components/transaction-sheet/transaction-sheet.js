const { ensureSession } = require('../../utils/session')
const { fetchCategories } = require('../../services/categories')
const { createTransaction } = require('../../services/transactions')
const { toIsoStringFromLocal, toLocalDateAndTime } = require('../../utils/format')

Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer: 'handleShowChange',
    },
  },

  data: {
    rendered: false,
    active: false,
    loading: false,
    saving: false,
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

  lifetimes: {
    attached() {
      this.closeTimer = null
    },
    detached() {
      if (this.closeTimer) {
        clearTimeout(this.closeTimer)
      }
    },
  },

  methods: {
    handleShowChange(show) {
      if (show) {
        if (this.closeTimer) {
          clearTimeout(this.closeTimer)
          this.closeTimer = null
        }

        this.setData({
          rendered: true,
          active: false,
        })

        this.bootstrapDraft()

        setTimeout(() => {
          this.setData({ active: true })
        }, 16)
        this.loadCategories()
        return
      }

      this.setData({ active: false })
      this.closeTimer = setTimeout(() => {
        this.setData({ rendered: false })
      }, 260)
    },

    bootstrapDraft() {
      const dateAndTime = toLocalDateAndTime()
      this.setData({
        type: 'EXPENSE',
        amountInput: '',
        selectedCategoryId: '',
        note: '',
        budgetIncluded: true,
        occurredDate: dateAndTime.date,
        occurredTime: dateAndTime.time,
      })
    },

    async loadCategories() {
      this.setData({ loading: true })

      try {
        await ensureSession(getApp())
        const [expenseCategories, incomeCategories] = await Promise.all([
          fetchCategories({ type: 'EXPENSE' }),
          fetchCategories({ type: 'INCOME' }),
        ])

        this.setData({
          loading: false,
          expenseCategories: expenseCategories.items,
          incomeCategories: incomeCategories.items,
          activeCategories: expenseCategories.items,
          selectedCategoryId: expenseCategories.items[0]?.id || '',
        })
      } catch (error) {
        this.setData({ loading: false })
        if (error.code === 'AUTH_REQUIRED') {
          this.triggerEvent('close')
          wx.reLaunch({
            url: '/pages/login/login',
          })
          return
        }

        wx.showToast({
          title: error.message || '加载失败',
          icon: 'none',
        })
      }
    },

    handleMaskTap() {
      this.triggerEvent('close')
    },

    handleSheetTap() {},

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

      try {
        await createTransaction({
          type: this.data.type,
          amountCent,
          categoryId: this.data.selectedCategoryId,
          occurredAt: toIsoStringFromLocal(
            this.data.occurredDate,
            this.data.occurredTime,
          ),
          note: this.data.note,
          budgetIncluded: this.data.budgetIncluded,
        })

        const app = getApp()
        const next = Date.now()
        app.globalData.refreshFlags.home = next
        app.globalData.refreshFlags.bills = next
        app.globalData.refreshFlags.stats = next

        wx.showToast({
          title: '已保存',
          icon: 'success',
        })

        this.triggerEvent('saved')
        this.triggerEvent('close')
      } catch (error) {
        wx.showToast({
          title: error.message || '保存失败',
          icon: 'none',
        })
      } finally {
        this.setData({ saving: false })
      }
    },
  },
})
