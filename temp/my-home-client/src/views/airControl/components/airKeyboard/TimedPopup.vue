<template>
  <van-popup class="timed-popup" v-model:show="isShow" position="bottom" round>
    <div class="timed-popup__title">设置定时时间</div>

    <div class="timed-popup__date">
      <span class="timed-popup__date-hours">{{ showHour }}</span>
      <span class="timed-popup__date-separator">:</span>
      <span class="timed-popup__date-minuteNums">{{ showMinute }}</span>
    </div>

    <div class="timed-popup__controls">
      <button class="timed-popup__controls-btn" @click="reduceOneHour">
        <i-tabler:minus class="timed-popup__controls-btn-icon" />
      </button>
      <button class="timed-popup__controls-btn" @click="addOneHour">
        <i-tabler:plus class="timed-popup__controls-btn-icon" />
      </button>
    </div>

    <div class="timed-popup__footer">
      <base-button @click="close">取消</base-button>
      <base-button type="primary" :loading="setTimerLoading" @click="confirmTimer">确认</base-button>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import BaseButton from "@/components-2/base/baseButton/BaseButton.vue";

defineEmits<{
  confirm: []; // 点击确认
}>();

const isShow = ref(false); // 显示弹出层
/**
 * 打开弹出层
 */
const open = (): void => {
  isShow.value = true;
};
/**
 * 关闭弹出层
 */
const close = (): void => {
  isShow.value = false;
};

const hourNum = ref(1); // 小时数值
const minuteNum = ref(0); // 分钟数值
const showHour = computed(() => hourNum.value.toString().padStart(2, "0")); // 展示的小时
const showMinute = computed(() => minuteNum.value.toString().padStart(2, "0")); // 展示的分钟
const setTimerLoading = ref(false); // 设置定时中
/**
 * 增加1小时
 */
const addOneHour = () => {
  hourNum.value = Math.min(9, hourNum.value + 1);
};
/**
 * 减少1小时
 */
const reduceOneHour = () => {
  hourNum.value = Math.max(1, hourNum.value - 1);
};
/**
 * 确认定时
 */
const confirmTimer = () => {
  setTimerLoading.value = true;
  // TODO: 发送指令到Android端
  // ...
  setTimerLoading.value = false;
  close();
};

defineExpose({
  open
});
</script>

<style lang="scss" scoped>
.timed-popup {
  height: 400px;

  // 标题
  .timed-popup__title {
    color: oklch(58.5% 0.233 277.117deg);
    font-size: 20px;
    font-weight: bold;
    margin: 50px 0 40px;
    text-align: center;
  }

  // 展示时间
  .timed-popup__date {
    display: flex;
    justify-content: center;
    font-size: 48px;
    font-weight: bold;
    color: oklch(58.5% 0.233 277.117deg);
    text-align: center;

    .timed-popup__date-hours,
    .timed-popup__date-minuteNums {
      min-width: 60px;
    }

    .timed-popup__date-separator {
      margin: 0 12px;
    }
  }

  // 时间控制按钮
  .timed-popup__controls {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin-top: 16px;

    .timed-popup__controls-btn {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      border: none;
      background-color: transparent;
      padding: 0;
      font-size: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timed-popup__controls-btn:active {
      background-color: oklch(58.5% 0.233 277.117deg);
      color: white;
    }
  }

  // 底部区域
  .timed-popup__footer {
    display: flex;
    gap: 16px;
    padding: 0 16px;
    position: absolute;
    bottom: 50px;
    width: 100%;
    box-sizing: border-box;

    .timed-popup__footer-confirm,
    .timed-popup__footer-cancel {
      flex: 1;
      padding: 15px;
      border: none;
      font-size: 18px;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .timed-popup__footer-confirm {
      background-color: oklch(58.5% 0.233 277.117deg);
      color: white;

      &:hover {
        background-color: darken(#8b5cf6, 10%);
      }
    }

    .timed-popup__footer-cancel {
      background-color: $background-color;
      color: $font-color;

      &:hover {
        background-color: lighten($background-color, 10%);
      }
    }
  }
}
</style>
