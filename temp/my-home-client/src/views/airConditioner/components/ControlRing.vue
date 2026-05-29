<template>
  <div class="control-ring">
    <div class="control-ring__center">
      <svg class="control-ring__bg-ring" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="99" fill="none" stroke="#d6d7e2" stroke-width="1" stroke-dasharray="4 6" />
        <circle
          cx="100"
          cy="100"
          r="98"
          fill="none"
          stroke="#886ed8"
          stroke-width="2"
          stroke-dasharray="40 113.86"
          stroke-dashoffset="20"
        />
      </svg>

      <div class="control-ring__color-ring"></div>

      <svg class="control-ring__fg-ring" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="#ced2de"
          stroke-width="10"
          stroke-dasharray="4 43.1"
          stroke-dashoffset="2"
        />
      </svg>

      <div class="control-ring__content-ring">
        <div class="control-ring__content-ring-num">16°C</div>
        <div class="control-ring__content-ring-mode">
          <i-tabler:snowflake />
          <span class="control-ring__content-ring-mode-text">冷</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
$ring-size: 200px; // 圆环尺寸
$ring-padding-1: 25px; // 第1层圆环间距
$ring-padding-2: 55px; // 第2层圆环间距

.control-ring {
  display: flex;
  justify-content: center;
  align-items: center;

  .control-ring__center {
    position: relative;
    width: $ring-size;
    height: $ring-size;

    .control-ring__bg-ring {
      width: 100%;
      height: 100%;
    }

    .control-ring__color-ring {
      width: calc(100% - $ring-padding-1);
      height: calc(100% - $ring-padding-1);
      position: absolute;
      top: $ring-padding-1 / 2;
      left: $ring-padding-1 / 2;
      background: linear-gradient(to bottom, rgb(243, 236, 148), rgb(161, 197, 240), rgb(162, 155, 254));
      border-radius: 50%;
      box-shadow: 0 10px 10px rgba(162, 155, 254, 0.15);
    }

    .control-ring__fg-ring {
      width: calc(100% - $ring-padding-2);
      height: calc(100% - $ring-padding-2);
      position: absolute;
      top: $ring-padding-2 / 2;
      left: $ring-padding-2 / 2;
      background-color: #fff;
      border-radius: 50%;
    }

    .control-ring__content-ring {
      width: calc(100% - $ring-padding-2);
      height: calc(100% - $ring-padding-2);
      position: absolute;
      top: $ring-padding-2 / 2;
      left: $ring-padding-2 / 2;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;

      .control-ring__content-ring-num {
        font-size: 32px;
        color: #333333;
        font-weight: bold;
      }

      .control-ring__content-ring-mode {
        color: #9eaac2;
        margin-top: 10px;
        display: flex;
        align-items: center;

        .control-ring__content-ring-mode-text {
          margin-left: 6px;
        }
      }
    }
  }
}
</style>
