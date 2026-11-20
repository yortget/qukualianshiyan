<script setup>
import { computed, ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import NodePanel from './components/NodePanel.vue'
import MinePanel from './components/MinePanel.vue'
import VsCodePanel from './components/VsCodePanel.vue'
import BlockCard from './components/BlockCard.vue'
import ChainConnector from './components/ChainConnector.vue'
import StatePanel from './components/StatePanel.vue'
import CoverPage from './components/CoverPage.vue'
import { mineBlock as mineBlockRequest } from './api/nodeClient'
import { useNodeNetwork } from './composables/useNodeNetwork'
import { formatTimestamp } from './utils/format'

const {
  nodes,
  currentNode,
  blocks,
  peers,
  connectionState,
  errorMessage,
  lastUpdatedLabel,
  isLoadingNodes,
  isRefreshingChain,
  isBootstrapping,
  autoRefresh,
  refreshNodes,
  refreshChain,
  selectNode,
} = useNodeNetwork()

const entered = ref(false)
const transitioning = ref(false)
const transitionTarget = ref(false)
let transitionTimer = 0

function switchView(next) {
  if (transitioning.value || next === entered.value) return

  transitionTarget.value = next
  transitioning.value = true
  window.clearTimeout(transitionTimer)
  window.setTimeout(() => {
    entered.value = next
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, 480)
  transitionTimer = window.setTimeout(() => {
    transitioning.value = false
  }, 1040)
}

function enterDashboard() {
  switchView(true)
}

function goHome() {
  switchView(false)
}

const hasBlocks = computed(() => blocks.value.length > 0)
const latestBlock = computed(() => blocks.value[blocks.value.length - 1] ?? null)
const chainCount = computed(() => String(blocks.value.length).padStart(2, '0'))

const latestIndex = computed(() =>
  latestBlock.value ? `#${latestBlock.value.index}` : '—',
)

const latestStamp = computed(() =>
  latestBlock.value ? formatTimestamp(latestBlock.value.timestamp).slice(5) : '—',
)

const refreshMode = computed(() => (autoRefresh.value ? '自动 · 2s' : '手动'))

const showBlockingError = computed(
  () =>
    !isBootstrapping.value &&
    !hasBlocks.value &&
    Boolean(errorMessage.value) &&
    !isLoadingNodes.value &&
    !isRefreshingChain.value,
)

const showLoadingState = computed(
  () =>
    isBootstrapping.value ||
    (!hasBlocks.value && (isLoadingNodes.value || isRefreshingChain.value)),
)

const showEmptyState = computed(
  () => !hasBlocks.value && !showLoadingState.value && !showBlockingError.value,
)

function handleAutoRefresh(value) {
  autoRefresh.value = value
}

function handleManagedStarted() {
  window.setTimeout(() => refreshNodes(), 1200)
  window.setTimeout(() => refreshNodes(), 3200)
}

const refreshSerial = ref(0)
const isMining = ref(false)
const mineError = ref('')
const mineNotice = ref('')

const viewState = computed(() => {
  if (showLoadingState.value) return 'loading'
  if (showBlockingError.value) return 'error'
  if (showEmptyState.value) return 'empty'
  return 'chain'
})

const chainViewKey = computed(
  () => `${currentNode.value?.apiBase ?? 'none'}:${viewState.value}:${refreshSerial.value}`,
)

function handleRefreshChain() {
  refreshSerial.value += 1
  refreshChain()
}

function handleSelectNode(node) {
  mineError.value = ''
  mineNotice.value = ''
  selectNode(node)
}

async function handleMine(data) {
  if (isMining.value || !currentNode.value) return

  const target = currentNode.value
  const value = String(data ?? '').trim()
  if (!value) return

  isMining.value = true
  mineError.value = ''
  mineNotice.value = ''

  try {
    const beforeTip = Number(blocks.value.at(-1)?.index ?? -1)
    const response = await mineBlockRequest(target.apiBase, value)

    // 用户在挖矿途中切换了数据源时，不把旧节点的结果展示到新节点上。
    if (currentNode.value?.apiBase !== target.apiBase) return

    await refreshChain()
    if (currentNode.value?.apiBase !== target.apiBase) return

    const minedBlock =
      blocks.value.find((item) => Number(item.index) > beforeTip) ??
      (response?.index != null ? response : null)

    if (minedBlock && !blocks.value.some((item) => item.hash === minedBlock.hash)) {
      blocks.value = [...blocks.value, minedBlock]
    }

    mineNotice.value =
      minedBlock?.index != null
        ? `已挖出区块 #${minedBlock.index}${
            minedBlock.hash ? ` · ${String(minedBlock.hash).slice(0, 14)}…` : ''
          } · ${peers.value.length ? `已广播到 ${peers.value.length} 个连接` : '当前无 P2P 连接'}`
        : `挖掘请求已提交${
            peers.value.length ? `，正在向 ${peers.value.length} 个连接广播` : '，当前无 P2P 连接'
          }`
  } catch (error) {
    mineError.value = `挖掘失败：${error?.message || '未知错误'}`
  } finally {
    isMining.value = false
  }
}
</script>

<template>
  <CoverPage
    v-if="!entered"
    :status="connectionState"
    :latest-index="latestIndex"
    :node-count="nodes.length"
    :block-count="blocks.length"
    :updated-label="lastUpdatedLabel"
    :node="currentNode"
    @enter="enterDashboard"
  />

  <div v-else class="shell">
      <div class="tri-band" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>

    <AppHeader
      :node="currentNode"
      :status="connectionState"
      :updated-label="lastUpdatedLabel"
    />

    <aside class="rail">
      <div class="rail-index">
        <span class="rail-index-number">{{ chainCount }}</span>
        <span class="rail-index-copy">
          BLOCKS<br />CONTROL PANEL
        </span>
      </div>

      <NodePanel
        :nodes="nodes"
        :current-api="currentNode?.apiBase ?? null"
        :loading="isLoadingNodes"
        :refreshing="isRefreshingChain"
        :auto-refresh="autoRefresh"
        :current-block-count="hasBlocks ? blocks.length : null"
        @select="handleSelectNode"
        @refresh="refreshNodes"
        @refresh-chain="handleRefreshChain"
        @update:auto-refresh="handleAutoRefresh"
      />

      <MinePanel
        :node="currentNode"
        :mining="isMining"
        :error="mineError"
        :notice="mineNotice"
        @mine="handleMine"
      />

      <VsCodePanel @started="handleManagedStarted" @stopped="refreshNodes" />

      <div class="rail-meta">
        <p class="rail-meta-label">API ENDPOINT</p>
        <code class="rail-meta-value">{{ currentNode?.apiBase ?? '—' }}</code>
        <p class="rail-meta-foot">
          {{ blocks.length }} 个区块
          <span aria-hidden="true">/</span>
          P2P {{ currentNode?.p2pPort ?? '未启动' }}
        </p>
      </div>

      <button
        type="button"
        class="rail-home"
        :disabled="transitioning"
        @click="goHome"
      >
        <span aria-hidden="true">←</span>
        <span>返回首页</span>
      </button>
    </aside>

    <main class="main">
      <section v-if="hasBlocks && currentNode" class="metrics" aria-label="链上概览">
        <article class="metric">
          <span class="metric-label">// 区块高度 / HEIGHT</span>
          <strong class="metric-value">{{ latestIndex }}</strong>
          <span class="metric-foot">{{ blocks.length }} 个区块</span>
        </article>

        <article class="metric">
          <span class="metric-label">// P2P 连接 / PEERS</span>
          <strong class="metric-value">{{ peers.length }}</strong>
          <span class="metric-foot">个对等节点</span>
        </article>

        <article class="metric">
          <span class="metric-label">// 最新出块 / LATEST</span>
          <strong class="metric-value metric-value--time">{{ latestStamp }}</strong>
          <span class="metric-foot">本地时间</span>
        </article>

        <article class="metric">
          <span class="metric-label">// 刷新模式 / MODE</span>
          <strong class="metric-value metric-value--mode">{{ refreshMode }}</strong>
          <span class="metric-foot">轮询间隔</span>
        </article>
      </section>

      <section class="chain-section" aria-label="区块链数据">
        <div class="section-head">
          <span class="section-ghost" aria-hidden="true">{{ chainCount }}</span>
          <div class="section-title">
            <p class="section-kicker">// CHAIN STATE</p>
            <h2>链上区块</h2>
          </div>
          <span class="section-count">
            <strong>{{ blocks.length }}</strong>
            <span>BLOCKS</span>
          </span>
        </div>

        <div class="chain-stage">
          <Transition name="chain-fade">
            <div :key="chainViewKey" class="chain-view">
              <StatePanel
                v-if="showLoadingState"
                tone="loading"
                title="正在连接节点…"
                message="读取节点信息与区块链数据，请稍候"
              />

              <StatePanel
                v-else-if="showBlockingError"
                tone="error"
                title="无法连接节点"
                :message="errorMessage"
                retry-label="重新连接"
                @retry="refreshNodes"
              />

              <StatePanel
                v-else-if="showEmptyState"
                tone="empty"
                title="暂无区块数据"
                message="当前节点还没有返回任何区块。"
              />

              <template v-else>
                <div v-if="errorMessage" class="stale-banner" role="alert">
                  <span class="banner-mark" aria-hidden="true"></span>
                  <p>
                    <strong>连接中断。</strong>{{ errorMessage }} 当前展示最后一次同步的数据。
                  </p>
                  <button type="button" @click="handleRefreshChain">重试</button>
                </div>

                <div class="chain-list">
                  <div
                    v-for="(block, index) in blocks"
                    :key="block.hash || `${block.index}-${index}`"
                    class="chain-item"
                  >
                    <BlockCard
                      :block="block"
                      :index="index"
                      :latest="index === blocks.length - 1"
                    />
                    <ChainConnector v-if="index < blocks.length - 1" />
                  </div>
                </div>

                <footer class="chain-footer">
                  <span>数据源 {{ currentNode.apiBase }}</span>
                  <span aria-hidden="true">/</span>
                  <span>P2P {{ currentNode.p2pPort ?? '未启动' }}</span>
                  <span aria-hidden="true">/</span>
                  <span>{{ peers.length }} 个 P2P 连接</span>
                  <span aria-hidden="true">/</span>
                  <span>更新于 {{ lastUpdatedLabel }}</span>
                </footer>
              </template>
            </div>
          </Transition>
        </div>
      </section>
    </main>
    </div>

  <div class="page-transition" :class="{ 'is-active': transitioning }" aria-hidden="true">
    <div class="page-transition-panel">
      <p class="page-transition-kicker">// CHAIN VIEW / 视图切换</p>
      <strong class="page-transition-brand">ChainScope</strong>
      <div class="page-transition-foot">
        <span>{{ transitionTarget ? 'RETURN / 返回封面' : 'VIEW / 链上数据' }}</span>
        <span>CS / 05</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-transition {
  position: fixed;
  inset: 0;
  z-index: 90;
  visibility: hidden;
  overflow: hidden;
  pointer-events: none;
}

.page-transition.is-active {
  visibility: visible;
  pointer-events: all;
}

.page-transition-panel {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 24px;
  padding: clamp(28px, 7vh, 78px) clamp(24px, 7vw, 96px);
  background: linear-gradient(180deg, var(--paper) 0%, var(--paper) 62%, #c9ccc3 100%);
  transform: translateY(-100%);
}

.page-transition.is-active .page-transition-panel {
  animation: page-wipe 1.04s var(--ease-drive) both;
}

.page-transition-panel::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--magenta) 0 33.33%,
    var(--signal) 33.33% 66.66%,
    var(--mint) 66.66% 100%
  );
}

