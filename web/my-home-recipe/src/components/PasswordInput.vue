<script setup lang="ts">
/**
 * 密码输入框（带可见性切换）
 * ------------------------------------------------------------
 * 复用全局 .input 样式，右侧提供眼睛按钮切换明文/密文，
 * 便于用户在注册/登录时核对输入。支持 v-model。
 */
import { ref } from 'vue'

import AppIcon from '@/components/AppIcon.vue'

const props = withDefaults(
  defineProps<{
    id: string
    placeholder?: string
    autocomplete?: string
    maxlength?: number
    modelValue: string
  }>(),
  { placeholder: '', autocomplete: 'current-password', maxlength: 32 },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const visible = ref(false)

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function toggle(): void {
  visible.value = !visible.value
}
</script>

<template>
  <div class="password-input">
    <input
      :id="id"
      class="input password-input__field"
      :type="visible ? 'text' : 'password'"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :autocomplete="props.autocomplete"
      :maxlength="props.maxlength"
      @input="onInput"
    />
    <button
      type="button"
      class="password-input__toggle"
      :aria-label="visible ? '隐藏密码' : '显示密码'"
      :title="visible ? '隐藏密码' : '显示密码'"
      @click="toggle"
    >
      <AppIcon :name="visible ? 'eye-off' : 'eye'" :size="1.125" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.password-input {
  position: relative;

  &__field {
    padding-right: 3.25rem;
  }

  &__toggle {
    position: absolute;
    top: 50%;
    right: 0.4375rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.125rem;
    height: 2.125rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--color-ink-300);
    cursor: pointer;
    transform: translateY(-50%);
    transition:
      color 0.15s ease,
      background-color 0.15s ease;

    &:hover {
      color: var(--color-ink-500);
    }

    &:active {
      background: rgba(74, 46, 30, 0.06);
      color: var(--color-ink-700);
    }
  }
}
</style>
