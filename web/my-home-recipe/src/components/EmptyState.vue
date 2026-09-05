<script setup lang="ts">
/**
 * 空状态
 * ------------------------------------------------------------
 * 带一个默认的“一碗热气”插画；需要个性化时可通过
 * #illustration 插槽覆盖。动作区走默认插槽。
 */
withDefaults(
  defineProps<{
    title?: string
    desc?: string
  }>(),
  { title: '这里还空空的', desc: '' },
)
</script>

<template>
  <div class="empty">
    <slot name="illustration">
      <!-- 默认插画：热汤碗 + 蒸汽（纯线条，随主题色） -->
      <svg class="empty__art" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="55" class="empty__halo" />
        <!-- 碗身 -->
        <path
          d="M33 57h54c-2.5 16-15 27-27 27s-24.5-11-27-27Z"
          fill="var(--color-surface)"
          stroke="var(--color-brand-200)"
          stroke-width="3"
          stroke-linejoin="round"
        />
        <!-- 碗底边线 -->
        <path
          d="M45 87c3 1.6 9.6 2.5 15 2.5s12-.9 15-2.5"
          fill="none"
          stroke="var(--color-brand-200)"
          stroke-width="3"
          stroke-linecap="round"
        />
        <!-- 蒸汽 -->
        <path
          d="M48 38c-3.5-4.5-3.5-9.5 0-14M60 34c-3.5-4.5-3.5-9.5 0-14M72 38c-3.5-4.5-3.5-9.5 0-14"
          fill="none"
          stroke="var(--color-brand-300)"
          stroke-width="3.4"
          stroke-linecap="round"
        />
        <!-- 小圆点 -->
        <circle cx="46" cy="45" r="2" fill="var(--color-brand-300)" />
        <circle cx="75" cy="47" r="1.6" fill="var(--color-brand-200)" />
      </svg>
    </slot>

    <h3 v-if="title" class="empty__title">{{ title }}</h3>
    <p v-if="desc" class="empty__desc">{{ desc }}</p>

    <div v-if="$slots.default" class="empty__action">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.empty__art {
  width: 9.5rem;
  height: 9.5rem;

  .empty__halo {
    fill: var(--color-brand-50);
  }
}
</style>