.page-transition-panel::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 8px;
  background: var(--signal);
}

.page-transition-kicker {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.17em;
}

.page-transition-brand {
  align-self: center;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(64px, 13vw, 190px);
  font-weight: 900;
  font-stretch: 112%;
  line-height: 0.82;
  letter-spacing: -0.06em;
}

.page-transition-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.13em;
}

.page-transition-foot span:last-child {
  color: var(--faint);
}

@keyframes page-wipe {
  0% {
    transform: translateY(-100%);
  }

  44%,
  56% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-transition {
    display: none;
  }
}

.shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(250px, 292px) minmax(0, 1fr);
  align-items: start;
  gap: 34px 58px;
  width: min(1480px, calc(100% - 88px));
  margin: 0 auto;
  padding: 30px 0 80px;
}

.tri-band {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 50;
  display: flex;
  height: 3px;
  pointer-events: none;
}

.tri-band span {
  flex: 1;
  transform-origin: left center;
  animation: tri-draw 0.7s var(--ease-drive) both;
}

.tri-band span:nth-child(1) {
  background: var(--magenta);
}

.tri-band span:nth-child(2) {
  background: var(--signal);
  animation-delay: 0.06s;
}

.tri-band span:nth-child(3) {
  background: var(--mint);
  animation-delay: 0.12s;
}

