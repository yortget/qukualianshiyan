'use strict'

const http = require('node:http')
const net = require('node:net')
const path = require('node:path')
const fs = require('node:fs')

const VERSION = '0.1.4'
const API_CANDIDATES = [3001, 3002, 3003, 3004]
const LOOPBACK_HOST = '127.0.0.1'

function isPort(value) {
  return Number.isInteger(value) && value >= 1024 && value <= 65535
}

function cleanLabel(value, fallback) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 32) || fallback
}

function isAllowedOrigin(origin) {
  if (!origin) return true
  return (
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
    /^vscode-webview:\/\//i.test(origin)
  )
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 64 * 1024) {
        reject(new Error('request body too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      if (!body.trim()) return resolve({})
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function requestJson(host, port, requestPath, timeout) {
  return new Promise((resolve) => {
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    const req = http.get(
      { host, port, path: requestPath, timeout },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          body += chunk
        })
        res.on('end', () => {
          if (res.statusCode !== 200) return finish(null)
          try {
            finish(JSON.parse(body))
          } catch {
            finish(null)
          }
        })
      },
    )
    req.on('timeout', () => {
      req.destroy()
      finish(null)
    })
    req.on('error', () => finish(null))
  })
}

async function httpJson(port, requestPath, timeout = 700) {
  for (const host of [LOOPBACK_HOST, 'localhost', '::1']) {
    const result = await requestJson(host, port, requestPath, timeout)
    if (result) return result
  }
  return null
}

function connectPort(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: 350 })
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(value)
    }
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
  })
}

async function isPortOpen(port) {
  for (const host of [LOOPBACK_HOST, '::1']) {
    if (await connectPort(host, port)) return true
  }
  return false
}

function findBlockchainDir(root) {
  const candidates = [path.join(root, 'blockchaindemo'), root]
  return candidates.find((candidate) =>
    fs.existsSync(path.join(candidate, 'Blockchain.js')),
  )
}

