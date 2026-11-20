<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  node: { type: Object, default: null },
  mining: { type: Boolean, default: false },
  error: { type: String, default: '' },
  notice: { type: String, default: '' },
})

const emit = defineEmits(['mine'])

const data = ref('')

const canMine = computed(
  () => Boolean(props.node && props.node.reachable !== false && !props.mining),
)

const targetLabel = computed(() => {
  if (!props.node) return '未选择节点'
  const target = `P2P ${props.node.p2pPort ?? '未启动'} · API :${props.node.apiPort ?? '—'}`
  return props.node.reachable === false ? `${target} · 暂不可达` : target
})

watch(
  () => props.notice,
  (value) => {
    if (value) data.value = ''
  },
)

function submit() {
  const value = data.value.trim()
  if (!value || !canMine.value) return
  emit('mine', value)
}
</script>

<template>
  <section class="mine-panel" aria-label="区块挖掘">
    <div class="mine-head">
      <div>
        <p class="mine-kicker">// MINE / 区块挖掘</p>
        <h3 class="mine-title">新建区块</h3>
      </div>
      <span class="mine-badge">MANUAL</span>
    </div>

    <p class="mine-target">
      <span class="mine-target-label">TARGET / 当前节点</span>
      <span class="mine-target-value">{{ targetLabel }}</span>
    </p>

    <form class="mine-form" @submit.prevent="submit">
      <label class="mine-label" for="mine-data">DATA / 区块数据</label>
      <input
        id="mine-data"
        v-model="data"
        class="mine-input"
        type="text"
        autocomplete="off"
        spellcheck="false"
        placeholder="输入要写入新区块的数据…"
        :disabled="!canMine"
      />

      <button class="mine-button" type="submit" :disabled="!canMine || !data.trim()">
        <span v-if="mining" class="mine-loader" aria-hidden="true"></span>
        <svg
          v-else
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M14.8 3.2 20.8 9.2M13.9 4.1l2.1-2.1 2.1 2.1-2.1 2.1-2.1-2.1ZM12.6 8.4 4 17v3h3l8.6-8.6M8.4 4.5c2.9-2.3 7.4-1.1 9.1 1.4M19.5 15.6c2.3-2.9 1.1-7.4-1.4-9.1"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>{{ mining ? '挖掘中…' : '挖掘新区块' }}</span>
        <span class="mine-button-mark" aria-hidden="true"></span>
      </button>
    </form>

    <p class="mine-hint">
      调用当前节点 <code>/mineBlock</code>，与终端里的 <code>mine "数据"</code> 等价。
      成功后通过 P2P 广播，已连接节点会自动同步并在切换端口后看到该区块。
    </p>

    <p v-if="error" class="mine-note mine-note--error" role="alert">
      <span class="mine-note-mark" aria-hidden="true"></span>
      {{ error }}
    </p>
    <p v-else-if="notice" class="mine-note mine-note--ok" role="status">
      <span class="mine-note-mark" aria-hidden="true"></span>
      {{ notice }}
    </p>
  </section>
</template>

<style scoped>
.mine-panel {
  padding-top: 18px;
  border-top: 1px solid var(--line-soft);
}

.mine-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.mine-kicker {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 11.5px;
  letter-spacing: 0.14em;
}

.mine-title {
  margin-top: 7px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 800;
  font-stretch: 108%;
  line-height: 1;
  letter-spacing: -0.025em;
}

.mine-badge {
  flex: none;
  padding: 3px 6px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.mine-target {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 13px;
  padding: 9px 10px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 250, 0, 0.06);
}

.mine-target-label {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.12em;
}

.mine-target-value {
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.mine-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.mine-label {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.1em;
}

.mine-input {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border: 1px solid var(--ink);
  border-radius: 0;
  outline: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 13px;
  transition:
    background 0.18s var(--ease-snap),
    box-shadow 0.18s var(--ease-snap);
}

.mine-input::placeholder {
  color: var(--faint);
}

.mine-input:focus-visible {
  background: var(--card);
  box-shadow: 0 0 0 2px var(--signal);
}

.mine-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.mine-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  height: 43px;
  margin-top: 2px;
  padding: 0 12px;
  border: 1px solid var(--ink);
  border-radius: 0;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%);
  transition:
    background 0.18s var(--ease-snap),
    color 0.18s var(--ease-snap);
}

.mine-button-mark {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 5px;
  background: var(--signal);
}

.mine-button:hover:not(:disabled) {
  background: var(--signal);
  color: var(--ink);
}

.mine-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mine-loader {
  width: 20px;
  height: 9px;
  background-image: repeating-linear-gradient(
    90deg,
    var(--paper) 0 4px,
    transparent 4px 8px
  );
  background-size: 16px 100%;
  animation: hatch-slide 0.9s steps(6) infinite;
}

.mine-hint {
  margin-top: 9px;
  color: var(--faint);
  font-size: 11px;
  line-height: 1.6;
}

.mine-hint code {
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 10.5px;
}

.mine-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 11px;
  padding: 8px 9px;
  border: 1px solid var(--ink);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.mine-note-mark {
  flex: none;
  width: 7px;
  height: 7px;
  margin-top: 4px;
  background: var(--ink);
}

.mine-note--error {
  background: var(--signal-wash);
}

.mine-note--ok {
  background: var(--card);
}

.mine-note--ok .mine-note-mark {
  background: var(--mint);
}

@media (max-width: 560px) {
  .mine-title {
    font-size: 24px;
  }

  .mine-button {
    font-size: 16px;
  }
}
</style>
