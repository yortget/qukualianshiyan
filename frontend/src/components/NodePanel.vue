<script setup>
import NodeCard from './NodeCard.vue'

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  currentApi: { type: String, default: null },
  loading: { type: Boolean, default: false },
  refreshing: { type: Boolean, default: false },
  autoRefresh: { type: Boolean, default: true },
  currentBlockCount: { type: Number, default: null },
})

const emit = defineEmits(['select', 'refresh', 'refresh-chain', 'update:autoRefresh'])
</script>

<template>
  <section class="network" aria-label="节点与链数据控制">
    <div class="panel-head">
      <div>
        <p class="panel-kicker">// NETWORK / 节点</p>
        <h2 class="panel-title">
          数据源
          <span class="panel-count">{{ nodes.length }}</span>
        </h2>
      </div>

      <button
        type="button"
        class="icon-button"
        :class="{ 'is-loading': loading }"
        :disabled="loading"
        title="刷新节点列表"
        aria-label="刷新节点列表"
        @click="emit('refresh')"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 11a8 8 0 1 0-.7 4.3M20 4.5V11h-6.4"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <div v-if="nodes.length" class="node-list">
      <NodeCard
        v-for="node in nodes"
        :key="node.apiBase"
        :node="node"
        :active="node.apiBase === currentApi"
        :block-count="node.apiBase === currentApi ? currentBlockCount : null"
        @select="emit('select', $event)"
      />
    </div>

    <p v-else class="node-empty">
      {{ loading ? '正在发现节点…' : '暂未发现可达节点，请确认 API 服务已启动。' }}
    </p>

    <div class="controls">
      <button
        type="button"
        class="primary-button"
        :disabled="refreshing || loading"
        @click="emit('refresh-chain')"
      >
        <span v-if="refreshing" class="spinner" aria-hidden="true"></span>
        <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M13 3 5 13.2h5.4L10.5 21 19 10.4h-5.6L13 3Z"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linejoin="round"
          />
        </svg>
        <span>{{ refreshing ? '同步中…' : '刷新链数据' }}</span>
        <span class="button-arrow" aria-hidden="true">↗</span>
      </button>

      <label class="switch-row">
        <span class="switch-copy">
          自动刷新
          <small>2 SEC</small>
        </span>
        <span class="switch">
          <input
            type="checkbox"
            :checked="autoRefresh"
            @change="emit('update:autoRefresh', $event.target.checked)"
          />
          <span class="switch-track" aria-hidden="true">
            <span class="switch-thumb"></span>
          </span>
        </span>
      </label>
    </div>

    <p class="network-hint">
      // 仅展示可访问 <code>/nodeInfo</code> 的节点
    </p>
  </section>
</template>

<style scoped>
.network {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.panel-kicker {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.16em;
}

.panel-title {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 8px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 38px;
  font-weight: 800;
  font-stretch: 108%;
  line-height: 0.95;
  letter-spacing: -0.03em;
}

.panel-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 27px;
  height: 27px;
  margin-top: 2px;
  padding: 0 7px;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--ink);
  border-radius: 0;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%);
  transition:
    background 0.18s var(--ease-snap),
    color 0.18s var(--ease-snap);
}

.icon-button:hover:not(:disabled) {
  background: var(--ink);
  color: var(--paper);
}

.icon-button:active:not(:disabled) {
  background: var(--signal);
  color: var(--ink);
}

.icon-button:disabled {
  cursor: progress;
  opacity: 0.55;
}

.icon-button.is-loading svg {
  animation: spin 0.9s linear infinite;
}

.node-list {
  border-top: 1px solid var(--line);
}

.node-empty {
  padding: 58px 18px;
  border: 1px solid var(--ink);
  background:
    repeating-linear-gradient(
      45deg,
      transparent 0 18px,
      rgba(25, 25, 25, 0.035) 18px 19px
    ),
    var(--panel);
  color: var(--muted);
  font-size: 14px;
  line-height: 1.75;
  text-align: center;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 18px;
  border-top: 1px solid var(--ink);
}

.primary-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 58px;
  padding: 0 16px 0 22px;
  border: 1px solid var(--ink);
  border-radius: 0;
  background: var(--ink);
  color: var(--paper);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%);
  transition:
    background 0.18s var(--ease-snap),
    color 0.18s var(--ease-snap);
}

.primary-button::before {
  content: '';
  width: 5px;
  height: 18px;
  background: var(--signal);
  flex: none;
}

.primary-button:hover:not(:disabled) {
  background: var(--signal);
  color: var(--ink);
}

.primary-button:hover:not(:disabled)::before {
  background: var(--ink);
}

.primary-button:disabled {
  cursor: progress;
  opacity: 0.65;
}

.button-arrow {
  margin-left: auto;
  color: var(--signal);
  font-family: var(--font-mono);
  font-size: 18px;
  line-height: 1;
}

.primary-button:hover:not(:disabled) .button-arrow {
  color: var(--ink);
}

.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--ink-soft);
  font-size: 16px;
  cursor: pointer;
  user-select: none;
}

.switch-copy {
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
}

.switch-copy small {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
}

.switch {
  position: relative;
  display: inline-flex;
  flex: none;
}

.switch input {
  position: absolute;
  inset: 0;
  z-index: 1;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.switch-track {
  display: inline-flex;
  align-items: center;
  width: 46px;
  height: 26px;
  padding: 3px;
  border: 1px solid var(--ink);
  border-radius: 0;
  background: transparent;
  transition: background 0.16s ease;
}

.switch-thumb {
  width: 18px;
  height: 18px;
  background: var(--ink);
  transition: transform 0.16s ease;
}

.switch input:checked + .switch-track {
  background: var(--lime);
}

.switch input:checked + .switch-track .switch-thumb {
  transform: translateX(20px);
}

.switch input:focus-visible + .switch-track {
  outline: 2px solid var(--ink);
  outline-offset: 3px;
}

.network-hint {
  color: var(--faint);
  font-size: 13px;
  line-height: 1.6;
  font-family: var(--font-mono);
}

.network-hint code {
  color: var(--muted);
  font-size: 12.5px;
}

@media (max-width: 900px) {
  .node-list {
    display: flex;
    gap: 10px;
    padding-bottom: 4px;
    overflow-x: auto;
    border-top: 0;
  }

  .controls {
    flex-direction: row;
    align-items: center;
    gap: 22px;
  }

  .primary-button {
    width: auto;
    min-width: 190px;
    padding: 0 20px;
  }

  .switch-row {
    flex: 1;
    justify-content: flex-end;
  }

  .network-hint {
    display: none;
  }
}

@media (max-width: 560px) {
  .panel-title {
    font-size: 32px;
  }

  .node-list {
    flex-direction: column;
    gap: 8px;
    overflow-x: visible;
  }

  .controls {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }

  .primary-button {
    width: 100%;
  }

  .switch-row {
    justify-content: space-between;
  }
}
</style>
