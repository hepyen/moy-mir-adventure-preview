/** Week starts on Monday in the browser's local timezone. */
export function currentWeekStart(): number {
  const now = new Date()
  const mondayOffset = (now.getDay() + 6) % 7
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset).getTime()
}
