const DEFAULT_BRIDGE = 'http://127.0.0.1:3100'

export const bridgeBase = (
  import.meta.env.VITE_VSCODE_BRIDGE || DEFAULT_BRIDGE
).replace(/\/$/, '')

async function request(path, options = {}, timeout = 8000) {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(`${bridgeBase}${path}`, {
      ...options,
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.error || `VS Code 扩展返回 ${response.status}`)
    }
    return payload
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('VS Code 扩展响应超时')
    }
    throw error
  } finally {
    window.clearTimeout(timer)
  }
}

export function checkBridge() {
  return request('/health', { method: 'GET' }, 1500)
}

export function startManagedNodes(nodes) {
  return request(
    '/api/start',
    {
      method: 'POST',
      body: JSON.stringify({ nodes }),
    },
    15000,
  )
}

export function stopManagedNodes() {
  return request('/api/stop', { method: 'POST', body: '{}' }, 5000)
}
