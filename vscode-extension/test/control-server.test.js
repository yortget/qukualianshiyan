'use strict'

const assert = require('node:assert/strict')
const path = require('node:path')
const { createControlServer, isPort, cleanLabel, isAllowedOrigin } = require('../lib/controlServer')

const root = path.resolve(__dirname, '..', '..')
const terminals = []
const apiState = { 3001: false, 3002: false }
const p2pState = { 5657: false, 5757: false }

const fakeVscode = {
  window: {
    createTerminal(options) {
      const terminal = {
        name: options.name,
        options,
        commands: [],
        shown: false,
        disposed: false,
        show(preserveFocus) {
          this.shown = preserveFocus
        },
        sendText(text) {
          this.commands.push(text)
          if (/npm run start/.test(text)) {
            const index = terminals.indexOf(this)
            setTimeout(() => {
              apiState[index === 0 ? 3001 : 3002] = true
              p2pState[index === 0 ? 5657 : 5757] = true
            }, 30)
          }
        },
        dispose() {
          this.disposed = true
        },
      }
      terminals.push(terminal)
      return terminal
    },
  },
}

async function request(url, options = {}) {
  const response = await fetch(url, options)
  const body = await response.json().catch(() => null)
  return { status: response.status, body, headers: response.headers }
}

async function main() {
  assert.equal(isPort(2727), true)
  assert.equal(isPort(80), false)
  assert.equal(cleanLabel('  节点 A  ', 'x'), '节点 A')
  assert.equal(isAllowedOrigin('http://127.0.0.1:5173'), true)
  assert.equal(isAllowedOrigin('https://example.com'), false)

  const server = createControlServer({
    vscode: fakeVscode,
    workspaceRoot: () => root,
    prepare: async () => {},
  })
  await server.start(3199)

  const health = await request('http://127.0.0.1:3199/health', {
    headers: { Origin: 'http://127.0.0.1:5173' },
  })
  assert.equal(health.status, 200)
  assert.equal(health.body.ok, true)
  assert.equal(health.body.terminals.length, 0)
  assert.equal(health.headers.get('access-control-allow-origin'), 'http://127.0.0.1:5173')

  const options = await request('http://127.0.0.1:3199/health', {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://127.0.0.1:5173',
      'Access-Control-Request-Method': 'POST',
    },
  })
  assert.equal(options.status, 204)

  const blocked = await request('http://127.0.0.1:3199/health', {
    headers: { Origin: 'https://evil.example' },
  })
  assert.equal(blocked.status, 403)

  const invalid = await request('http://127.0.0.1:3199/api/start', {
    method: 'POST',
    headers: { Origin: 'http://127.0.0.1:5173', 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodes: [{ p2pPort: 80 }] }),
  })
  assert.equal(invalid.status, 400)

  const started = await request('http://127.0.0.1:3199/api/start', {
    method: 'POST',
    headers: { Origin: 'http://127.0.0.1:5173', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nodes: [
        { p2pPort: 5657, label: '节点 A' },
        { p2pPort: 5757, label: '节点 B', connectTo: 5657 },
      ],
    }),
  })
  assert.equal(started.status, 202)
  assert.equal(started.body.ok, true)
  assert.equal(started.body.terminals.length, 2)
  assert.equal(terminals.length, 2)
  assert.match(terminals[0].name, /节点 A · P2P 5657/)
  assert.match(terminals[1].name, /节点 B · P2P 5757/)
  assert.ok(terminals[0].options.cwd.endsWith('blockchaindemo'))

  const duplicate = await request('http://127.0.0.1:3199/api/start', {
    method: 'POST',
    headers: { Origin: 'http://127.0.0.1:5173', 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodes: [{ p2pPort: 5657 }] }),
  })
  assert.equal(duplicate.status, 409)
  assert.equal(terminals.length, 2)

  const stopped = await request('http://127.0.0.1:3199/api/stop', {
    method: 'POST',
    headers: { Origin: 'http://127.0.0.1:5173' },
  })
  assert.equal(stopped.status, 200)
  assert.ok(terminals.every((terminal) => terminal.disposed))

  server.stop()

  terminals.length = 0
  apiState[3001] = false
  apiState[3002] = false
  p2pState[5657] = false
  p2pState[5757] = false
  const fakeHttp = async (port, pathname) => {
    if (pathname === '/nodeInfo') {
      if (!apiState[port]) return null
      return { p2pPort: port === 3001 ? 5657 : 5757, blockCount: 1 }
    }
    if (pathname === '/peers') {
      return ['127.0.0.1:5657']
    }
    throw new Error(`unexpected ${port}${pathname}`)
  }
  const prepared = createControlServer({
    vscode: fakeVscode,
    workspaceRoot: () => root,
    httpJson: fakeHttp,
    isPortOpen: async (port) => Boolean(p2pState[port]),
    pollStep: 20,
  })
  await prepared.start(3198)
  const preparedStart = await request('http://127.0.0.1:3198/api/start', {
    method: 'POST',
    headers: { Origin: 'http://127.0.0.1:5173', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nodes: [
        { p2pPort: 5657, label: '节点 A' },
        { p2pPort: 5757, label: '节点 B', connectTo: 5657 },
      ],
    }),
  })
  assert.equal(preparedStart.status, 202)
  await new Promise((resolve) => setTimeout(resolve, 2400))
  assert.match(terminals[0].commands[0], /npm run start/)
  assert.match(terminals[0].commands[1], /open 5657/)
  assert.match(terminals[1].commands[0], /npm run start/)
  assert.match(terminals[1].commands[1], /open 5757/)
  assert.match(terminals[1].commands[2], /connect localhost 5657/)
  const preparedHealth = await request('http://127.0.0.1:3198/health')
  assert.equal(preparedHealth.body.terminals.length, 2)
  assert.equal(preparedHealth.body.terminals[0].state, 'ready')
  await request('http://127.0.0.1:3198/api/stop', { method: 'POST' })
  prepared.stop()

  console.log('control-server: ok')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
