import Decimal from 'decimal.js'

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN })

export function toDecimal(value: string) {
  return new Decimal(value)
}

export function formatEthAmount(value: string, maxFractionDigits = 4, minFractionDigits = 2) {
  const truncated = new Decimal(value).toDecimalPlaces(maxFractionDigits, Decimal.ROUND_DOWN)
  const fixed =
    truncated.decimalPlaces() < minFractionDigits ? truncated.toFixed(minFractionDigits) : truncated.toFixed()
  const [integer, fraction] = fixed.split('.')
  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction ? `${groupedInteger}.${fraction}` : groupedInteger
}

export function formatEth(value: string, maxFractionDigits = 4) {
  return `${formatEthAmount(value, maxFractionDigits)} ETH`
}
