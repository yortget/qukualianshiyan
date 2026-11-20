<script setup>
defineProps({
  tone: { type: String, default: 'loading' },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  retryLabel: { type: String, default: '重试' },
})

defineEmits(['retry'])
</script>

<template>
  <div class="state-card" :class="`state-card--${tone}`">
    <div class="state-icon" aria-hidden="true">
      <span v-if="tone === 'loading'" class="loader-bars"></span>

      <svg v-else-if="tone === 'error'" width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3.6 21 19H3L12 3.6Z"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linejoin="round"
        />
        <path d="M12 9v4.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
        <circle cx="12" cy="16.2" r="0.95" fill="currentColor" />
      </svg>

      <svg v-else width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7.6 12 3.5l8 4.1v8.8L12 20.5l-8-4.1V7.6Z"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linejoin="round"
        />
        <path
          d="m4.4 7.7 7.6 4 7.6-4M12 11.7v8.6"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <p class="state-index">// CHAIN STATE / SYSTEM</p>
    <h2 class="state-title">{{ title }}</h2>
    <p class="state-message">{{ message }}</p>

    <button v-if="tone === 'error'" type="button" class="state-action" @click="$emit('retry')">
      {{ retryLabel }} <span aria-hidden="true">↗</span>
    </button>
  </div>
</template>

<style scoped>
.state-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 66px 30px 62px;
  border: 1px solid var(--ink);
  background:
    repeating-linear-gradient(
      45deg,
      transparent 0 22px,
      rgba(25, 25, 25, 0.028) 22px 23px
    ),
    var(--panel);
  text-align: center;
}

.state-card::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 0;
  width: 56px;
  height: 6px;
  background: var(--ink);
  border-right: 1px solid var(--ink);
  border-bottom: 1px solid var(--ink);
}

.state-card--error::before {
  background: var(--signal);
}

.state-card--empty::before {
  background: transparent;
}

.state-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin-bottom: 20px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
}

.state-card--error .state-icon {
  background: var(--signal);
  color: var(--ink);
}

.state-card--empty .state-icon {
  background: transparent;
  color: var(--muted);
}

.loader-bars {
  width: 30px;
  height: 10px;
  background-image: repeating-linear-gradient(
    90deg,
    var(--paper) 0 5px,
    transparent 5px 10px
  );
  background-size: 20px 100%;
  animation: hatch-slide 0.9s steps(6) infinite;
}

.state-index {
  color: var(--faint);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.17em;
}

.state-title {
  margin-top: 9px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 38px;
  font-weight: 800;
  font-stretch: 108%;
  line-height: 1.1;
  letter-spacing: -0.025em;
}

.state-message {
  max-width: 520px;
  margin-top: 10px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.state-action {
  margin-top: 24px;
  padding: 11px 18px;
  border: 1px solid var(--ink);
  background: var(--ink);
  color: var(--paper);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%);
  transition:
    background 0.18s var(--ease-snap),
    color 0.18s var(--ease-snap);
}

.state-action:hover {
  background: var(--signal);
  color: var(--ink);
}

.state-action span {
  margin-left: 6px;
  font-family: var(--font-mono);
}

@media (max-width: 620px) {
  .state-card {
    padding: 46px 20px 44px;
  }

  .state-title {
    font-size: 32px;
  }

  .state-message {
    font-size: 15px;
  }
}
</style>
