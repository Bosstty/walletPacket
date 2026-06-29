Component({
  options: {
    multipleSlots: true,
  },

  properties: {
    label: {
      type: String,
      value: '',
    },
    value: {
      type: String,
      value: '',
    },
    tone: {
      type: String,
      value: 'default',
    },
    emphasized: {
      type: Boolean,
      value: false,
    },
    meta: {
      type: String,
      value: '',
    },
  },
})
