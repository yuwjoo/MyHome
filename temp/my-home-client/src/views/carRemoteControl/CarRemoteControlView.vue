<template>
  <div
    class="car-remote-control__container"
    @touchstart="handleTouchstart"
    @touchmove="handleTouchmove"
    @touchend="handleTouchend"
    @touchcancel="handleTouchend"
  >
    <img id="stream" src="http://192.168.1.84:81/stream" crossorigin="" />

    <!-- 方向控制区 start -->
    <DirectionControl @trigger="handleDirectinTrigger" />
    <!-- 方向控制区 end -->

    <!-- 油门控制区 start -->
    <ThrottleControl @change="handleThrottleChange" />
    <!-- 油门控制区 end -->

    <!-- 状态显示 -->
    <!-- <div class="status-panel">
      <h2 class="status-title">当前状态</h2>
      <div class="status-content">
        <div class="status-item">
          <div class="status-label">方向</div>
          <div class="status-value" id="directionStatus">停止</div>
        </div>
        <div class="status-item">
          <div class="status-label">油门</div>
          <div class="status-value" id="throttleStatus">0%</div>
        </div>
        <div class="status-item">
          <div class="status-label">连接状态</div>
          <div class="status-value" style="color: #4caf50">已连接</div>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import DirectionControl, { type TriggerName } from "./components/DirectionControl.vue";
import ThrottleControl from "./components/ThrottleControl.vue";

let preThrottleChangeTime = 0; // 上次油门改变时间戳
let throttleChangeTimeout: NodeJS.Timeout | null = null; // 油门改变节流定时器

const handleTouchstart = (ev: TouchEvent) => {
  for (let touch of ev.touches) {
    let target = touch.target as HTMLElement;
    let isKey = target.dataset["key"];

    while (!isKey && target.parentElement) {
      target = target.parentElement as HTMLElement;
      isKey = target.dataset["key"];
    }

    if (isKey) {
      target.dispatchEvent(new TouchEvent("mytouchstart", { touches: [touch] }));
    }
  }
};

const handleTouchmove = (ev: TouchEvent) => {
  for (let touch of ev.touches) {
    let target = touch.target as HTMLElement;
    let isKey = target.dataset["key"];

    while (!isKey && target.parentElement) {
      target = target.parentElement as HTMLElement;
      isKey = target.dataset["key"];
    }

    if (isKey) {
      target.dispatchEvent(new TouchEvent("mytouchmove", { touches: [touch] }));
    }
  }
};

const handleTouchend = (ev: TouchEvent) => {
  for (let touch of ev.changedTouches) {
    let target = touch.target as HTMLElement;
    let isKey = target.dataset["key"];

    while (!isKey && target.parentElement) {
      target = target.parentElement as HTMLElement;
      isKey = target.dataset["key"];
    }

    if (isKey) {
      target.dispatchEvent(new TouchEvent("mytouchend", { changedTouches: [touch] }));
    }
  }
};

/**
 * 方向改变
 * @param dir 方向
 */
const handleDirectinTrigger = (dir: TriggerName) => {
  console.log("方向触发", dir);
  if (dir === "stop") {
    axios({
      url: "http://192.168.1.119/stop",
      method: "POST"
    });
  } else {
    let action: string;
    switch (dir) {
      case "forward":
        action = "24";
        break;
      case "backward":
        action = "25";
        break;
      case "left":
        action = "21";
        break;
      case "right":
        action = "22";
        break;
    }
    axios({
      url: "http://192.168.1.119/start",
      method: "POST",
      data: {
        action
      }
    });
  }
};

/**
 * 油门改变
 * @param num 油门比
 */
const handleThrottleChange = (num) => {
  console.log("油门改变", num);
  const duration = 300 - (Date.now() - preThrottleChangeTime);
  const handler = () => {
    axios({
      url: "http://192.168.1.119/speed",
      method: "POST",
      data: {
        speed: Math.round(num * (1023 - 110)) + 110
      }
    });
  };

  if (throttleChangeTimeout) {
    clearTimeout(throttleChangeTimeout);
  }
  if (duration > 0) {
    throttleChangeTimeout = setTimeout(() => {
      preThrottleChangeTime = Date.now();
      handler();
    }, duration);
  } else {
    preThrottleChangeTime = Date.now();
    handler();
  }
};
</script>

<style lang="scss" scoped>
.car-remote-control__container {
  width: 100vh;
  height: 100vw;
  transform: rotate(90deg);
  transform-origin: 0 0;
  position: fixed;
  top: 0;
  left: 100%;
  background: #1d1e23;
}

.status-panel {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 15px;
  padding: 20px;
  color: white;
  margin-top: 20px;
}

.status-title {
  font-size: 1.3rem;
  margin-bottom: 15px;
}

.status-content {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20px;
}

.status-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
  min-width: 150px;
}

.status-label {
  font-size: 0.9rem;
  color: #bbb;
  margin-bottom: 5px;
}

.status-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #4caf50;
}

.instructions {
  color: #ccc;
  margin-top: 25px;
  font-size: 0.9rem;
  line-height: 1.6;
}

.highlight {
  color: #ffc107;
  font-weight: bold;
}

#stream {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
