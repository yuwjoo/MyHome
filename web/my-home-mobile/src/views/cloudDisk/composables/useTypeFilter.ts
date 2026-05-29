import { ref, computed } from 'vue'
import {
  CloudIcon, FolderIcon, ImageIcon, VideoIcon,
  MusicIcon, FileTextIcon, ArchiveIcon,
} from 'lucide-vue-next'
import type { FileTypeFilter } from '../data'

/**
 * 类型筛选选项卡配置
 * 包含各组件的图标、标签及对应的文件类型 key
 */
export const TYPE_TABS: { key: FileTypeFilter; label: string; Icon: typeof FolderIcon }[] = [
  { key: 'all',    label: '全部',   Icon: CloudIcon     },
  { key: 'folder', label: '文件夹', Icon: FolderIcon    },
  { key: 'image',  label: '图片',   Icon: ImageIcon     },
  { key: 'video',  label: '视频',   Icon: VideoIcon     },
  { key: 'audio',  label: '音频',   Icon: MusicIcon     },
  { key: 'doc',    label: '文档',   Icon: FileTextIcon  },
  { key: 'zip',    label: '压缩包', Icon: ArchiveIcon   },
]

/**
 * 各分类对应的激活态颜色样式
 */
export const TAB_COLORS: Record<FileTypeFilter, { active: string; dot: string }> = {
  all:     { active: 'text-primary',     dot: 'bg-primary'     },
  folder:  { active: 'text-indigo-500',  dot: 'bg-indigo-500'  },
  image:   { active: 'text-emerald-500', dot: 'bg-emerald-500' },
  video:   { active: 'text-rose-400',    dot: 'bg-rose-400'    },
  audio:   { active: 'text-amber-500',   dot: 'bg-amber-500'   },
  doc:     { active: 'text-blue-500',    dot: 'bg-blue-500'    },
  zip:     { active: 'text-purple-500',  dot: 'bg-purple-500'  },
  default: { active: 'text-muted-foreground', dot: 'bg-muted-foreground' },
}

/**
 * 类型筛选状态管理
 * 封装当前筛选类型及对应选项卡信息的计算逻辑
 */
export function useTypeFilter() {
  const typeFilter = ref<FileTypeFilter>('all')

  const currentTab = computed(() => TYPE_TABS.find((t) => t.key === typeFilter.value)!)

  function resetFilter() {
    typeFilter.value = 'all'
  }

  function setFilter(key: FileTypeFilter) {
    typeFilter.value = key
  }

  return { typeFilter, currentTab, resetFilter, setFilter }
}
