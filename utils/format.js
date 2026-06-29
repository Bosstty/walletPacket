function formatCurrencyFromCent(amountCent) {
  const value = Number(amountCent || 0) / 100
  return value.toFixed(2)
}

function formatMonth(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

function formatDate(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateTime(date = new Date()) {
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${formatDate(date)} ${hours}:${minutes}`
}

function toIsoStringFromLocal(dateValue, timeValue) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const [hours, minutes] = timeValue.split(':').map(Number)
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)
  return date.toISOString()
}

function toLocalDateAndTime(isoString) {
  const date = isoString ? new Date(isoString) : new Date()

  return {
    date: formatDate(date),
    time: `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`,
  }
}

function groupTransactionsByDate(items = []) {
  const groups = []
  const map = {}

  items.forEach((item) => {
    if (!map[item.occurredDate]) {
      map[item.occurredDate] = {
        date: item.occurredDate,
        items: [],
        expenseTotalCent: 0,
        incomeTotalCent: 0,
      }
      groups.push(map[item.occurredDate])
    }

    map[item.occurredDate].items.push(item)

    if (item.type === 'EXPENSE') {
      map[item.occurredDate].expenseTotalCent += item.amountCent
    } else {
      map[item.occurredDate].incomeTotalCent += item.amountCent
    }
  })

  return groups
}

module.exports = {
  formatCurrencyFromCent,
  formatMonth,
  formatDate,
  formatDateTime,
  toIsoStringFromLocal,
  toLocalDateAndTime,
  groupTransactionsByDate,
}
