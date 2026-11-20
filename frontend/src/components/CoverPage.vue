<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, default: 'connecting' },
  latestIndex: { type: String, default: '—' },
  nodeCount: { type: Number, default: 0 },
  blockCount: { type: Number, default: 0 },
  updatedLabel: { type: String, default: '—' },
  node: { type: Object, default: null },
})

defineEmits(['enter'])

const statusMap = {
  connected: { label: '已连接', tone: 'live' },
  connecting: { label: '同步中', tone: 'pending' },
  disconnected: { label: '已离线', tone: 'offline' },
}

const statusMeta = computed(() => statusMap[props.status] ?? statusMap.connecting)
const blockLabel = computed(() => String(props.blockCount).padStart(2, '0'))
const nodeLabel = computed(() => {
  if (!props.node) return '等待节点'
  const p2p = props.node.p2pPort ? `P2P ${props.node.p2pPort}` : 'P2P 未启动'
  return `${p2p} · API :${props.node.apiPort}`
})
</script>

<template>
  <section class="cover">
    <div class="cover-band" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </div>

    <header class="cover-dock">
      <div class="cover-brand">
        <span class="cover-mark" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
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
        <span>
          <strong>ChainScope</strong>
          <small>P2P BLOCK LEDGER</small>
        </span>
      </div>

      <div class="cover-dock-meta">
        <span class="cover-status" :class="`cover-status--${statusMeta.tone}`">
          <i aria-hidden="true"></i>
          {{ statusMeta.label }}
        </span>
        <span class="cover-sync">LAST SYNC <strong>{{ updatedLabel }}</strong></span>
      </div>
    </header>

    <div class="cover-main">
      <div class="cover-hero">
        <p class="cover-eyebrow">// BLOCKCHAIN VISUALIZATION / 链上数据封面</p>
        <h1>区块<br /><span>总览</span></h1>
        <p class="cover-lede">
          读取节点链上数据，逐块核对哈希、数据与出块时间。<br />
          从一个可验证的起点，进入实时协作的链上世界。
        </p>
        <p class="cover-node">
          <span>// CURRENT NODE / 当前节点</span>
          <strong>{{ nodeLabel }}</strong>
        </p>
      </div>

      <aside class="cover-side" aria-label="链上概览">
        <div class="cover-stats">
          <div class="cover-stat">
            <span>区块高度</span>
            <strong>{{ latestIndex }}</strong>
            <small>HEIGHT</small>
          </div>
          <div class="cover-stat">
            <span>P2P 节点</span>
            <strong>{{ nodeCount }}</strong>
            <small>PEERS</small>
          </div>
          <div class="cover-stat">
            <span>链上区块</span>
            <strong>{{ blockLabel }}</strong>
            <small>BLOCKS</small>
          </div>
          <div class="cover-stat">
            <span>刷新模式</span>
            <strong class="cover-stat-text">自动</strong>
            <small>LIVE / 2S</small>
          </div>
        </div>

        <button type="button" class="cover-enter" @click="$emit('enter')">
          <span>查看数据</span>
          <span aria-hidden="true">→</span>
        </button>
        <p class="cover-hint">READ THE CHAIN / 进入链上总览</p>
      </aside>
    </div>

    <footer class="cover-footer">
      <span>CHAIN STATE / 实时链上状态</span>
      <span aria-hidden="true">/</span>
      <span>{{ blockCount }} BLOCKS</span>
      <span aria-hidden="true">/</span>
      <span>{{ nodeCount }} P2P NODES</span>
      <span class="cover-footer-mark" aria-hidden="true">CS / 05</span>
    </footer>

    <span class="cover-ghost" aria-hidden="true">CHAIN</span>
  </section>
</template>

<style scoped>
.cover {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(1480px, calc(100% - 88px));
  min-height: 100vh;
  min-height: 100svh;
  margin: 0 auto;
  padding: 28px 0 24px;
  overflow: hidden;
}

.cover-band {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  display: flex;
  height: 3px;
  pointer-events: none;
}

