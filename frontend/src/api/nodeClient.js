const DEFAULT_API_PORTS = [3001, 3002, 3003, 3004]
const REQUEST_TIMEOUT = 4000

export class ApiError extends Error {
  constructor(message, { status = null, cause = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.cause = cause
  }
}

function currentHost() {
  if (typeof window === 'undefined') return 'localhost'
  return window.location.hostname || 'localhost'
}

function normalizeApiBase(entry, host) {
  const raw = String(entry ?? '').trim()
  if (!raw) return null

  const withProtocol = /^\d+$/.test(raw)
    ? `http://${host}:${raw}`
    : /^https?:\/\//i.test(raw)
      ? raw
      : `http://${raw}`

  try {
    return new URL(withProtocol).origin
  } catch {
    return null
  }
}

/**
 * 节点 API 地址的解析顺序：
 * 1. 地址栏 ?nodes=3001,3002 或 ?node=3001&node=3002（也支持完整 URL）
 * 2. 环境变量 VITE_NODE_APIS（逗号分隔）
 * 3. 默认探测本机的 3001-3004 端口（CLI 启动时自动占用其中一个）
 */
export function resolveNodeApis() {
  const host = currentHost()
  const params = new URLSearchParams(window.location.search)
  const fromQuery = [...params.getAll('node'), ...params.getAll('nodes')].join(',')
  const fromEnv = String(import.meta.env.VITE_NODE_APIS ?? '').trim()
  const source = fromQuery.trim() || fromEnv

  const entries = source
    ? source.split(/[\s,]+/).filter(Boolean)
    : DEFAULT_API_PORTS.map((port) => `http://${host}:${port}`)

  const apis = entries.map((entry) => normalizeApiBase(entry, host)).filter(Boolean)
  return apis.length
    ? [...new Set(apis)]
    : DEFAULT_API_PORTS.map((port) => `http://localhost:${port}`)
}

export function portFromApiBase(apiBase) {
  try {
    const url = new URL(apiBase)
    return Number(url.port) || (url.protocol === 'https:' ? 443 : 80)
  } catch {
    return null
  }
}

async function request(apiBase, path, { method = 'GET', body = null, timeout = REQUEST_TIMEOUT } = {}) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${apiBase}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      // 避免浏览器或中间层缓存 GET /blocks、/nodeInfo，导致轮询读到旧链。
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new ApiError(`接口 ${path} 返回 HTTP ${response.status}`, { status: response.status })
    }

    const text = await response.text()
    if (!text) return null

    try {
      return JSON.parse(text)
    } catch {
      throw new ApiError(`接口 ${path} 返回的不是有效 JSON`)
    }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error?.name === 'AbortError') {
      throw new ApiError(`请求超时（${timeout / 1000}s）`, { cause: error })
    }
    throw new ApiError('无法连接，请确认节点 API 已启动', { cause: error })
  } finally {
    window.clearTimeout(timer)
  }
}

export function fetchNodeInfo(apiBase) {
  return request(apiBase, '/nodeInfo')
}

export function fetchBlocks(apiBase) {
  return request(apiBase, '/blocks', { timeout: 6000 })
}

export function fetchPeers(apiBase) {
  return request(apiBase, '/peers')
}

export function mineBlock(apiBase, data) {
  return request(apiBase, '/mineBlock', { method: 'POST', body: { data } })
}

export function addPeer(apiBase, peer) {
  return request(apiBase, '/addPeer', { method: 'POST', body: { peer } })
}
