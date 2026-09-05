<template>
  <div class="publish-view">
    <div class="page-header">
      <h2>
        <span class="header-icon">
          <IconPublish />
        </span>
        MyHome 项目管理
      </h2>
      <p class="page-desc">统一管理 MyHome 项目</p>
    </div>

    <SecretPublishPanel />

    <VersionManifestPanel
      :manifest="manifest"
      :loading="manifestLoading"
      :project-entries="projectEntries"
      :sync-manifest="syncManifest"
    />

    <div class="tab-bar">
      <button
        class="tab-item"
        :class="{ active: activeTab === 'android' }"
        @click="activeTab = 'android'"
      >
        <span class="tab-icon">
          <IconAndroid />
        </span>
        <span class="tab-label">Android 端</span>
      </button>
      <button
        class="tab-item"
        :class="{ active: activeTab === 'web' }"
        @click="activeTab = 'web'"
      >
        <span class="tab-icon">
          <IconMobile />
        </span>
        <span class="tab-label">Web 移动端</span>
      </button>
      <div class="tab-indicator" :style="indicatorStyle" />
    </div>

    <div class="tab-content">
      <div v-show="activeTab === 'android'" class="project-list">
        <!-- Android 平台下可发布多个项目（MyHome / MyHomeRecipe），按配置列表渲染 -->
        <AndroidPublishPanel
          v-for="proj in androidProjects"
          :key="proj.id"
          :project="proj"
          :current-version="getVersion(proj.platform, proj.name)"
          @version-updated="(v) => updateVersion(proj.platform, proj.name, v)"
        />
      </div>
      <div v-show="activeTab === 'web'" class="project-list">
        <!-- Web 平台下可发布多个项目（my-home-mobile / my-home-recipe），按配置列表渲染 -->
        <WebPublishPanel
          v-for="proj in webProjects"
          :key="proj.id"
          :project="proj"
          :current-version="getVersion(proj.platform, proj.name)"
          @version-updated="(v) => updateVersion(proj.platform, proj.name, v)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 发布主页面
 * 顶部凭证管理面板 + 版本清单 + 各端发布面板（Tab 切换）
 */
import { computed, ref, onMounted } from 'vue';

import IconPublish from '~icons/my/publish';
import IconAndroid from '~icons/my/android';
import IconMobile from '~icons/my/mobile';

import VersionManifestPanel from '@/components/VersionManifestPanel.vue';
import AndroidPublishPanel from '@/components/AndroidPublishPanel.vue';
import WebPublishPanel from '@/components/WebPublishPanel.vue';
import SecretPublishPanel from '@/components/SecretPublishPanel.vue';

import { useVersionManifest } from '@/composables/useVersionManifest';
import { projectList } from '@/config/projects';

const {
  manifest,
  initManifest,
  getVersion,
  updateVersion,
  syncManifest,
} = useVersionManifest();

const manifestLoading = ref(false);
const activeTab = ref<'android' | 'web'>('android');

const indicatorStyle = computed(() => ({
  left: activeTab.value === 'android' ? '0' : '50%',
}));

/** Android 平台项目列表（按 projectList 配置渲染发布面板） */
const androidProjects = computed(() => projectList.filter((p) => p.platform === 'android'));

/** Web 平台项目列表（按 projectList 配置渲染发布面板） */
const webProjects = computed(() => projectList.filter((p) => p.platform === 'web'));

/** 从 manifest 计算各项目条目（供版本清单展示） */
const projectEntries = computed(() =>
  projectList.map((p) => {
    const [platform, projectName] = p.manifestKey.split('.');
    const version = manifest.value[platform]?.[projectName] || '-';
    return {
      id: p.id,
      name: p.name,
      platform: p.platform,
      version,
    };
  }),
);

onMounted(async () => {
  manifestLoading.value = true;
  await initManifest();
  manifestLoading.value = false;
});
</script>

<style lang="scss" scoped>
.publish-view {
  padding: 24px;
  gap: 16px;
  display: flex;
  flex-direction: column;

  .page-header {
    flex-shrink: 0;

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 22px;
      color: #303133;
      margin-bottom: 8px;
    }

    .header-icon {
      display: flex;
      align-items: center;
      color: #409eff;
      font-size: 24px;
    }

    .page-desc {
      font-size: 14px;
      color: #909399;
      margin-left: 32px;
    }
  }

  .project-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .tab-bar {
    position: relative;
    display: flex;
    flex-shrink: 0;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    overflow: hidden;

    .tab-item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border: none;
      background: transparent;
      color: #909399;
      font-size: 14px;
      cursor: pointer;
      transition: color 0.25s, background 0.25s;
      position: relative;
      z-index: 1;

      &:hover {
        color: #606266;
        background: rgba(64, 158, 255, 0.04);
      }

      &.active {
        color: #409eff;

        .tab-icon {
          color: #409eff;
        }
      }

      .tab-icon {
        display: flex;
        align-items: center;
        font-size: 18px;
        color: #c0c4cc;
        transition: color 0.25s;
      }

      .tab-label {
        font-weight: 500;
      }
    }

    .tab-indicator {
      position: absolute;
      bottom: 0;
      width: 50%;
      height: 2px;
      background: #409eff;
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

}
</style>
