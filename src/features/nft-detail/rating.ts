export const formatRating = (average: number) =>
  average.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
