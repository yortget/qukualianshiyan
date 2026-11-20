<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  checkBridge,
  startManagedNodes,
  stopManagedNodes,
} from '../api/vscodeBridge'

const emit = defineEmits(['started', 'stopped'])

const portA = ref(readPort('chainscope.vscode.portA', '2727'))
const portB = ref(readPort('chainscope.vscode.portB', '2828'))
const bridgeState = ref('checking')
const bridgeError = ref('')
const bridgeVersion = ref('')
const busy = ref(false)
const stopping = ref(false)
const message = ref('')
const terminals = ref([])

const online = computed(() => bridgeState.value === 'online')
const canStart = computed(
  () =>
    online.value &&
    !busy.value &&
    validPort(portA.value) &&
    validPort(portB.value) &&
    Number(portA.value) !== Number(portB.value),
)
const stateLabel = computed(() => {
  if (bridgeState.value === 'checking') return '检测中'
  if (bridgeState.value === 'online') return '已连接'
  if (bridgeState.value === 'offline') return '未检测到'
  return '异常'
})

function readPort(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

function savePort(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage can be disabled
  }
}

function validPort(value) {
  const port = Number(value)
  return Number.isInteger(port) && port >= 1024 && port <= 65535
}

async function check() {
  bridgeState.value = 'checking'
  bridgeError.value = ''
  try {
    const health = await checkBridge()
    bridgeVersion.value = health?.version || ''
    bridgeState.value = 'online'
  } catch (error) {
    bridgeVersion.value = ''
    bridgeState.value = 'offline'
    bridgeError.value = error?.message || '无法连接 VS Code 扩展'
  }
}

async function start() {
  if (!canStart.value || busy.value) return
  busy.value = true
  message.value = ''
  bridgeError.value = ''
  savePort('chainscope.vscode.portA', portA.value)
  savePort('chainscope.vscode.portB', portB.value)
  try {
    const payload = await startManagedNodes([
      { p2pPort: Number(portA.value), label: '节点 A' },
      {
        p2pPort: Number(portB.value),
        label: '节点 B',
        connectTo: Number(portA.value),
      },
    ])
    terminals.value = payload?.terminals ?? []
    message.value = '终端已创建，正在等待两个节点的 API 就绪…'
    emit('started')
  } catch (error) {
    bridgeError.value = error?.message || '启动失败'
  } finally {
    busy.value = false
  }
}

async function stop() {
  if (stopping.value) return
  stopping.value = true
  bridgeError.value = ''
  try {
    await stopManagedNodes()
    terminals.value = []
    message.value = '托管终端已关闭'
    emit('stopped')
  } catch (error) {
    bridgeError.value = error?.message || '停止失败'
  } finally {
    stopping.value = false
  }
}

onMounted(check)

defineExpose({ check })
</script>

<template>
  <section class="vscode-panel" aria-label="VS Code 终端托管">
    <div class="vscode-head">
      <div>
        <p class="vscode-kicker">// VS CODE / 终端托管</p>
        <h3 class="vscode-title">一键开双节点</h3>
      </div>
      <button
        type="button"
        class="vscode-state"
        :class="`vscode-state--${bridgeState}`"
        :title="bridgeError || '重新检测 VS Code 扩展'"
        @click="check"
      >
        {{ stateLabel }}
      </button>
    </div>

    <p class="vscode-hint">
      由 VS Code 扩展在终端页签中自动执行 <code>npm run start</code>、
      <code>open</code>、<code>connect</code>。不启动时仍可手动使用终端。
    </p>

    <p v-if="online" class="vscode-version">BRIDGE / v{{ bridgeVersion || '旧版' }}</p>

    <div class="vscode-ports">
      <label class="vscode-field">
        <span>节点 A / P2P</span>
        <input
          v-model="portA"
          type="number"
          min="1024"
          max="65535"
          inputmode="numeric"
          spellcheck="false"
        />
      </label>
      <label class="vscode-field">
        <span>节点 B / P2P</span>
        <input
          v-model="portB"
          type="number"
          min="1024"
          max="65535"
          inputmode="numeric"
          spellcheck="false"
        />
      </label>
    </div>

    <div class="vscode-actions">
      <button
        type="button"
        class="vscode-start"
        :disabled="!canStart || busy"
        @click="start"
      >
        <span v-if="busy" class="vscode-dot" aria-hidden="true"></span>
        {{ busy ? '正在创建终端…' : '在 VS Code 中启动' }}
      </button>
      <button
        v-if="terminals.length"
        type="button"
        class="vscode-stop"
        :disabled="stopping"
        @click="stop"
      >
        {{ stopping ? '停止中…' : '停止' }}
      </button>
    </div>

    <p v-if="bridgeState === 'offline'" class="vscode-note vscode-note--warn">
      未检测到 VS Code 扩展。请安装并启用扩展，然后点右上角状态重试。
    </p>
    <p v-else-if="bridgeError" class="vscode-note vscode-note--warn" role="alert">
      {{ bridgeError }}
    </p>
    <p v-else-if="message" class="vscode-note vscode-note--ok" role="status">
      {{ message }}
    </p>
    <p v-if="terminals.length" class="vscode-terminals">
      {{ terminals.map((item) => item.name).join(' / ') }}
    </p>
  </section>
</template>

<style scoped>
.vscode-panel {
  padding-top: 18px;
  border-top: 1px solid var(--line-soft);
}

.vscode-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.vscode-kicker {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.15em;
}

.vscode-title {
  margin-top: 6px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 800;
  font-stretch: 108%;
  line-height: 1;
  letter-spacing: -0.025em;
}

.vscode-state {
  flex: none;
  min-height: 26px;
  padding: 3px 8px;
  border: 1px solid var(--ink);
  background: transparent;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.vscode-state--online {
  background: var(--signal);
}

.vscode-state--offline,
.vscode-state--error {
  border-style: dashed;
  color: var(--muted);
}

.vscode-state--checking {
  color: var(--muted);
}

.vscode-hint {
  margin-top: 9px;
  color: var(--muted);
  font-size: 12.5px;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.vscode-hint code {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 11.5px;
}

.vscode-version {
  margin-top: 6px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
}

.vscode-ports {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.vscode-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.vscode-field span {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.08em;
}

.vscode-field input {
  width: 100%;
  min-height: 34px;
  padding: 5px 8px;
  border: 1px solid var(--ink);
  border-radius: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 14px;
}

.vscode-field input:focus-visible {
  outline: 2px solid var(--signal);
  outline-offset: 1px;
}

.vscode-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.vscode-start {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.vscode-start:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.vscode-stop {
  flex: none;
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid var(--ink);
  background: transparent;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 12px;
  cursor: pointer;
}

.vscode-stop:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.vscode-dot {
  width: 7px;
  height: 7px;
  background: var(--signal);
  animation: vscode-blink 0.8s steps(2) infinite;
}

.vscode-note {
  margin-top: 10px;
  padding-left: 9px;
  border-left: 2px solid var(--ink);
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.vscode-note--ok {
  border-left-color: var(--signal);
  color: var(--ink);
}

.vscode-note--warn {
  border-left-color: var(--ink);
}

.vscode-terminals {
  margin-top: 7px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 10.5px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

@keyframes vscode-blink {
  50% {
    opacity: 0.25;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vscode-dot {
    animation: none;
  }
}
</style>