function createControlServer(options) {
  const vscode = options.vscode
  const output = options.output
  const workspaceRoot = options.workspaceRoot
  const apiCandidates = options.apiCandidates ?? API_CANDIDATES
  const prepare = options.prepare ?? prepareRecords
  const pollStep = options.pollStep ?? 360
  const getJson = options.httpJson ?? httpJson
  const portProbe = options.isPortOpen ?? isPortOpen

  let server = null
  let stopped = false
  let running = false
  let records = []
  const timers = new Set()

  function log(message) {
    if (output?.appendLine) output.appendLine(`[ChainScope] ${message}`)
  }

  function later(fn, ms) {
    const id = setTimeout(() => {
      timers.delete(id)
      if (!stopped) fn()
    }, ms)
    timers.add(id)
    return id
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      later(resolve, ms)
    })
  }

  function disposeTerminals() {
    for (const record of records) {
      try {
        record.terminal?.dispose?.()
      } catch {
        // terminal already closed
      }
    }
    records = []
  }

  function statusPayload() {
    return {
      ok: true,
      version: VERSION,
      running,
      terminals: records.map((record) => ({
        id: record.id,
        name: record.name,
        p2pPort: record.p2pPort,
        apiBase: record.apiBase ?? null,
        state: record.state,
        error: record.error ?? null,
      })),
    }
  }

  async function scan(p2pPort) {
    for (const apiPort of apiCandidates) {
      const info = await getJson(apiPort, '/nodeInfo')
      if (info && Number(info.p2pPort) === Number(p2pPort)) {
        return {
          apiBase: `http://localhost:${apiPort}`,
          apiPort,
          info,
        }
      }
    }
    return null
  }

  async function waitForAnyApi(timeout) {
    const deadline = Date.now() + timeout
    while (!stopped && Date.now() < deadline) {
      for (const apiPort of apiCandidates) {
        const info = await getJson(apiPort, '/nodeInfo')
        if (info) return true
      }
      await sleep(pollStep)
    }
    return false
  }

  async function respondingApiPorts() {
    const ports = new Set()
    for (const apiPort of apiCandidates) {
      const info = await getJson(apiPort, '/nodeInfo')
      if (info) ports.add(apiPort)
    }
    return ports
  }

  async function waitForNewApi(excludedPorts, timeout) {
    const deadline = Date.now() + timeout
    while (!stopped && Date.now() < deadline) {
      for (const apiPort of apiCandidates) {
        if (excludedPorts.has(apiPort)) continue
        const info = await getJson(apiPort, '/nodeInfo')
        if (info) return true
      }
      await sleep(pollStep)
    }
    return false
  }

  async function waitForP2p(p2pPort, timeout) {
    const deadline = Date.now() + timeout
    while (!stopped && Date.now() < deadline) {
      const found = await scan(p2pPort)
      if (found) return found
      await sleep(pollStep)
    }
    return null
  }

  async function waitForPort(port, timeout) {
    const deadline = Date.now() + timeout
    while (!stopped && Date.now() < deadline) {
      if (await portProbe(port)) return true
      await sleep(pollStep)
    }
    return false
  }

  async function prepareNode(record) {
    record.state = 'starting'
    try {
      const existingApis = await respondingApiPorts()
      record.terminal.sendText('npm run start')

      // 只等待“本节点新出现的 API”，不能因为另一个节点已经就绪就提前 open；
      // 否则 open 可能落在 shell/Vorpal 尚未接管的终端里被吞掉。
      const apiReady = await waitForNewApi(existingApis, 15000)
      record.terminal.sendText(`open ${record.p2pPort}`)
      if (!apiReady) {
        log(`${record.name} API 未在 15s 内出现，继续尝试 open 并检测 P2P`)
      }

      const found = await waitForP2p(record.p2pPort, 25000)

      if (!found) {
        record.state = 'error'
        record.error = `未检测到 P2P ${record.p2pPort}，请查看终端输出`
        log(record.error)
        return null
      }

      record.apiBase = found.apiBase
      record.apiPort = found.apiPort
      record.state = 'ready'
      log(`${record.name} ready at ${record.apiBase}`)
      return found
    } catch (error) {
      record.state = 'error'
      record.error = error?.message || String(error)
      log(`${record.name} failed: ${record.error}`)
      return null
    }
  }

  async function connectRecord(record, target) {
    if (!record.connectTo || !target) return

    if (!(await waitForPort(target.p2pPort, 12000))) {
      record.error = `目标节点 P2P ${record.connectTo} 没有监听`
      log(record.error)
      return
    }

    for (let attempt = 0; attempt < 4 && !stopped; attempt += 1) {
      record.terminal.sendText(`connect localhost ${record.connectTo}`)
      const deadline = Date.now() + 2200
      while (!stopped && Date.now() < deadline) {
        const apis = [record.apiBase, target.apiBase].filter(Boolean)
        for (const apiBase of apis) {
          const peers = await getJson(Number(new URL(apiBase).port), '/peers')
          if (Array.isArray(peers) && peers.length > 0) {
            record.connected = true
            log(`${record.name} connected to ${record.connectTo}`)
            return
          }
        }
        await sleep(pollStep)
      }
    }

    record.error = `节点 ${record.name} 未确认连接 P2P ${record.connectTo}`
    log(record.error)
  }

  async function prepareRecords(items) {
    // 串行启动：第二个节点的“新 API”基线必须包含第一个节点，
    // 这样 open 只会等待第二个节点自己的 API，而不是复用第一个节点的 API。
    for (const record of items) {
      await prepareNode(record)
    }
    for (const record of items) {
      if (record.connectTo) {
        const target = items.find((item) => item.p2pPort === record.connectTo)
        if (target) {
          await connectRecord(record, target)
        }
      }
    }
  }

  function resolveBlockchainDir() {
    const root = workspaceRoot ? workspaceRoot() : process.cwd()
    const found = findBlockchainDir(root)
    if (!found) {
      throw new Error(`找不到 blockchaindemo 目录（工作区：${root}）`)
    }
    return found
  }

  function createTerminal(record, blockchainDir) {
    const terminal = vscode.window.createTerminal({
      name: record.name,
      cwd: blockchainDir,
    })
    terminal.show(true)
    record.terminal = terminal
    return terminal
  }

  async function startNodes(input) {
    if (running) {
      return { status: 409, payload: { ok: false, error: '已有托管终端在运行' } }
    }

    if (!Array.isArray(input) || input.length < 1 || input.length > 2) {
      return { status: 400, payload: { ok: false, error: 'nodes 必须是 1–2 个节点' } }
    }

    const normalized = input.map((item, index) => {
      const p2pPort = Number(item?.p2pPort)
      const connectTo = item?.connectTo == null ? null : Number(item.connectTo)
      if (!isPort(p2pPort)) {
        throw new Error(`第 ${index + 1} 个节点的 P2P 端口不合法`)
      }
      if (connectTo != null && !isPort(connectTo)) {
        throw new Error('connectTo 端口不合法')
      }
      return {
        id: `${Date.now()}-${index}`,
        name: cleanLabel(item?.label, `节点 ${index + 1}`) + ` · P2P ${p2pPort}`,
        p2pPort,
        connectTo,
        state: 'created',
        error: null,
        apiBase: null,
        apiPort: null,
        terminal: null,
      }
    })

    if (new Set(normalized.map((item) => item.p2pPort)).size !== normalized.length) {
      return { status: 400, payload: { ok: false, error: 'P2P 端口不能重复' } }
    }

    for (const item of normalized) {
      if (item.connectTo != null && !normalized.some((peer) => peer.p2pPort === item.connectTo)) {
        return { status: 400, payload: { ok: false, error: 'connectTo 必须指向本次启动的另一个节点' } }
      }
    }

    const busyPorts = []
    for (const item of normalized) {
      if (await portProbe(item.p2pPort)) busyPorts.push(item.p2pPort)
    }
    if (busyPorts.length) {
      return {
        status: 409,
        payload: {
          ok: false,
          error: `P2P 端口已被占用：${busyPorts.join(', ')}。请先关闭之前的终端/进程再启动。`,
        },
      }
    }

    const blockchainDir = resolveBlockchainDir()
    running = true
    records = normalized
    for (const record of records) {
      createTerminal(record, blockchainDir)
    }
    later(() => {
      if (stopped || !records.length) return
      prepare(records).catch((error) => {
        for (const item of records) {
          item.state = 'error'
          item.error = error?.message || String(error)
        }
        log(`prepare failed: ${error?.message || error}`)
      })
    }, 500)

    log(`created ${records.length} terminal(s)`)
    return { status: 202, payload: statusPayload() }
  }

  function send(res, status, payload, origin) {
    const body = JSON.stringify(payload)
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(body),
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    })
    res.end(body)
  }

  function handle(req, res) {
    const origin = req.headers.origin
    if (!isAllowedOrigin(origin)) {
      send(res, 403, { ok: false, error: 'origin not allowed' }, origin)
      return
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      res.end()
      return
    }

    const url = new URL(req.url, `http://${LOOPBACK_HOST}`)
    if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/status')) {
      send(res, 200, statusPayload(), origin)
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/start') {
      readJson(req)
        .then(async (body) => {
          try {
            const result = await startNodes(body.nodes)
            send(res, result.status, result.payload, origin)
          } catch (error) {
            send(res, 400, { ok: false, error: error.message }, origin)
          }
        })
        .catch((error) => send(res, 400, { ok: false, error: error.message }, origin))
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/stop') {
      disposeTerminals()
      running = false
      send(res, 200, { ok: true }, origin)
      return
    }

    send(res, 404, { ok: false, error: 'not found' }, origin)
  }

  function start(port = 3100) {
    return new Promise((resolve, reject) => {
      server = http.createServer(handle)
      server.on('error', reject)
      server.listen(port, LOOPBACK_HOST, () => {
        log(`control server listening on http://${LOOPBACK_HOST}:${port}`)
        resolve(port)
      })
    })
  }

  function stop() {
    stopped = true
    for (const id of timers) clearTimeout(id)
    timers.clear()
    disposeTerminals()
    running = false
    if (server) {
      server.close()
      server = null
    }
  }

  return { start, stop, startNodes, status: statusPayload }
}

module.exports = {
  createControlServer,
  isAllowedOrigin,
  isPort,
  cleanLabel,
  findBlockchainDir,
}
