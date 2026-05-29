<template>
  <div data-cmp="ProfileView" class="min-h-screen bg-background flex flex-col max-w-md mx-auto overflow-x-hidden">
    <!-- 用户卡片 -->
    <UserCard
      :user="user"
      @view-detail="router.push('/user-detail')"
      @edit-name="openEditName"
    />

    <!-- 统计三宫格 -->
    <div class="px-5 mb-5">
      <ProfileStatsGrid />
    </div>

    <!-- 菜单列表 -->
    <div class="px-5 mb-5">
      <ProfileMenuList />
    </div>

    <!-- 退出登录按钮 -->
    <div class="px-5 pb-32">
      <button
        class="w-full flex items-center justify-center gap-2.5 py-4 rounded-3xl font-semibold text-sm active:opacity-80 transition-all shadow-custom"
        style="background: linear-gradient(135deg, rgba(234,88,60,0.12) 0%, rgba(249,115,22,0.1) 100%); border: 1.5px solid rgba(234,88,60,0.28); color: rgba(218,72,44,1)"
        @click="showLogout = true"
      >
        <LogOutIcon :size="17" :stroke-width="2" />
        退出登录
      </button>
    </div>

    <!-- 修改昵称抽屉 -->
    <EditNameSheet
      :visible="showEditName"
      v-model="editName"
      @save="saveName"
      @close="showEditName = false"
    />

    <!-- 退出确认抽屉 -->
    <LogoutSheet
      :visible="showLogout"
      @confirm="handleLogout"
      @close="showLogout = false"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ProfileView.vue —— 个人中心页
 * 职责：组合子组件，逻辑委托给 useProfile
 */
import { useRouter } from 'vue-router'
import { LogOutIcon } from 'lucide-vue-next'
import { useProfile } from './composables/useProfile'
import UserCard          from './components/UserCard.vue'
import ProfileStatsGrid  from './components/ProfileStatsGrid.vue'
import ProfileMenuList   from './components/ProfileMenuList.vue'
import EditNameSheet     from './components/EditNameSheet.vue'
import LogoutSheet       from './components/LogoutSheet.vue'

const router = useRouter()
const {
  user, editName,
  showLogout, showEditName,
  openEditName, saveName, handleLogout,
} = useProfile()
</script>
