<template>
  <div class="publish-view">
    <!-- 顶部标题栏 -->
    <div class="page-header">
      <h2>
        <span class="header-icon">
          <IconPublish />
        </span>
        MyHome 项目发布
      </h2>
      <p class="page-desc">统一管理 MyHome 各端项目的发布流程</p>
    </div>

    <!-- 版本清单面板 -->
    <VersionManifestPanel
      :manifest="manifest"
      :loading="manifestLoading"
      :project-entries="projectEntries"
      :sync-manifest="syncManifest"
    />

    <!-- Android 发布面板 -->
    <AndroidPublishPanel
      :current-version="getVersion('android', 'MyHome')"
      @version-updated="(v) => updateVersion('android', 'MyHome', v)"
    />

    <!-- Web 发布面板 -->
    <WebPublishPanel
      :current-version="getVersion('web', 'my-home-mobile')"
      @version-updated="(v) => updateVersion('web', 'my-home-mobile', v)"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 发布主页面
 * 组合三个独立面板：版本清单、Android 发布、Web 发布
 */
import { computed, ref, onMounted } from 'vue';

import IconPublish from '~icons/my/publish';

import VersionManifestPanel from '@/components/VersionManifestPanel.vue';
import AndroidPublishPanel from '@/components/AndroidPublishPanel.vue';
import WebPublishPanel from '@/components/WebPublishPanel.vue';

import { useVersionManifest } from '@/composables/useVersionManifest';
import { projectList } from '@/config/projects';

const {
  manifest,
  initManifest,
  getVersion,
  updateVersion,
  syncManifest,
} = useVersionManifest();

/** 加载状态由调用方自行管理 */
const manifestLoading = ref(false);

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
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow-y: auto;
  gap: 16px;

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
}
</style>
