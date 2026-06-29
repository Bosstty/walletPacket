const { THEME_COLORS } = require('../../utils/theme')

Component({
  properties: {
    canvasId: {
      type: String,
      value: 'chart-donut',
    },
    segments: {
      type: Array,
      value: [],
      observer: 'drawChart',
    },
    empty: {
      type: Boolean,
      value: false,
      observer: 'drawChart',
    },
    size: {
      type: Number,
      value: 220,
    },
  },

  lifetimes: {
    ready() {
      this.drawChart()
    },
  },

  methods: {
    drawChart() {
      const { canvasId, segments, empty, size } = this.properties
      const ctx = wx.createCanvasContext(canvasId, this)
      const canvasSize = Number(size) || 220
      const center = canvasSize / 2
      const lineWidth = 24
      const radius = canvasSize / 2 - lineWidth
      const safeSegments = segments || []
      const hasValue = safeSegments.some((item) => Number(item.value) > 0)

      ctx.clearRect(0, 0, canvasSize, canvasSize)

      ctx.setLineWidth(lineWidth)
      ctx.setStrokeStyle(THEME_COLORS.canvasBase)
      ctx.setLineCap('round')
      ctx.beginPath()
      ctx.arc(center, center, radius, 0, Math.PI * 2)
      ctx.stroke()

      if (!empty && hasValue) {
        const total = safeSegments.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1
        let start = -Math.PI / 2

        safeSegments.forEach((segment) => {
          const value = Number(segment.value || 0)
          if (!value) {
            return
          }

          const end = start + (value / total) * Math.PI * 2
          ctx.setStrokeStyle(segment.color || THEME_COLORS.primary)
          ctx.beginPath()
          ctx.arc(center, center, radius, start, end)
          ctx.stroke()
          start = end
        })
      }

      ctx.setFillStyle('#FFF7EE')
      ctx.beginPath()
      ctx.arc(center, center, Math.max(radius - lineWidth + 6, 0), 0, Math.PI * 2)
      ctx.fill()
      ctx.draw()
    },
  },
})
