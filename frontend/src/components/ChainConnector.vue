<template>
  <div class="chain-connector" aria-hidden="true">
    <span class="line"></span>
    <span class="joint">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="m5 8 7 7 7-7M5 13l7 7 7-7"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="square"
          stroke-linejoin="miter"
        />
      </svg>
    </span>
    <span class="line"></span>
  </div>
</template>

<style scoped>
.chain-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 9px 0;
}

.line {
  width: 1px;
  height: 15px;
  background: var(--ink);
}

.joint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--ink);
  background: var(--panel);
  color: var(--ink);
}

@media (max-width: 620px) {
  .line {
    height: 10px;
  }

  .joint {
    width: 30px;
    height: 30px;
  }
}
</style>
