<template>
  <div class="book-reader">
    <action-bar>
      <book-page mode="scroll" :pages="pages" />
    </action-bar>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import ActionBar from "./action-bar/action-bar.vue";
import BookPage, { type BookPagePage } from "./book-page/book-page.vue";

defineOptions({
  name: "book-reader"
});

defineProps({
  // 加载上一页
  prevLoadFun: {
    type: Function as PropType<() => Promise<any>>
  },
  // 加载下一页
  nextLoadFun: {
    type: Function as PropType<() => Promise<any>>
  }
});

const pages = ref<BookPagePage[]>([
  {
    id: "1",
    title: "测试标题",
    lines: [
      "奇偶位i问附件我今儿佛教我二哦附件为偶分",
      "sjfojweofjoweijfoweijfowejfoihweohfowehfoihweiofhoweihfowiheofihweofhwoe"
    ]
  },
  {
    id: "2",
    title: "测试标题",
    lines: [
      "奇偶位i问附件我今儿佛教我二哦附件为偶分",
      "sjfojweofjoweijfoweijfowejfoihweohfowehfoihweiofhoweihfowiheofihweofhwoe"
    ]
  },
  {
    id: "3",
    title: "测试标题",
    lines: [
      "奇偶位i问附件我今儿佛教我二哦附件为偶分",
      "sjfojweofjoweijfoweijfowejfoihweohfowehfoihweiofhoweihfowiheofihweofhwoe"
    ]
  },
  {
    id: "4",
    title: "测试标题",
    lines: [
      "奇偶位i问附件我今儿佛教我二哦附件为偶分",
      "sjfojweofjoweijfoweijfowejfoihweohfowehfoihweiofhoweihfowiheofihweofhwoe"
    ]
  },
  {
    id: "5",
    title: "测试标题",
    lines: [
      "奇偶位i问附件我今儿佛教我二哦附件为偶分",
      "sjfojweofjoweijfoweijfowejfoihweohfowehfoihweiofhoweihfowiheofihweofhwoe"
    ]
  },
  {
    id: "6",
    title: "测试标题",
    lines: [
      "奇偶位i问附件我今儿佛教我二哦附件为偶分",
      "sjfojweofjoweijfoweijfowejfoihweohfowehfoihweiofhoweihfowiheofihweofhwoe"
    ]
  }
]);
</script>