.rail {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 20px 18px 18px;
  border: 1px solid var(--ink);
  background: var(--panel);
}

.rail::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  width: 54px;
  height: 6px;
  border-right: 1px solid var(--ink);
  border-bottom: 1px solid var(--ink);
  background: var(--ink);
}

.rail-index {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 11px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line-soft);
}

.rail-index-number {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 54px;
  font-weight: 800;
  font-stretch: 108%;
  line-height: 0.8;
  letter-spacing: -0.035em;
}

.rail-index-copy {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 10.5px;
  line-height: 1.55;
  letter-spacing: 0.17em;
}

.rail-meta {
  padding-top: 16px;
  border-top: 1px solid var(--line-soft);
}

.rail-meta-label {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.18em;
}

.rail-meta-value {
  display: block;
  margin-top: 7px;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.rail-meta-foot {
  margin-top: 7px;
  color: var(--muted);
  font-size: 13px;
}

.rail-meta-foot span {
  margin: 0 5px;
  color: var(--faint);
}

.rail-home {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-top: 2px;
  padding: 12px 13px;
  border: 1px solid var(--ink);
  background: transparent;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-align: left;
  cursor: pointer;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
  transition: background-color 0.18s ease, color 0.18s ease;
}

.rail-home span:first-child {
  color: var(--faint);
  font-size: 17px;
  line-height: 1;
}

.rail-home:hover,
.rail-home:focus-visible {
  background: var(--signal);
}

.rail-home:hover span:first-child,
.rail-home:focus-visible span:first-child {
  color: var(--ink);
}

.rail-home:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 3px;
}

