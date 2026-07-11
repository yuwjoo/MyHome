<template>
  <el-card shadow="hover" class="section-card">
    <template #header>
      <div class="panel-header">
        <div class="panel-identity">
          <span class="panel-dot" style="background: #E6A23C" />
          <span class="panel-platform">凭证管理</span>
          <span class="panel-name">.secret</span>
        </div>
      </div>
    </template>

    <div class="panel-body">
      <div class="action-section">
        <div class="action-info">
          <span>压缩 .secret 目录并上传至 OSS（私有权限）</span>
        </div>
        <div class="action-buttons">
          <el-button
            type="primary"
            size="large"
            :loading="isPushing"
            :disabled="isPulling"
            @click="handlePush"
          >
            <template #icon>
              <IconUpload />
            </template>
            {{ isPushing ? '推送中...' : '推送凭证' }}
          </el-button>
          <el-button
            size="large"
            :loading="isPulling"
            :disabled="isPushing"
            @click="handlePull"
          >
            <template #icon>
              <IconDownload />
            </template>
            {{ isPulling ? '拉取中...' : '拉取凭证' }}
          </el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import IconUpload from '~icons/my/publish';
import IconDownload from '~icons/my/info';

import { bridge } from '@/module/bridge';

const isPushing = ref(false);
const isPulling = ref(false);

async function handlePush() {
  try {
    await ElMessageBox.confirm(
      '确认将 .secret 目录压缩并上传至 OSS？上传后将设为私有权限。',
      '确认推送凭证',
      { confirmButtonText: '确认推送', cancelButtonText: '取消', type: 'warning' },
    );
  } catch {
    return;
  }

  isPushing.value = true;

  bridge.send('secret', 'pushSecret', {}, {
    onSuccess: (data) => {
      isPushing.value = false;
      ElMessage.success(`凭证推送成功: ${data.url}`);
    },
    onError: (data) => {
      isPushing.value = false;
      ElMessage.error(`推送失败: ${data.message}`);
    },
  });
}

async function handlePull() {
  try {
    await ElMessageBox.confirm(
      '确认从 OSS 下载凭证并覆盖本地 .secret 目录？',
      '确认拉取凭证',
      { confirmButtonText: '确认拉取', cancelButtonText: '取消', type: 'warning' },
    );
  } catch {
    return;
  }

  isPulling.value = true;

  bridge.send('secret', 'pullSecret', {}, {
    onSuccess: (data) => {
      isPulling.value = false;
      ElMessage.success(`凭证拉取成功，还原至: ${data.targetDir}`);
    },
    onError: (data) => {
      isPulling.value = false;
      ElMessage.error(`拉取失败: ${data.message}`);
    },
  });
}
</script>

<style lang="scss" scoped>
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-identity {
  display: flex;
  align-items: center;
  gap: 10px;

  .panel-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .panel-platform {
    font-weight: 600;
    font-size: 15px;
    color: #303133;
  }

  .panel-name {
    font-size: 13px;
    color: #909399;
  }
}

.panel-body {
  .action-section {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .action-info {
      font-size: 13px;
      color: #909399;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
    }
  }
}
</style>
