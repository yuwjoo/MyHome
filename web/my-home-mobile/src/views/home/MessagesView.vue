<template>
  <div data-cmp="MessagesView" class="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-32">
    <header class="px-5 pt-10 pb-4 flex items-center justify-between">
      <button
        @click="router.back()"
        class="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom"
      >
        <ChevronLeftIcon :size="18" class="text-foreground" :stroke-width="2" />
      </button>
      <span class="text-lg font-bold text-foreground">消息中心</span>
      <button class="w-10 h-10 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom">
        <CheckCheckIcon :size="18" class="text-primary" :stroke-width="2" />
      </button>
    </header>

    <div class="px-5 flex flex-col gap-3">
      <div
        v-for="msg in MESSAGES"
        :key="msg.id"
        class="flex items-start gap-3 bg-card rounded-2xl px-4 py-4 shadow-custom border border-border"
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          :class="msg.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'"
        >
          <BellIcon :size="18" :stroke-width="2" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-0.5">
            <span class="text-sm font-semibold text-foreground">{{ msg.title }}</span>
            <span class="text-xs text-muted-foreground ml-2 flex-shrink-0">{{ msg.time }}</span>
          </div>
          <div class="text-xs text-muted-foreground leading-relaxed">{{ msg.desc }}</div>
        </div>
        <div v-if="!msg.read" class="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronLeftIcon, BellIcon, CheckCheckIcon } from 'lucide-vue-next'

const router = useRouter()

const MESSAGES = [
  { id: 'm1', title: '设备提醒', desc: '客厅灯已连续开启超过 8 小时', time: '10分钟前', read: false },
  { id: 'm2', title: '安全警报', desc: '入户门锁检测到异常开锁尝试', time: '1小时前', read: false },
  { id: 'm3', title: '场景通知', desc: '睡眠模式已于 23:00 自动启动', time: '昨天', read: true },
  { id: 'm4', title: '设备离线', desc: '走廊摄像头已离线，请检查网络', time: '昨天', read: true },
  { id: 'm5', title: '用电提醒', desc: '本月用电量已超过上月同期 20%', time: '2天前', read: true },
]
</script>
