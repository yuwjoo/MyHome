<template>
  <div class="comment-input">
    <div class="comment-input__container">
      <textarea
        v-model="content"
        class="comment-input__textarea"
        placeholder="写下你的评论..."
        maxlength="200"
        rows="3"
        @keydown.enter.ctrl="handleSubmit"
        @keydown.enter.meta="handleSubmit"
      ></textarea>
      <div class="comment-input__actions">
        <span class="comment-input__counter">{{ content.length }}/200</span>
        <div class="comment-input__buttons">
          <button class="comment-input__button comment-input__button--cancel" @click="handleCancel">取消</button>
          <button
            class="comment-input__button comment-input__button--submit"
            @click="handleSubmit"
            :disabled="!content.trim()"
          >
            发布
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

// Props定义
interface Props {
  visible?: boolean;
}

withDefaults(defineProps<Props>(), {
  visible: false
});

// Emits定义
const emit = defineEmits<{
  submit: [content: string];
  cancel: [];
}>();

// 评论内容
const content = ref("");

// 处理发布
const handleSubmit = () => {
  if (!content.value.trim()) return;
  emit("submit", content.value.trim());
  content.value = ""; // 清空输入框
};

// 处理取消
const handleCancel = () => {
  content.value = ""; // 清空输入框
  emit("cancel");
};
</script>

<style lang="scss" scoped>
.comment-input {
  position: relative;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;

  &__container {
    display: flex;
    flex-direction: column;
  }

  &__textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    resize: vertical;
    font-size: 14px;
    line-height: 1.5;
    min-height: 80px;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #43bb57;
    }
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }

  &__counter {
    font-size: 12px;
    color: #999;
  }

  &__buttons {
    display: flex;
    gap: 8px;
  }

  &__button {
    padding: 6px 16px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    border: none;

    &--cancel {
      background-color: #f5f5f5;
      color: #666;

      &:hover {
        background-color: #e8e8e8;
      }
    }

    &--submit {
      background-color: $theme-color;
      color: white;

      &:hover:not(:disabled) {
        opacity: 0.9;
      }

      &:disabled {
        background-color: #dcdcdc;
        cursor: not-allowed;
      }
    }
  }
}
</style>