.rail-home:disabled {
  cursor: wait;
  opacity: 0.6;
}

.main {
  min-width: 0;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 42px;
  border: 1px solid var(--ink);
  background: var(--panel);
}

.metric {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  padding: 20px 22px 22px;
  border-right: 1px solid var(--line-soft);
  animation: board-in 0.42s var(--ease-snap) both;
}

.metric:nth-child(2) {
  animation-delay: 45ms;
}

.metric:nth-child(3) {
  animation-delay: 90ms;
}

.metric:nth-child(4) {
  animation-delay: 135ms;
}

.metric:last-child {
  border-right: 0;
  padding-right: 22px;
}

.metric::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 22px;
  width: 28px;
  height: 4px;
  background: var(--ink);
}

.metric-label {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.09em;
}

.metric-value {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(44px, 4.5vw, 64px);
  font-weight: 800;
  font-stretch: 112%;
  line-height: 0.9;
  letter-spacing: -0.04em;
}

.metric-value--time {
  padding-top: 6px;
  font-family: var(--font-mono);
  font-size: clamp(17px, 1.6vw, 22px);
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.02em;
  white-space: nowrap;
}

.metric-value--mode {
  padding-top: 4px;
  font-family: var(--font-sans);
  font-size: clamp(22px, 2.1vw, 28px);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.03em;
}

.metric-foot {
  color: var(--faint);
  font-size: 13px;
}

.chain-section {
  min-width: 0;
}

.section-head {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 26px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--ink);
  overflow: hidden;
}

.section-ghost {
  position: absolute;
  right: 128px;
  bottom: -30px;
  z-index: 0;
  color: transparent;
  font-family: var(--font-display);
  font-size: clamp(100px, 13vw, 158px);
  font-weight: 900;
  font-stretch: 125%;
  line-height: 0.7;
  letter-spacing: -0.06em;
  -webkit-text-stroke: 1px rgba(25, 25, 25, 0.16);
  pointer-events: none;
  user-select: none;
}

.section-title,
.section-count {
  position: relative;
  z-index: 1;
}

