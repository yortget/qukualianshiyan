<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { formatBlockData, formatTimestamp, toIsoString } from '../utils/format'

const props = defineProps({
  block: { type: Object, required: true },
  index: { type: Number, default: 0 },
  latest: { type: Boolean, default: false },
})

const copied = ref(false)
let copyTimer = null

const hash = computed(() => props.block?.hash || '—')
const previousHash = computed(() => props.block?.previousHash || '—')
const data = computed(() => formatBlockData(props.block?.data))
const nonce = computed(() => props.block?.nonce ?? '—')
const timestamp = computed(() => formatTimestamp(props.block?.timestamp))
const dateTime = computed(() => toIsoString(props.block?.timestamp))
const animationDelay = computed(() => `${Math.min(props.index, 8) * 45}ms`)

async function copyHash() {
  try {
    await navigator.clipboard.writeText(hash.value)
  } catch {
    return
  }

  copied.value = true
  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copied.value = false
  }, 1600)
}

onBeforeUnmount(() => {
  window.clearTimeout(copyTimer)
})
</script>

<template>
  <article class="block-card" :class="{ 'is-latest': latest }" :style="{ animationDelay }">
    <header class="block-head">
      <div class="block-identity">
        <span class="block-label">// BLOCK / 区块</span>
        <span class="block-index">#{{ block.index }}</span>
      </div>

      <time class="block-stamp" :datetime="dateTime">
        <span v-if="latest" class="latest-tag">LATEST / 最新</span>
        {{ timestamp }}
      </time>
    </header>

    <div class="block-fields">
      <div class="field field--wide">
        <div class="field-head">
          <span class="field-label">// HASH / 当前哈希</span>
          <button type="button" class="copy-button" @click="copyHash">
            <svg v-if="!copied" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" stroke="currentColor" stroke-width="1.8" />
              <path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" stroke-width="1.8" />
            </svg>
            <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>
        <code class="field-value field-value--hash">{{ hash }}</code>
      </div>

      <div class="field field--wide">
        <span class="field-label">// PREV HASH / 前序哈希</span>
        <code class="field-value field-value--prev">{{ previousHash }}</code>
      </div>

      <div class="field">
        <span class="field-label">// DATA / 区块数据</span>
        <p class="field-value field-value--data">{{ data }}</p>
      </div>

      <div class="field field--nonce">
        <span class="field-label">// NONCE / 随机数</span>
        <p class="field-value field-value--nonce">{{ nonce }}</p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.block-card {
  position: relative;
  overflow: hidden;
  padding-left: 7px;
  border: 1px solid var(--ink);
  border-radius: 0;
  background: var(--card);
  animation: block-rise 0.38s var(--ease-snap) both;
}

.block-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 7px;
  border-right: 1px solid var(--ink);
  background: var(--ink);
}

.block-card.is-latest::before {
  background: var(--signal);
}

.block-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 19px 26px 17px 31px;
  border-bottom: 1px solid var(--ink);
}

.block-identity {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.block-label {
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.14em;
}

.block-index {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 66px;
  font-weight: 800;
  font-stretch: 112%;
  line-height: 0.82;
  letter-spacing: -0.035em;
}

.block-stamp {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 13.5px;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.latest-tag {
  padding: 3px 6px;
  border: 1px solid var(--ink);
  background: var(--signal);
  color: var(--ink);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.block-fields {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(140px, 0.55fr);
  gap: 20px 30px;
  padding: 24px 26px 28px 32px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.field--wide {
  grid-column: 1 / -1;
}

.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 18px;
}

.field-label {
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.field--nonce {
  padding-left: 26px;
  border-left: 1px solid var(--line-soft);
}

.copy-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  border: 1px solid var(--ink);
  border-radius: 0;
  background: transparent;
  color: var(--ink-soft);
  font-size: 13px;
  cursor: pointer;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%);
  transition:
    color 0.18s var(--ease-snap),
    background 0.18s var(--ease-snap);
}

.copy-button:hover {
  background: var(--ink);
  color: var(--paper);
}

.field-value {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.field-value--hash {
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 15.5px;
  line-height: 1.65;
  letter-spacing: 0.005em;
}

.field-value--prev {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 14.5px;
  line-height: 1.65;
}

.field-value--data {
  color: var(--ink);
  font-size: 22px;
  font-weight: 750;
  line-height: 1.45;
  letter-spacing: -0.01em;
}

.field-value--nonce {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 38px;
  font-weight: 800;
  font-stretch: 112%;
  line-height: 0.9;
  letter-spacing: -0.025em;
}

@media (max-width: 720px) {
  .block-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 16px 18px 14px 24px;
  }

  .block-index {
    font-size: 52px;
  }

  .block-stamp {
    font-size: 13px;
  }

  .block-fields {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
    padding: 20px 18px 24px 24px;
  }

  .field--wide {
    grid-column: auto;
  }

  .field--nonce {
    padding-left: 0;
    border-left: 0;
  }

  .field-value--hash {
    font-size: 13.5px;
  }

  .field-value--prev {
    font-size: 13px;
  }

  .field-value--data {
    font-size: 20px;
  }
}

@media (max-width: 440px) {
  .block-card {
    padding-left: 5px;
  }

  .block-card::before {
    width: 5px;
  }

  .block-fields {
    padding-left: 18px;
  }

  .field-value--hash {
    font-size: 12.5px;
  }
}
</style>
