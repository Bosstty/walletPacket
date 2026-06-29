Component({
  properties: {
    kicker: {
      type: String,
      value: '',
    },
    title: {
      type: String,
      value: '',
    },
    description: {
      type: String,
      value: '',
    },
    accent: {
      type: String,
      value: 'warm',
    },
  },

  methods: {
    handleTap() {
      this.triggerEvent('cardtap')
    },
  },
})