.section-kicker {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.17em;
}

.section-title h2 {
  margin-top: 6px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(40px, 4.2vw, 54px);
  font-weight: 800;
  font-stretch: 108%;
  line-height: 0.95;
  letter-spacing: -0.035em;
}

.section-count {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  flex: none;
  padding: 8px 14px;
  border: 1px solid var(--ink);
  background: var(--panel);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.13em;
  white-space: nowrap;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
}

.section-count strong {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 800;
  font-stretch: 112%;
  line-height: 0.8;
  letter-spacing: -0.03em;
}

.chain-list {
  display: flex;
  flex-direction: column;
}

.chain-stage {
  position: relative;
  min-height: 300px;
  overflow: hidden;
}

.chain-view {
  min-width: 0;
}

.chain-fade-enter-active,
.chain-fade-leave-active {
  transition:
    opacity 0.42s var(--ease-snap),
    transform 0.42s var(--ease-snap);
}

.chain-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.chain-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.chain-fade-leave-active {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.chain-item {
  display: flex;
  flex-direction: column;
}

.chain-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 7px 11px;
  margin-top: 34px;
  padding: 13px 16px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: rgba(242, 242, 236, 0.7);
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.015em;
  overflow-wrap: anywhere;
}

.chain-footer span[aria-hidden='true'] {
  color: rgba(242, 242, 236, 0.36);
}

.stale-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 13px 15px;
  border: 1px solid var(--ink);
  border-left: 6px solid var(--signal);
  background: rgba(255, 250, 0, 0.2);
  color: var(--ink-soft);
  font-size: 14px;
}

.banner-mark {
  flex: none;
  width: 9px;
  height: 9px;
  background: var(--ink);
}

.stale-banner p {
  flex: 1;
  min-width: 0;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.stale-banner strong {
  color: var(--ink);
  font-weight: 700;
}

.stale-banner button {
  flex: none;
  padding: 6px 13px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
  font-size: 12.5px;
  cursor: pointer;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%);
}

.stale-banner button:hover {
  background: var(--lime);
  color: var(--ink);
}

@media (max-width: 1180px) {
  .shell {
    grid-template-columns: minmax(220px, 256px) minmax(0, 1fr);
    gap: 30px 36px;
    width: calc(100% - 56px);
  }

  .metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric {
    border-bottom: 1px solid var(--line-soft);
  }

  .metric:nth-child(2n) {
    border-right: 0;
  }

  .metric:nth-child(n + 3) {
    padding-top: 22px;
  }

  .metric:nth-last-child(-n + 2) {
    border-bottom: 0;
  }

  .metric-value {
    font-size: 46px;
  }

  .metric-value--time {
    font-size: 19px;
  }

  .metric-value--mode {
    font-size: 25px;
  }
}

@media (max-width: 900px) {
  .shell {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
    width: calc(100% - 44px);
    padding: 20px 0 56px;
  }

  .rail {
    position: static;
    gap: 18px;
    padding: 16px 14px 14px;
  }

  .rail-index {
    padding-bottom: 12px;
  }

  .rail-meta {
    display: none;
  }
}

@media (max-width: 620px) {
  .shell {
    width: calc(100% - 28px);
    padding-top: 14px;
  }

  .rail-index-number {
    font-size: 42px;
  }

  .metrics {
    margin-bottom: 32px;
  }

  .metric {
    padding: 15px 12px 16px;
  }

  .metric:last-child {
    padding-right: 12px;
  }

  .metric::before {
    top: 8px;
    left: 12px;
  }

  .metric-value {
    font-size: 38px;
  }

  .metric-value--time {
    font-size: 14px;
    white-space: normal;
  }

  .metric-value--mode {
    font-size: 21px;
  }

  .metric-label {
    font-size: 10px;
    letter-spacing: 0.04em;
  }

  .section-title h2 {
    font-size: 38px;
  }

  .section-ghost {
    display: none;
  }

  .section-count {
    padding: 6px 8px;
  }

  .section-count strong {
    font-size: 22px;
  }

  .section-count span {
    font-size: 9px;
  }

  .stale-banner {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .stale-banner p {
    flex-basis: calc(100% - 24px);
  }
}
</style>
