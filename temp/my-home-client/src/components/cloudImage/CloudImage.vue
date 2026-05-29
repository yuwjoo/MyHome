<template>
  <van-image :src="localSrcUrl" />
</template>

<script setup lang="ts">
import { request } from "@/utils/axios";

const props = defineProps({
  // 文件id
  fileId: {
    type: String,
    default: ""
  }
});

const localSrcUrl = ref(""); // 本地资源链接

watchEffect(() => {
  request({
    url: `cloudDrive/thumbnail/${props.fileId}`,
    method: "get",
    responseType: "blob"
  }).then((res) => {
    const imageUrl = URL.createObjectURL(res.data);
    localSrcUrl.value = imageUrl;
    nextTick(() => {
      URL.revokeObjectURL(imageUrl);
    });
  });
});
</script>
