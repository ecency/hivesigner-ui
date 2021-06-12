export function formatNumber (number: number): string {
  if (parseFloat(number.toFixed(6)) < 0.001) {
    return number.toFixed(6)
  }
  return number.toFixed(3)
}
