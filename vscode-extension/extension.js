'use strict'

const vscode = require('vscode')
const { createControlServer } = require('./lib/controlServer')

const BRIDGE_PORT = 3100
const OUTPUT_NAME = 'ChainScope Terminal Bridge'

let server = null
let output = null

function activate(context) {
  output = vscode.window.createOutputChannel(OUTPUT_NAME)
  context.subscriptions.push(output)

  server = createControlServer({
    vscode,
    output,
    workspaceRoot: () => {
      const folder = vscode.workspace.workspaceFolders?.[0]
      return folder ? folder.uri.fsPath : process.cwd()
    },
  })

  context.subscriptions.push({
    dispose: () => {
      server?.stop()
      server = null
    },
  })

  server
    .start(BRIDGE_PORT)
    .then((port) => {
      output.appendLine(`[ChainScope] bridge ready: http://127.0.0.1:${port}`)
    })
    .catch((error) => {
      output.appendLine(`[ChainScope] bridge failed: ${error.message}`)
      vscode.window.showWarningMessage(
        `ChainScope 终端桥接启动失败：${error.message}`,
      )
    })

  context.subscriptions.push(
    vscode.commands.registerCommand('chainscope.startTerminals', async () => {
      const p2pA = await vscode.window.showInputBox({
        title: 'ChainScope · 节点 A',
        value: '2727',
        prompt: '节点 A 的 P2P 端口',
      })
      if (!p2pA) return
      const p2pB = await vscode.window.showInputBox({
        title: 'ChainScope · 节点 B',
        value: '2828',
        prompt: '节点 B 的 P2P 端口（留空只启动 A）',
      })
      const nodes = [{ p2pPort: Number(p2pA), label: '节点 A' }]
      if (p2pB) {
        nodes.push({
          p2pPort: Number(p2pB),
          label: '节点 B',
          connectTo: Number(p2pA),
        })
      }
      try {
        const result = await server.startNodes(nodes)
        if (result.status >= 400) {
          vscode.window.showErrorMessage(result.payload.error)
        }
      } catch (error) {
        vscode.window.showErrorMessage(error.message)
      }
    }),
  )
}

function deactivate() {
  server?.stop()
  server = null
}

module.exports = { activate, deactivate }
