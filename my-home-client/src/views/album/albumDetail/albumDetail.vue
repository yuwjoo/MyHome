<template>
  <div class="album-detail">
    <input type="file" multiple accept="image/*,video/*" @change="handleFileChange" />
    <div>{{ image }}</div>
    <img :src="image" />
    <!-- <img
      src="content://com.miui.gallery.open/raw//storage/emulated/0/DCIM/Screenshots/Screenshot_2024-02-25-16-05-46-142_com.tencent.tmgp.sgame.jpg"
    /> -->
    <img
      src="http://android-file/storage/emulated/0/DCIM/Screenshots/Screenshot_2024-02-25-16-05-46-142_com.tencent.tmgp.sgame.jpg"
    />
    <img src="http://gips3.baidu.com/it/u=3886271102,3123389489&fm=3028&app=3028&f=JPEG&fmt=auto?w=1280&h=960" />
  </div>
</template>

<script setup lang="ts">
const image = ref("");

setTimeout(() => {
  console.log("open image");
  window.open("http://192.168.1.138:9000/aa.jpg");
}, 2000);

const handleFileChange = (ev: Event) => {
  const inputEl = ev.target as HTMLInputElement;
  image.value = window.URL.createObjectURL(inputEl.files![0]);
  console.log(inputEl.files);
};
</script>

<style lang="scss" scoped></style>
