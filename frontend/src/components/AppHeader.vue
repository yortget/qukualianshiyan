<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: { type: Object, default: null },
  status: { type: String, default: 'connecting' },
  updatedLabel: { type: String, default: '—' },
})

const statusMap = {
  connected: { label: '已连接', tone: 'live' },
  connecting: { label: '同步中', tone: 'pending' },
  disconnected: { label: '已离线', tone: 'offline' },
}

const statusMeta = computed(() => statusMap[props.status] ?? statusMap.connecting)

const nodeLabel = computed(() => {
  if (!props.node) return '等待节点'

  const offline = props.node.reachable === false ? '离线 · ' : ''
  const p2p = props.node.p2pPort ? `P2P ${props.node.p2pPort}` : 'P2P 未启动'
  return `${offline}${p2p} · API :${props.node.apiPort}`
})
</script>

<template>
  <header class="masthead">
    <div class="masthead-top">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">
          <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
            <rect width="34" height="34" fill="#fffa00" />
            <path
              d="M17 8.5 25 13.2v8.1L17 26l-8-4.7v-8.1L17 8.5Z"
              stroke="#191919"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
            <path
              d="m9.3 13.3 7.7 4.4 7.7-4.4M17 17.7V26"
              stroke="#191919"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
          </svg>
        </span>

        <span class="brand-copy">
          <strong>ChainScope</strong>
          <small>P2P BLOCK LEDGER</small>
        </span>
      </div>

      <div class="masthead-status" aria-live="polite">
        <span class="status-pill" :class="`status-pill--${statusMeta.tone}`">
          <span class="status-dot" aria-hidden="true"></span>
          {{ statusMeta.label }}
        </span>
        <span class="updated">LAST SYNC <strong>{{ updatedLabel }}</strong></span>
      </div>
    </div>

    <div class="masthead-main">
      <div class="title-block">
        <p class="eyebrow">// BLOCKCHAIN VISUALIZATION / 实时链状态</p>
        <h1>区块总览</h1>
      </div>

      <div class="masthead-note">
        <p class="lede">实时读取节点链上数据，逐块核对哈希、数据与出块时间。</p>
        <p class="node-line">
          <span class="node-line-label">// CURRENT NODE / 当前节点</span>
          <span class="node-line-value">{{ nodeLabel }}</span>
        </p>
      </div>
    </div>
  </header>
</template>

<style scoped>
.masthead {
  grid-column: 1 / -1;
  margin-bottom: 10px;
}

.masthead-top {
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 11px 16px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-mark {
  display: inline-flex;
  flex: none;
  width: 34px;
  height: 34px;
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.brand-copy strong {
  font-family: var(--font-display);
  font-size: 25px;
  font-weight: 800;
  font-stretch: 112%;
  line-height: 1;
  letter-spacing: 0.002em;
  color: var(--paper);
}

.brand-copy small {
  color: rgba(242, 242, 236, 0.52);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.19em;
  white-space: nowrap;
}

.masthead-status {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 7px 12px;
  border: 1px solid rgba(242, 242, 236, 0.42);
  background: transparent;
  color: var(--paper);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.status-dot {
  width: 9px;
  height: 9px;
  background: var(--signal);
}

.status-pill--live .status-dot {
  background: var(--mint);
}

.status-pill--pending,
.status-pill--offline {
  border-color: var(--signal);
  background: var(--signal);
  color: var(--ink);
}

.status-pill--pending .status-dot,
.status-pill--offline .status-dot {
  background: var(--ink);
}

.updated {
  color: rgba(242, 242, 236, 0.5);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.13em;
  white-space: nowrap;
}

.updated strong {
  display: block;
  margin-top: 2px;
  color: var(--paper);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.masthead-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 390px);
  align-items: end;
  gap: 36px;
  margin-top: 14px;
  padding: 24px 24px 26px;
  border: 1px solid var(--ink);
  background: rgba(242, 242, 236, 0.9);
}

.eyebrow {
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  line-height: 1.5;
}

h1 {
  position: relative;
  z-index: 1;
  width: fit-content;
  margin-top: 12px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(58px, 6.6vw, 96px);
  font-weight: 900;
  font-stretch: 112%;
  line-height: 0.94;
  letter-spacing: -0.04em;
  animation: title-drive 0.72s var(--ease-drive) both;
}

h1::after {
  content: '区块总览';
  position: absolute;
  top: 0.05em;
  left: 0.04em;
  z-index: -1;
  color: transparent;
  -webkit-text-stroke: 1px rgba(25, 25, 25, 0.16);
  pointer-events: none;
  white-space: nowrap;
}

.masthead-note {
  min-width: 0;
  padding-bottom: 5px;
}

.lede {
  color: var(--ink-soft);
  font-size: 17.5px;
  line-height: 1.75;
  overflow-wrap: anywhere;
}

.node-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px solid var(--line-soft);
  overflow-wrap: anywhere;
}

.node-line-label {
  flex: none;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.17em;
}

.node-line-value {
  min-width: 0;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 14.5px;
  font-weight: 500;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

@media (max-width: 1080px) {
  .masthead-main {
    grid-template-columns: minmax(0, 1fr) minmax(240px, 320px);
    gap: 26px;
  }
}

@media (max-width: 820px) {
  .masthead-top {
    flex-wrap: wrap;
    gap: 14px 20px;
  }

  .masthead-status {
    width: 100%;
    justify-content: space-between;
    margin-left: 0;
    padding-top: 12px;
    border-top: 1px solid rgba(242, 242, 236, 0.2);
  }

  .masthead-main {
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    gap: 18px;
    margin-top: 26px;
  }

  h1 {
    font-size: clamp(46px, 9vw, 64px);
  }

  .lede {
    max-width: 480px;
  }
}

@media (max-width: 520px) {
  .masthead {
    padding-top: 12px;
  }

  .masthead-main {
    padding: 18px 16px 20px;
  }

  .brand-copy strong {
    font-size: 22px;
  }

  .brand-copy small {
    font-size: 9.5px;
  }

  .masthead-status {
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
    gap: 12px;
  }

  .updated {
    text-align: right;
  }

  .eyebrow {
    font-size: 10px;
    letter-spacing: 0.12em;
  }

  h1 {
    font-size: 44px;
    letter-spacing: -0.045em;
  }

  .lede {
    font-size: 16px;
  }
}
</style>
