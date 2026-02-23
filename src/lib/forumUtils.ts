export const GAME_COLORS: Record<string, string> = {
  'werewolf': 'bg-purple-100 text-purple-700',
  'love-letter': 'bg-pink-100 text-pink-700',
  'counter-clash': 'bg-blue-100 text-blue-700',
}

export const GAME_NAMES: Record<string, string> = {
  'werewolf': 'Werewolf',
  'love-letter': 'Love Letter',
  'counter-clash': 'Counter Clash',
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
