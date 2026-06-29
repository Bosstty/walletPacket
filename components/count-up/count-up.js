function sanitizeNumber(value) {
  const normalized = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(normalized) ? normalized : 0
}

Component({
  properties: {
    value: {
      type: null,
      value: '0',
      observer: 'animateValue',
    },
    prefix: {
      type: String,
      value: '',
    },
    suffix: {
      type: String,
      value: '',
    },
    decimals: {
      type: Number,
      value: 2,
    },
    tone: {
      type: String,
      value: 'default',
    },
    emphasized: {
      type: Boolean,
      value: false,
    },
    size: {
      type: String,
      value: 'normal',
    },
    duration: {
      type: Number,
      value: 420,
    },
  },

  data: {
    displayValue: '0.00',
  },

  lifetimes: {
    attached() {
      const value = sanitizeNumber(this.properties.value)
      this.setData({
        displayValue: value.toFixed(this.properties.decimals),
      })
      this.previousValue = value
    },
    detached() {
      if (this.timer) {
        clearInterval(this.timer)
      }
    },
  },

  methods: {
    animateValue(nextValue) {
      const end = sanitizeNumber(nextValue)
      const start = Number.isFinite(this.previousValue) ? this.previousValue : 0
      const frameCount = Math.max(8, Math.round(this.properties.duration / 30))
      const step = (end - start) / frameCount
      let frame = 0

      if (this.timer) {
        clearInterval(this.timer)
      }

      this.timer = setInterval(() => {
        frame += 1
        const current = frame >= frameCount ? end : start + step * frame
        this.setData({
          displayValue: current.toFixed(this.properties.decimals),
        })

        if (frame >= frameCount) {
          clearInterval(this.timer)
          this.timer = null
          this.previousValue = end
        }
      }, Math.max(16, Math.round(this.properties.duration / frameCount)))
    },
  },
})
