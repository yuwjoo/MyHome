<template>
  <div
    class="throttle-control"
    ref="throttleControlRef"
    data-key="thumb"
    @mytouchstart="handleTouchStart"
    @mytouchmove="handleTouchMove"
  >
    <div class="throttle-control__track"></div>
    <div class="throttle-control__handle" ref="handleRef" :style="{ transform: `translateY(${curY}px)` }"></div>
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  change: [number];
}>();

const throttleControlRef = useTemplateRef("throttleControlRef");
const handleRef = useTemplateRef("handleRef");
const maxY = ref(0);
const curY = ref(0);
const startTouchY = ref(0);
const startTouchClientX = ref(0);

watch(curY, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    emit("change", 1 - curY.value / maxY.value);
  }
});

onMounted(() => {
  const style = getComputedStyle(throttleControlRef.value!);
  const height = parseFloat(style["height"]);
  const paddingBottom = parseFloat(style["padding-bottom"]);
  const paddingTop = parseFloat(style["padding-top"]);
  const handleHeight = handleRef.value!.getBoundingClientRect().height;
  maxY.value = height - paddingBottom - paddingTop - handleHeight;
  curY.value = maxY.value;
});

const handleTouchStart = (ev: TouchEvent) => {
  startTouchClientX.value = ev.touches[0].clientX;
  startTouchY.value = curY.value;
};

const handleTouchMove = (ev: TouchEvent) => {
  const diff = startTouchClientX.value - ev.touches[0].clientX;
  const newY = startTouchY.value + diff;
  curY.value = Math.max(0, Math.min(maxY.value, newY));
};
</script>

<style lang="scss" scoped>
.throttle-control {
  position: absolute;
  right: 26px;
  bottom: 26px;
  height: 300px;
  width: 80px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 40px;
  overflow: hidden;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
  padding: 12px 0;
  box-sizing: border-box;

  .throttle-control__track {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to top, #4caf50, #ffc107, #f44336);
    border-radius: 40px;
  }

  .throttle-control__handle {
    position: absolute;
    left: 0;
    right: 0;
    margin: auto;
    width: 60px;
    height: 60px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    color: #333;
    transition: box-shadow 0.3s;

    &:active {
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    }
  }
}
</style>