.cover-band span {
  flex: 1;
  transform-origin: left center;
  animation: tri-draw 0.7s var(--ease-drive) both;
}

.cover-band span:nth-child(1) {
  background: var(--magenta);
}

.cover-band span:nth-child(2) {
  background: var(--signal);
  animation-delay: 0.06s;
}

.cover-band span:nth-child(3) {
  background: var(--mint);
  animation-delay: 0.12s;
}

.cover-dock {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 16px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
}

.cover-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cover-mark {
  display: inline-flex;
  flex: none;
  width: 32px;
  height: 32px;
}

.cover-brand strong,
.cover-brand small {
  display: block;
}

.cover-brand strong {
  font-family: var(--font-display);
  font-size: 25px;
  font-weight: 800;
  font-stretch: 112%;
  line-height: 0.9;
  letter-spacing: -0.015em;
}

.cover-brand small {
  margin-top: 3px;
  color: rgba(242, 242, 236, 0.58);
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.13em;
}

.cover-dock-meta {
  display: flex;
  align-items: center;
  gap: 18px;
  font-family: var(--font-mono);
}

.cover-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 11px;
  border: 1px solid rgba(242, 242, 236, 0.34);
  color: var(--paper);
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
}

.cover-status i {
  width: 7px;
  height: 7px;
  background: var(--signal);
}

.cover-status--pending i,
.cover-status--offline i {
  background: var(--amber);
}

.cover-status--offline {
  border-color: var(--signal);
  background: var(--signal);
  color: var(--ink);
}

.cover-sync {
  color: rgba(242, 242, 236, 0.5);
  font-size: 10.5px;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.cover-sync strong {
  margin-left: 4px;
  color: var(--paper);
  font-size: 13px;
  font-weight: 500;
}

.cover-main {
  display: grid;
  grid-template-columns: minmax(0, 1.32fr) minmax(300px, 0.68fr);
  flex: 1;
  gap: clamp(32px, 5vw, 76px);
  align-items: end;
  padding: clamp(52px, 9vh, 108px) 0 42px;
  border-bottom: 1px solid var(--ink);
}

.cover-hero {
  min-width: 0;
}

.cover-eyebrow {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.15em;
  animation: cover-rise 0.7s var(--ease-drive) 0.08s both;
}

.cover h1 {
  margin-top: clamp(18px, 3vh, 30px);
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(82px, 11.5vw, 178px);
  font-weight: 900;
  font-stretch: 112%;
  line-height: 0.9;
  letter-spacing: -0.06em;
  text-transform: none;
  animation: cover-rise 0.9s var(--ease-drive) 0.14s both;
}

.cover h1 span {
  margin-left: 0.45em;
}

.cover-lede {
  max-width: 620px;
  margin-top: clamp(24px, 4vh, 42px);
  color: var(--ink-soft);
  font-size: clamp(16px, 1.3vw, 19px);
  line-height: 1.75;
  animation: cover-rise 0.8s var(--ease-drive) 0.22s both;
}

.cover-node {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 14px;
  margin-top: 24px;
  color: var(--ink);
  font-family: var(--font-mono);
  animation: cover-rise 0.8s var(--ease-drive) 0.3s both;
}

.cover-node span {
  color: var(--faint);
  font-size: 11px;
  letter-spacing: 0.12em;
}

.cover-node strong {
  font-size: 14px;
  font-weight: 500;
}

.cover-side {
  position: relative;
  z-index: 1;
  min-width: 0;
  padding-left: clamp(20px, 3vw, 42px);
  border-left: 1px solid var(--ink);
  animation: cover-rise 0.8s var(--ease-drive) 0.26s both;
}

.cover-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid var(--line-soft);
}

.cover-stat {
  min-width: 0;
  padding: 14px 10px 15px 0;
  border-bottom: 1px solid var(--line-soft);
}

.cover-stat:nth-child(even) {
  padding-left: 12px;
  border-left: 1px solid var(--line-soft);
}

.cover-stat span {
  display: block;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
}

