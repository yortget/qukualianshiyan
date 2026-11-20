const pad = (value) => String(value).padStart(2, '0')

function toDate(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return null

  const date = new Date(numeric)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * 后端时间戳为毫秒。参考图里出现的 49765 年是旧前端把毫秒再乘 1000 的 bug，
 * 这里直接按本地时区格式化，不再做二次换算。
 */
export function formatTimestamp(value) {
  const date = toDate(value)
  if (!date) return '—'

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function formatTimeOfDay(value) {
  const date = toDate(value)
  if (!date) return '—'

  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function toIsoString(value) {
  const date = toDate(value)
  return date ? date.toISOString() : undefined
}

export function formatBlockData(data) {
  if (data === null || data === undefined || data === '') return '—'
  if (typeof data === 'string') return data

  try {
    return JSON.stringify(data)
  } catch {
    return String(data)
  }
}

/** 从 "127.0.0.1:3939" 这类地址中取出 P2P 端口。 */
export function peerPort(peer) {
  if (peer && typeof peer === 'object') {
    const port = Number(peer.port)
    return Number.isFinite(port) ? port : null
  }

  const match = String(peer ?? '')
    .trim()
    .match(/:(\d+)$/)
  return match ? Number(match[1]) : null
}
