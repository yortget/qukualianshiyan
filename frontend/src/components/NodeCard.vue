<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: { type: Object, required: true },
  active: { type: Boolean, default: false },
  blockCount: { type: Number, default: null },
})

defineEmits(['select'])

// 当前节点的区块数优先使用 /blocks 返回的数组长度，确保卡片与下方区块
// 列表来自同一次请求；/nodeInfo 的数字只用于其他节点的概览。
const displayCount = computed(() => props.blockCount ?? props.node.blockCount ?? 0)
const unreachable = computed(() => props.node.reachable === false)
</script>

<template>
  <button
    type="button"
    class="node-card"
    :class="{ 'is-active': active, 'is-unreachable': unreachable }"
    :aria-pressed="active"
    :title="`API ${node.apiBase} · ${displayCount} 个区块${unreachable ? ' · 暂不可达' : ''}`"
    @click="$emit('select', node)"
  >
    <span class="node-dot" aria-hidden="true"></span>

    <span class="node-copy">
      <span class="node-name">{{ node.p2pPort ? `P2P ${node.p2pPort}` : 'P2P 未启动' }}</span>
      <span class="node-api">API :{{ node.apiPort }}</span>
    </span>

    <span class="node-count">
      <strong>{{ displayCount }}</strong>
      <small>区块</small>
    </span>
  </button>
</template>

<style scoped>
.node-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 8px;
  border: 1px solid transparent;
  border-bottom-color: var(--line-soft);
  border-radius: 0;
  background: transparent;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition:
    background 0.18s var(--ease-snap),
    border-color 0.18s var(--ease-snap);
}

.node-card:last-child {
  border-bottom-color: transparent;
}

.node-card:hover {
  background: rgba(255, 250, 0, 0.14);
}

.node-card.is-active {
  position: relative;
  margin: 7px 0;
  padding: 15px 13px 15px 16px;
  border: 1px solid var(--ink);
  border-left: 6px solid var(--ink);
  background: var(--signal);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%);
}

.node-card.is-unreachable {
  opacity: 0.62;
  background-image: repeating-linear-gradient(
    45deg,
    transparent 0 10px,
    rgba(25, 25, 25, 0.06) 10px 11px
  );
}

.node-card.is-active.is-unreachable {
  opacity: 0.86;
}

.is-unreachable .node-dot,
.is-active.is-unreachable .node-dot {
  background: var(--ink);
  box-shadow: none;
}

.is-unreachable .node-name,
.is-active.is-unreachable .node-name {
  color: var(--muted);
}

.node-dot {
  width: 9px;
  height: 9px;
  background: var(--faint);
  transition: background 0.18s var(--ease-snap);
}

.is-active .node-dot {
  background: var(--ink);
}

.node-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 3px;
}

.node-name {
  color: inherit;
  font-family: var(--font-sans);
  font-size: 19px;
  font-weight: 750;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.node-api {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.02em;
}

.is-active .node-api {
  color: rgba(25, 25, 25, 0.7);
}

.node-count {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  color: var(--muted);
  white-space: nowrap;
}

.node-count strong {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 42px;
  font-weight: 800;
  font-stretch: 112%;
  line-height: 0.8;
  letter-spacing: -0.035em;
}

.node-count small {
  color: var(--muted);
  font-size: 12px;
}

.is-active .node-count small {
  color: rgba(18, 18, 15, 0.7);
}

@media (max-width: 900px) {
  .node-card {
    min-width: 218px;
    flex: 0 0 auto;
    border: 1px solid var(--ink);
    background: var(--panel);
  }

  .node-card.is-active {
    margin: 0;
  }
}

@media (max-width: 560px) {
  .node-card {
    width: 100%;
    min-width: 0;
  }
}
</style>
