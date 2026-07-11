<template>
  <el-card shadow="hover" class="section-card">
    <template #header>
      <div class="manifest-header">
        <span class="card-title">版本清单</span>
        <el-button
          type="primary"
          :loading="publishing"
          @click="handlePublish"
        >
          {{ publishing ? '发布中...' : '发布版本清单' }}
        </el-button>
      </div>
    </template>
    <div class="manifest-list" v-loading="loading">
      <div
        v-for="proj in projectEntries"
        :key="proj.id"
        class="manifest-item"
      >
        <span class="manifest-dot" :style="{ background: platformColor[proj.platform] }" />
        <span class="manifest-platform-label">{{ platformLabel[proj.platform] }}</span>
        <span class="manifest-project-name">{{ proj.name }}</span>
        <el-tag type="info" size="small" effect="plain">v{{ proj.version }}</el-tag>
      </div>
      <div v-if="!loading && projectEntries.length === 0" class="manifest-empty">
        <span class="manifest-empty-icon">
          <IconInfo />
        </span>
        <span>暂无版本信息</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import IconInfo from '~icons/my/info';
import { platformLabel, platformColor } from '@/config/projects';
import type { VersionManifest } from '@/types/useWebPublish';

interface ProjectEntry {
  id: string;
  name: string;
  platform: string;
  version: string;
}

const props = defineProps<{
  manifest: VersionManifest;
  loading: boolean;
  projectEntries: ProjectEntry[];
  syncManifest: () => Promise<void>;
}>();

const publishing = ref(false);

const handlePublish = async () => {
  publishing.value = true;
  try {
    await props.syncManifest();
    ElMessage.success('版本清单发布成功');
  } catch (err: any) {
    ElMessage.error(`版本清单发布失败: ${err.message}`);
  } finally {
    publishing.value = false;
  }
};
</script>

<style lang="scss" scoped>
.section-card {
  flex-shrink: 0;

  .card-title {
    font-weight: 600;
    font-size: 15px;
    color: #303133;
  }
}

.manifest-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.manifest-list {
  .manifest-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;

    &:not(:last-child) {
      border-bottom: 1px solid #ebeef5;
    }

    .manifest-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .manifest-platform-label {
      flex-shrink: 0;
      width: 100px;
      font-size: 14px;
      color: #606266;
      font-weight: 500;
    }

    .manifest-project-name {
      flex: 1;
      font-size: 14px;
      color: #303133;
    }
  }

  .manifest-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0;
    color: #c0c4cc;
    font-size: 14px;

    .manifest-empty-icon {
      font-size: 32px;
    }
  }
}
</style>