.cover-stat strong {
  display: block;
  margin-top: 5px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(30px, 3vw, 46px);
  font-weight: 800;
  font-stretch: 110%;
  line-height: 0.88;
  letter-spacing: -0.04em;
}

.cover-stat strong.cover-stat-text {
  font-family: var(--font-mono);
  font-size: clamp(20px, 2vw, 27px);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.cover-stat small {
  display: block;
  margin-top: 6px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.12em;
}

.cover-enter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  margin-top: 22px;
  padding: 19px 18px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-mono);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.cover-enter span {
  color: var(--paper);
}

.cover-enter span:last-child {
  color: var(--signal);
  font-size: 22px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.cover-enter:hover,
.cover-enter:focus-visible {
  background: var(--signal);
  color: var(--ink);
}

.cover-enter:hover span:last-child,
.cover-enter:focus-visible span:last-child {
  color: var(--ink);
  transform: translateX(4px);
}

.cover-enter:hover span,
.cover-enter:focus-visible span {
  color: var(--ink);
}

.cover-enter:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 3px;
}

.cover-hint {
  margin-top: 10px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-align: right;
}

.cover-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding-top: 14px;
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.06em;
}

.cover-footer-mark {
  margin-left: auto;
  color: var(--ink);
  letter-spacing: 0.15em;
}

.cover-ghost {
  position: absolute;
  right: -2vw;
  bottom: 12vh;
  z-index: 0;
  color: transparent;
  font-family: var(--font-display);
  font-size: clamp(110px, 18vw, 280px);
  font-weight: 800;
  font-stretch: 120%;
  line-height: 0.7;
  letter-spacing: -0.06em;
  opacity: 0.09;
  pointer-events: none;
  -webkit-text-stroke: 1px var(--ink);
}

@keyframes cover-rise {
  from {
    opacity: 0;
    transform: translateY(-22px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .cover {
    width: calc(100% - 48px);
  }

  .cover-main {
    grid-template-columns: 1fr;
    gap: 34px;
    align-items: start;
    padding-top: 52px;
  }

  .cover-side {
    padding: 22px 0 0;
    border-top: 1px solid var(--ink);
    border-left: 0;
  }

  .cover h1 {
    font-size: clamp(70px, 16vw, 118px);
  }

  .cover-ghost {
    right: -4vw;
    bottom: 8vh;
  }
}

@media (max-width: 560px) {
  .cover {
    width: calc(100% - 28px);
    padding-top: 14px;
  }

  .cover-dock {
    align-items: flex-start;
    gap: 12px;
    padding: 11px 12px;
  }

  .cover-dock-meta {
    flex-direction: column;
    align-items: flex-end;
    gap: 7px;
  }

  .cover-brand strong {
    font-size: 22px;
  }

  .cover-brand small {
    font-size: 9.5px;
  }

  .cover-sync {
    font-size: 9.5px;
  }

  .cover-sync strong {
    font-size: 12px;
  }

  .cover-main {
    padding-top: 42px;
    padding-bottom: 30px;
  }

  .cover h1 {
    font-size: clamp(62px, 20vw, 92px);
  }

  .cover h1 span {
    margin-left: 0.28em;
  }

  .cover-lede {
    font-size: 15.5px;
    line-height: 1.7;
  }

  .cover-node {
    display: block;
  }

  .cover-node strong {
    display: block;
    margin-top: 6px;
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  .cover-stats {
    grid-template-columns: 1fr 1fr;
  }

  .cover-enter {
    min-height: 60px;
    font-size: 16px;
  }

  .cover-footer {
    font-size: 9.5px;
  }

  .cover-ghost {
    right: 0;
  }

  .cover-footer-mark {
    flex-basis: 100%;
    margin-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover-band span,
  .cover-eyebrow,
  .cover h1,
  .cover-lede,
  .cover-node,
  .cover-side {
    animation: none;
  }

  .cover-enter,
  .cover-enter span:last-child {
    transition: none;
  }
}
</style>
