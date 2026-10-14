export function calcWpm(correctChars: number, seconds: number): number {
  if (correctChars <= 0) return 0
  return Math.round(correctChars / 5 / (Math.max(seconds, 6) / 60))
}
export function calcAccuracy(correct: number, incorrect: number): number {
  const total = correct + incorrect
  return total === 0 ? 100 : Math.round((correct / total) * 100)
}
