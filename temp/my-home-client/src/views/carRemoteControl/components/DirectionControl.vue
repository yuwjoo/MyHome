<template>
  <div class="direction-control">
    <div
      class="direction-control-btn direction-control-btn--is-up"
      data-key="button"
      @mytouchstart="handleMytouchstart($event, 'forward')"
      @mytouchend="handleMytouchend($event, 'stop')"
    >
      ↑
    </div>
    <div
      class="direction-control-btn direction-control-btn--is-down"
      data-key="button"
      @mytouchstart="handleMytouchstart($event, 'backward')"
      @mytouchend="handleMytouchend($event, 'stop')"
    >
      ↓
    </div>
    <div
      class="direction-control-btn direction-control-btn--is-left"
      data-key="button"
      @mytouchstart="handleMytouchstart($event, 'left')"
      @mytouchend="handleMytouchend($event, 'stop')"
    >
      ←
    </div>
    <div
      class="direction-control-btn direction-control-btn--is-right"
      data-key="button"
      @mytouchstart="handleMytouchstart($event, 'right')"
      @mytouchend="handleMytouchend($event, 'stop')"
    >
      →
    </div>
    <div
      class="direction-control-btn direction-control-btn--is-stop"
      data-key="button"
      @mytouchstart="handleMytouchstart($event, 'stop')"
      @mytouchend="handleMytouchend($event, 'stop')"
    >
      停止
    </div>
  </div>
</template>

<script setup lang="ts">
export type TriggerName = "forward" | "backward" | "left" | "right" | "stop";

const emit = defineEmits<{
  trigger: [TriggerName];
}>();

const handleMytouchstart = (ev: TouchEvent, val: TriggerName) => {
  const target = ev.touches[0].target as HTMLDivElement;
  target.classList.add("is-active");
  handleTrigger(val);
};

const handleMytouchend = (ev: TouchEvent, val: TriggerName) => {
  const target = ev.changedTouches[0].target as HTMLDivElement;
  target.classList.remove("is-active");
  handleTrigger(val);
};

/**
 * 处理按键触发
 * @param {TriggerName} val 触发名称
 */
const handleTrigger = (val: TriggerName) => {
  emit("trigger", val);
};
</script>

<style lang="scss" scoped>
.direction-control {
  position: absolute;
  bottom: 0;
  left: 0;
  border-radius: 15px;
  padding: 26px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 10px;

  .direction-control-btn {
    user-select: none;
    width: 70px;
    height: 70px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;

    &.is-active {
      background: rgba(76, 175, 80, 0.7);
      transform: scale(0.95);
    }

    &--is-up {
      grid-column: 2;
      grid-row: 1;
    }
    &--is-down {
      grid-column: 2;
      grid-row: 3;
    }
    &--is-left {
      grid-column: 1;
      grid-row: 2;
    }
    &--is-right {
      grid-column: 3;
      grid-row: 2;
    }
    &--is-stop {
      grid-column: 2;
      grid-row: 2;
      background: rgba(255, 255, 255, 0.05);
      font-size: 14px;
    }
  }
}
</style>
