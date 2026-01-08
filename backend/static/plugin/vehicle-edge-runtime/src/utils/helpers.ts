// Helper functions for Vehicle Edge Runtime plugin

export function getStatusColor(status: string): string {
  switch (status) {
    case 'online':
    case 'running':
      return 'text-green-600 bg-green-100'
    case 'offline':
    case 'stopped':
      return 'text-gray-600 bg-gray-100'
    case 'connecting':
    case 'error':
      return 'text-red-600 bg-red-100'
    case 'paused':
      return 'text-yellow-600 bg-yellow-100'
    case 'installed':
      return 'text-blue-600 bg-blue-100'
    case 'starting':
      return 'text-blue-400 bg-blue-50'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString()
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
