<template>
  <transition name="setting">
    <div v-show="showFlag">
      <div class="back-group">
        <div class="back-content" @click.stop="back">
          <i class="icon-arrow"></i>
          <span>返回</span>
        </div>
      </div>
      <div class="setting-wrapper" v-show="showFlag && setting">
        <div class="setting-color">
          <div class="color-item" v-for="(item, index) in color" :key="index">
            <span
              class="item"
              :style="{ background: item }"
              :class="{ active: item === bookStore.settings.customBg }"
              @click="changeColor(item)"
            >
              <i class="icon-tick" v-show="item === bookStore.settings.customBg"></i>
            </span>
          </div>
        </div>
        <div class="setting-font">
          <div class="font-item" @click="minusFontSize">
            <span class="font-btn">A-</span>
          </div>
          <div class="font-item" @click="addFontSize">
            <span class="font-btn">A+</span>
          </div>
        </div>
      </div>
      <div class="setting-btn">
        <div class="setting-item">
          <div class="icon-wrapper" @click="openChapters">
            <i class="icon-directory"></i>
          </div>
          <span class="title">目录</span>
        </div>
        <div class="setting-item" @click="changeMode">
          <i :class="modeCls"></i>
          <span class="title" v-text="modeText"></span>
        </div>
        <div class="setting-item" @click="openSetting">
          <i class="icon-setting"></i>
          <span class="title">设置</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { useBook } from "@/store/book";

export default {
  name: "setting-btn",
  props: {
    showFlag: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      setting: false,
      color: ["#f6f6f6", "#e1d4b2", "#bed8ab", "#efc1c1", "#dcc49e", "#d9e8ff"],
      bookStore: useBook()
    };
  },
  computed: {
    modeCls() {
      return this.bookStore.settings.isNight ? "icon-brightness" : "icon-night";
    },
    modeText() {
      return this.bookStore.settings.isNight ? "白天" : "夜间";
    }
  },
  methods: {
    back() {
      this.$emit("back");
    },
    openChapters() {
      this.$emit("openChapters");
    },
    changeMode() {
      this.bookStore.setSetting("isNight", !this.bookStore.settings.isNight);
    },
    openSetting() {
      this.setting = !this.setting;
    },
    changeColor(item) {
      if (item === this.bookStore.settings.customBg) return;
      this.bookStore.setSetting("customBg", item);
    },
    minusFontSize() {
      if (this.bookStore.settings.fontSizeScale <= -5) {
        return;
      }
      this.bookStore.setSetting("fontSizeScale", this.bookStore.settings.fontSizeScale - 1);
    },
    addFontSize() {
      if (this.bookStore.settings.fontSizeScale >= 5) {
        return;
      }
      this.bookStore.setSetting("fontSizeScale", this.bookStore.settings.fontSizeScale + 1);
    }
  },
  watch: {
    showFlag(newS) {
      if (newS === false) {
        this.setting = false;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.setting-btn {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50px;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  color: $font-color-ll;
  .setting-item {
    flex: 1;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: $font-size-medium;
    .icon-wrapper {
      font-size: 14px;
    }
    .title {
      font-size: $font-size-small-s;
      line-height: 22px;
    }
  }
}
.back-group {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  height: 44px;
  background: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 44px;
  color: #fff;
  .back-content {
    padding-left: 16px;
    width: 60px;
    .icon-arrow {
      display: inline-block;
      transform: rotate(180deg);
      margin-right: 4px;
    }
  }
}
.setting-wrapper {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 50px;
  background: rgba(0, 0, 0, 0.85);
}
.setting-wrapper .setting-color,
.setting-wrapper .setting-font {
  padding: 14px;
  box-sizing: border-box;
  border-bottom: 1px solid $border-color-dd;
  width: 100%;
  display: flex;
  justify-content: space-between;
}
.setting-wrapper .setting-color .item,
.setting-wrapper .setting-font .item {
  display: inline-block;
  width: 32px;
  height: 32px;
  text-align: center;
  line-height: 32px;
  border-radius: 50%;
  box-sizing: border-box;
  background: #ccc;
}
.setting-wrapper .setting-color .item.active,
.setting-wrapper .setting-font .item.active {
  color: #f44;
  border: 1px solid #f44;
}
.setting-wrapper .setting-color .item.active.icon-tick,
.setting-wrapper .setting-font .item.active.icon-tick {
  font-size: $font-size-medium;
  color: #f44;
}
.setting-wrapper .setting-color .font-btn,
.setting-wrapper .setting-font .font-btn {
  display: inline-block;
  width: 144px;
  height: 38.4px;
  text-align: center;
  line-height: 38.4px;
  border: 1px solid $border-color-d;
  border-radius: 19.2px;
  color: $font-color-l;
  font-size: $font-size-large-x;
  box-sizing: border-box;
}
.setting-enter-active,
.setting-leave-active {
  transition: all 0.4s;
}
.setting-enter-active .back-group,
.setting-leave-active .back-group,
.setting-enter-active .setting-btn,
.setting-leave-active .setting-btn {
  transition: all 0.4s cubic-bezier(0.86, 0.18, 0.82, 1.32);
}
.setting-enter,
.setting-leave-to {
  opacity: 0;
}
.setting-enter .back-group,
.setting-leave-to .back-group {
  transform: translate3d(0, -100%, 0);
}
.setting-enter .setting-btn,
.setting-leave-to .setting-btn {
  transform: translate3d(0, 100%, 0);
}
</style>
