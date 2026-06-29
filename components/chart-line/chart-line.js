const { THEME_COLORS } = require('../../utils/theme')

Component({
  properties: {
    canvasId: {
      type: String,
      value: 'chart-line',
    },
    points: {
      type: Array,
      value: [],
      observer: 'drawChart',
    },
    empty: {
      type: Boolean,
      value: false,
      observer: 'drawChart',
    },
    width: {
      type: Number,
      value: 620,
    },
    height: {
      type: Number,
      value: 240,
    },
  },

  lifetimes: {
    ready() {
      this.drawChart()
    },
  },

  methods: {
    drawChart() {
      const { canvasId, points, empty, width, height } = this.properties
      const ctx = wx.createCanvasContext(canvasId, this)
      const safePoints = points || []
      const fallbackPoints = [
        { value: 0.2 },
        { value: 0.35 },
        { value: 0.28 },
        { value: 0.5 },
        { value: 0.42 },
      ]
      const workingPoints = !empty && safePoints.length ? safePoints : fallbackPoints
      const paddingX = 18
      const paddingTop = 24
      const paddingBottom = 24
      const max = Math.max(...workingPoints.map((item) => Number(item.value || 0)), 1)
      const stepX = workingPoints.length > 1 ? (width - paddingX * 2) / (workingPoints.length - 1) : 0

      ctx.clearRect(0, 0, width, height)

      ctx.setStrokeStyle(THEME_COLORS.canvasBase)
      ctx.setLineWidth(2)
      ;[paddingTop, height / 2, height - paddingBottom].forEach((y) => {
        ctx.beginPath()
        ctx.moveTo(paddingX, y)
        ctx.lineTo(width - paddingX, y)
        ctx.stroke()
      })

      ctx.setStrokeStyle(THEME_COLORS.primary)
      ctx.setLineWidth(4)
      ctx.setLineCap('round')
      ctx.setLineJoin('round')

      workingPoints.forEach((item, index) => {
        const x = paddingX + stepX * index
        const normalized = Number(item.value || 0) / max
        const y = height - paddingBottom - normalized * (height - paddingTop - paddingBottom)

        if (index === 0) {
          ctx.beginPath()
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
      ctx.draw()
    },
  },
})
